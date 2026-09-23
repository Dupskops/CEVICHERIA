"""
Pruebas del módulo de Reservas — Cevichería D'Peñas.

Cubre CRUD de reservas, disponibilidad de mesas y cancelación,
validando la regla de franja exacta (30 min) y el beneficio clave
de reducción del registro manual (AGENTS.md §7).

Ejecutar con: pytest tests/test_reservas.py -v
"""

import time
from datetime import date, timedelta

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.reserva import Mesa
from app.seed import MESAS

FECHA_TEST = "2026-12-01"  # fecha futura fija
HORA_TEST = "20:00"


# ============================================================
# Fixture: BD SQLite en memoria + override de get_db
# ============================================================

@pytest.fixture()
def db():
    """Crea una BD SQLite en memoria, siembra las 15 mesas y
    sobrescribe la dependencia get_db de la aplicación."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = SessionLocal()
    session.add_all([Mesa(**m) for m in MESAS])
    session.commit()

    def _override_db():
        yield session

    app.dependency_overrides[get_db] = _override_db

    yield session

    app.dependency_overrides.clear()
    session.close()
    engine.dispose()


def _cliente() -> AsyncClient:
    """Retorna un cliente ASGI apuntando a la app (override activo)."""
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


# ============================================================
# Test 1: Listado de mesas
# ============================================================

@pytest.mark.asyncio
async def test_listar_mesas(db):
    """GET /api/reservas/mesas → 15 mesas configuradas."""
    async with _cliente() as client:
        resp = await client.get("/api/reservas/mesas")

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 15
    assert data[0]["numero"] == "M-01"
    assert data[0]["capacidad"] == 2
    assert data[0]["area"] == "Terraza"
    print("\n🪑 Listado de mesas: 15 correctas")


# ============================================================
# Test 2: Disponibilidad sin reservas
# ============================================================

@pytest.mark.asyncio
async def test_disponibilidad_sin_reservas(db):
    """GET /api/reservas/disponibilidad → todas las mesas disponibles."""
    async with _cliente() as client:
        resp = await client.get(
            "/api/reservas/disponibilidad",
            params={"fecha": FECHA_TEST, "hora": HORA_TEST},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 15
    assert data["disponibles"] == 15
    assert all(m["estado"] == "disponible" for m in data["mesas"])
    print("\n📅 Disponibilidad sin reservas: 15/15 disponibles")


# ============================================================
# Test 3: Disponibilidad filtra por comensales
# ============================================================

@pytest.mark.asyncio
async def test_disponibilidad_filtra_comensales(db):
    """GET disponibilidad con comensales=6 → solo mesas de 6 (3 mesas)."""
    async with _cliente() as client:
        resp = await client.get(
            "/api/reservas/disponibilidad",
            params={"fecha": FECHA_TEST, "hora": HORA_TEST, "comensales": 6},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert all(m["capacidad"] >= 6 for m in data["mesas"])
    print("\n🔢 Disponibilidad comensales=6: 3 mesas (cap. 6)")


# ============================================================
# Test 4: Crear reserva exitosa
# ============================================================

@pytest.mark.asyncio
async def test_crear_reserva_ok(db):
    """POST /api/reservas → 201 con código correlativo y mesa."""

    def _body(mesa_id: int = 1, hora: str = HORA_TEST):
        return {
            "cliente_nombre": "Carlos Méndez",
            "cliente_telefono": "999123456",
            "fecha": FECHA_TEST,
            "hora": hora,
            "comensales": 2,
            "mesa_id": mesa_id,
            "notas": "Ventana preferida",
        }

    async with _cliente() as client:
        resp = await client.post("/api/reservas", json=_body())

    assert resp.status_code == 201
    data = resp.json()
    assert data["codigo"] == "RST-20261201-001"
    assert data["estado"] == "confirmada"
    assert data["mesa_numero"] == "M-01"
    assert data["cliente_nombre"] == "Carlos Méndez"
    print("\n✅ Reserva creada:", data["codigo"])


# ============================================================
# Test 5: Crear reserva con exceso de comensales → 400
# ============================================================

@pytest.mark.asyncio
async def test_crear_reserva_exceso_comensales(db):
    """Mesa M-01 (cap. 2) con 4 comensales → 400."""
    async with _cliente() as client:
        resp = await client.post(
            "/api/reservas",
            json={
                "cliente_nombre": "María López",
                "fecha": FECHA_TEST,
                "hora": HORA_TEST,
                "comensales": 4,
                "mesa_id": 1,
            },
        )

    assert resp.status_code == 400
    assert "admite hasta 2" in resp.json()["detail"]
    print("\n⛔ Exceso de comensales: 400 correcto")


# ============================================================
# Test 6: Conflicto de disponibilidad → 409
# ============================================================

@pytest.mark.asyncio
async def test_crear_reserva_conflicto(db):
    """Misma mesa + fecha + hora → 409 (viola franja exacta)."""
    payload = {
        "cliente_nombre": "Juan Pérez",
        "fecha": FECHA_TEST,
        "hora": HORA_TEST,
        "comensales": 2,
        "mesa_id": 1,
    }

    async with _cliente() as client:
        prim = await client.post("/api/reservas", json=payload)
        seg = await client.post("/api/reservas", json=payload)

    assert prim.status_code == 201
    assert seg.status_code == 409
    assert "ya está reservada" in seg.json()["detail"]
    print("\n🔁 Conflicto (franja exacta): 409 correcto")


# ============================================================
# Test 7: Mesa inexistente → 404
# ============================================================

@pytest.mark.asyncio
async def test_crear_reserva_mesa_inexistente(db):
    """POST con mesa_id=999 → 404."""
    async with _cliente() as client:
        resp = await client.post(
            "/api/reservas",
            json={
                "cliente_nombre": "Ana García",
                "fecha": FECHA_TEST,
                "hora": HORA_TEST,
                "comensales": 2,
                "mesa_id": 999,
            },
        )

    assert resp.status_code == 404
    print("\n🧩 Mesa inexistente: 404 correcto")


# ============================================================
# Test 8: Reserva en hora pasada → 400
# ============================================================

@pytest.mark.asyncio
async def test_crear_reserva_hora_pasada(db):
    """Fecha en el pasado → 400."""
    ayer = (date.today() - timedelta(days=1)).isoformat()
    async with _cliente() as client:
        resp = await client.post(
            "/api/reservas",
            json={
                "cliente_nombre": "Luis Torres",
                "fecha": ayer,
                "hora": "12:00",
                "comensales": 2,
                "mesa_id": 1,
            },
        )

    assert resp.status_code == 400
    assert "pasada" in resp.json()["detail"]
    print("\n⏰ Hora pasada: 400 correcto")


# ============================================================
# Test 9: Cancelar reserva libera la mesa
# ============================================================

@pytest.mark.asyncio
async def test_cancelar_reserva_libera_mesa(db):
    """Crear → cancelar → la mesa vuelve a estar disponible."""
    payload = {
        "cliente_nombre": "Rosa Flores",
        "fecha": FECHA_TEST,
        "hora": HORA_TEST,
        "comensales": 2,
        "mesa_id": 1,
    }

    async with _cliente() as client:
        creada = await client.post("/api/reservas", json=payload)
        reserva_id = creada.json()["id"]

        disp_luego = await client.get(
            "/api/reservas/disponibilidad",
            params={"fecha": FECHA_TEST, "hora": HORA_TEST},
        )
        mesa_antes = next(
            m for m in disp_luego.json()["mesas"] if m["id"] == 1
        )
        assert mesa_antes["estado"] == "reservada"

        cancel = await client.post(f"/api/reservas/{reserva_id}/cancelar")
        disp_final = await client.get(
            "/api/reservas/disponibilidad",
            params={"fecha": FECHA_TEST, "hora": HORA_TEST},
        )

    assert cancel.status_code == 200
    assert cancel.json()["reserva"]["estado"] == "cancelada"
    mesa_despues = next(
        m for m in disp_final.json()["mesas"] if m["id"] == 1
    )
    assert mesa_despues["estado"] == "disponible"
    print("\n🚫 Cancelación: mesa liberada correctamente")


# ============================================================
# Test 10: Cancelar reserva inexistente → 404
# ============================================================

@pytest.mark.asyncio
async def test_cancelar_reserva_inexistente(db):
    """POST cancelar id inexistente → 404."""
    async with _cliente() as client:
        resp = await client.post("/api/reservas/9999/cancelar")

    assert resp.status_code == 404
    print("\n✨ Cancelar inexistente: 404 correcto")


# ============================================================
# Test 11: Obtener reserva inexistente → 404
# ============================================================

@pytest.mark.asyncio
async def test_obtener_reserva_inexistente(db):
    """GET /api/reservas/9999 → 404."""
    async with _cliente() as client:
        resp = await client.get("/api/reservas/9999")

    assert resp.status_code == 404
    print("\n🔍 Reserva inexistente: 404 correcto")


# ============================================================
# Test 12: Eliminar reserva → 204
# ============================================================

@pytest.mark.asyncio
async def test_eliminar_reserva(db):
    """DELETE /api/reservas/{id} → 204 y deja de listarse."""
    async with _cliente() as client:
        creada = await client.post(
            "/api/reservas",
            json={
                "cliente_nombre": "Pedro Rojas",
                "fecha": FECHA_TEST,
                "hora": "13:00",
                "comensales": 2,
                "mesa_id": 2,
            },
        )
        reserva_id = creada.json()["id"]
        resp = await client.delete(f"/api/reservas/{reserva_id}")
        listado = await client.get("/api/reservas")

    assert resp.status_code == 204
    assert all(r["id"] != reserva_id for r in listado.json())
    print("\n🗑️  Eliminación: 204 correcto")


# ============================================================
# Test 13: Listado filtrado por fecha
# ============================================================

@pytest.mark.asyncio
async def test_listar_reservas_por_fecha(db):
    """GET /api/reservas?fecha=... solo devuelve reservas de ese día."""
    async with _cliente() as client:
        await client.post(
            "/api/reservas",
            json={
                "cliente_nombre": "Cliente Hoy",
                "fecha": FECHA_TEST,
                "hora": HORA_TEST,
                "comensales": 2,
                "mesa_id": 3,
            },
        )
        resp = await client.get("/api/reservas", params={"fecha": FECHA_TEST})

    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["fecha"] == FECHA_TEST
    print("\n📆 Filtro por fecha: correcto")


# ============================================================
# Test 14: Ciclo completo con medición (AGENTS.md §7)
# ============================================================

@pytest.mark.asyncio
async def test_ciclo_completo_rendimiento(db):
    """
    Mide el ciclo completo de reserva vía API (disponibilidad → crear →
    confirmar → cancelar) y valida que se resuelve en < 3 segundos,
    sustituyendo el registro manual (cuadernillo/Excel).
    """
    inicio = time.perf_counter()

    async with _cliente() as client:
        disp = await client.get(
            "/api/reservas/disponibilidad",
            params={"fecha": FECHA_TEST, "hora": "19:30"},
        )
        assert disp.status_code == 200
        mesa_libre = next(m for m in disp.json()["mesas"] if m["estado"] == "disponible")

        creada = await client.post(
            "/api/reservas",
            json={
                "cliente_nombre": "Equipo D'Peñas",
                "fecha": FECHA_TEST,
                "hora": "19:30",
                "comensales": mesa_libre["capacidad"],
                "mesa_id": mesa_libre["id"],
            },
        )
        assert creada.status_code == 201

        obtenida = await client.get(f"/api/reservas/{creada.json()['id']}")
        assert obtenida.status_code == 200
        assert obtenida.json()["estado"] == "confirmada"

        cancelada = await client.post(f"/api/reservas/{creada.json()['id']}/cancelar")
        assert cancelada.status_code == 200

    duracion = time.perf_counter() - inicio
    assert duracion < 3.0, (
        f"El ciclo de reserva tardó {duracion:.2f}s, excediendo 3s."
    )
    print(f"\n⚡ Ciclo reserva completo en {duracion:.3f}s (< 3s ✓)")