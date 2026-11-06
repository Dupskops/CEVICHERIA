"""Pruebas aisladas: no consultan Supabase ni modifican datos reales."""
from datetime import datetime, date, time, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.models import Reserva, Usuario, Venta
from app.routers.automation import release_no_shows, require_automation_key
from app.routers.reservas import transition_reservation
from app.config import get_settings


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Usuario(idUsuario=1, usuario="test", clave="test", rol="admin"))
        session.commit()
        yield session
    engine.dispose()


def reserve(db, id, hour, minute=0, state="confirmada", day=5):
    row = Reserva(idReserva=id, Usuarios_idUsuario=1, nombre="Prueba", fecha=date(2026, 11, day),
                  hora=time(hour, minute), estado=state)
    db.add(row)
    db.commit()
    return row


def test_expiration_boundary_states_timezone_and_retries(db):
    reserve(db, 1, 12, 0)  # Exactamente 15 minutos.
    reserve(db, 2, 12, 1)  # Todavía dentro de tolerancia.
    reserve(db, 3, 11, state="ocupada")
    reserve(db, 4, 11, state="cancelada")
    reserve(db, 5, 13)
    reserve(db, 6, 23, day=4)
    reserve(db, 7, 11, state="completada")
    now = datetime(2026, 11, 5, 17, 15, tzinfo=timezone.utc)  # 12:15 en Lima.
    assert set(release_no_shows(db, now)) == {1, 6}
    assert release_no_shows(db, now) == []
    assert db.get(Reserva, 3).estado == "ocupada"
    assert db.get(Reserva, 2).estado == "confirmada"


def test_check_in_protects_reservation_and_checkout_releases(db):
    reserve(db, 1, 12)
    transition_reservation(db, 1, "confirmada", "ocupada")
    assert release_no_shows(db, datetime(2026, 11, 5, 18, tzinfo=timezone.utc)) == []
    assert transition_reservation(db, 1, "ocupada", "completada").estado == "completada"
    with pytest.raises(HTTPException) as error:
        transition_reservation(db, 1, "confirmada", "ocupada")
    assert error.value.status_code == 409


def test_reservations_with_sales_are_not_expired(db):
    reserve(db, 1, 12)
    db.add(Venta(Reservas_idReserva=1, numero="TEST-1"))
    db.commit()
    assert release_no_shows(db, datetime(2026, 11, 5, 18, tzinfo=timezone.utc)) == []


def test_automation_requires_configured_secret(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "AUTOMATION_API_KEY", "")
    with pytest.raises(HTTPException) as error:
        require_automation_key("anything")
    assert error.value.status_code == 503
    monkeypatch.setattr(settings, "AUTOMATION_API_KEY", "test-secret")
    with pytest.raises(HTTPException) as error:
        require_automation_key("wrong")
    assert error.value.status_code == 401
    require_automation_key("test-secret")


def test_http_routes_require_credentials_and_expose_counts(db, monkeypatch):
    from fastapi import FastAPI
    from app.database import get_db
    from app.routers import automation, reservas
    from app.services.auth import crear_token_acceso

    app = FastAPI()
    app.include_router(automation.router)
    app.include_router(reservas.router)
    app.dependency_overrides[get_db] = lambda: db
    monkeypatch.setattr(get_settings(), "AUTOMATION_API_KEY", "test-secret")
    reserve(db, 1, 12, day=4)
    import asyncio
    import httpx

    async def exercise():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/automation/reservas/no-show")
            assert response.status_code == 401
            response = await client.post("/api/reservas/1/check-in")
            assert response.status_code == 401
            response = await client.post("/api/reservas/1/check-in", headers={"Authorization": "Bearer invalid"})
            assert response.status_code == 401
            response = await client.post("/api/reservas/1/check-in", headers={
                "Authorization": "Bearer " + crear_token_acceso({"sub": "admin@dpenas.pe"})
            })
            assert response.status_code == 200
            assert response.json()["estado"] == "ocupada"
            response = await client.post("/api/automation/reservas/no-show", headers={"X-Automation-Key": "test-secret"})
            assert response.status_code == 200
            assert response.json()["liberadas"] == 0
    asyncio.run(exercise())
