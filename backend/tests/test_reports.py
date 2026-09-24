"""
Pruebas del módulo de Reportes — Cevichería D'Peñas.

Prueba la generación de comprobantes PDF y tickets de comanda,
incluyendo el requisito de rendimiento (< 3 segundos).

Ejecutar con: pytest tests/test_reports.py -v
"""

import time
import pytest
from decimal import Decimal
from datetime import datetime
from httpx import AsyncClient, ASGITransport
from unittest.mock import MagicMock

from app.main import app
from app.database import get_db
from app.models.models import Venta, DetalleVenta
from app.routers.usuarios import get_current_user  # Importación de la dependencia de seguridad

from app.services.report_service import (
    generar_comprobante_venta,
    generar_ticket_comanda,
)

# ============================================================
# Fixtures
# ============================================================

class FakeVenta:
    """Objeto que simula una venta con detalles para pruebas."""

    def __init__(self):
        self.id = 1
        self.numero = "VENTA-20260922-001"
        
        self.fecha = datetime(2026, 9, 22).date()
        self.hora = datetime(2026, 9, 22, 14, 30).time()
        
        self.cliente_nombre = "Carlos Méndez"
        self.rucDni = "45123678"
        self.subtotal = Decimal("68.00")
        self.igv = Decimal("12.24")
        self.total = Decimal("80.24")
        self.estado = "pagada"
        self.observaciones = None
        
        p1 = MagicMock(); p1.nombre = "Ceviche Clásico"
        p2 = MagicMock(); p2.nombre = "Leche de Tigre"
        p3 = MagicMock(); p3.nombre = "Chicharrón de Pescado"

        self.detalles = [
            MagicMock(
                platillo=p1,
                cantidad=2,
                precio_unitario=Decimal("25.00"),
                subtotal=Decimal("50.00"),
            ),
            MagicMock(
                platillo=p2,
                cantidad=1,
                precio_unitario=Decimal("15.00"),
                subtotal=Decimal("15.00"),
            ),
            MagicMock(
                platillo=p3,
                cantidad=1,
                precio_unitario=Decimal("3.00"),
                subtotal=Decimal("3.00"),
            ),
        ]


# ============================================================
# Test 1: Comprobante PDF — contenido válido
# ============================================================

def test_comprobante_pdf_es_valido():
    """
    Verifica que el comprobante PDF se genera correctamente,
    retorna bytes no vacíos y contiene la cabecera PDF.
    """
    venta = FakeVenta()
    pdf_bytes = generar_comprobante_venta(venta)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes[:5] == b"%PDF-"
    print(f"\n📋 Comprobante generado: {len(pdf_bytes)} bytes")


# ============================================================
# Test 2: Ticket PDF — contenido válido
# ============================================================

def test_ticket_pdf_es_valido():
    """
    Verifica que el ticket térmico se genera correctamente,
    retorna bytes no vacíos y contiene la cabecera PDF.
    """
    venta = FakeVenta()
    pdf_bytes = generar_ticket_comanda(venta)

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes[:5] == b"%PDF-"
    print(f"\n🎫 Ticket generado: {len(pdf_bytes)} bytes")


# ============================================================
# Test 3: Comprobante PDF — rendimiento < 3 segundos
# ============================================================

def test_comprobante_rendimiento():
    """
    Verifica que la generación del comprobante es menor a 3 segundos.
    Requisito explícito del proyecto.
    """
    venta = FakeVenta()

    inicio = time.perf_counter()
    pdf_bytes = generar_comprobante_venta(venta)
    fin = time.perf_counter()

    duracion = fin - inicio
    assert duracion < 3.0, (
        f"La generación del comprobante tardó {duracion:.2f}s, "
        f"excediendo el límite de 3 segundos."
    )
    print(f"\n⏱️ Comprobante generado en {duracion:.3f}s (< 3s ✓)")


# ============================================================
# Test 4: Ticket PDF — rendimiento < 3 segundos
# ============================================================

def test_ticket_rendimiento():
    """
    Verifica que la generación del ticket es menor a 3 segundos.
    """
    venta = FakeVenta()

    inicio = time.perf_counter()
    pdf_bytes = generar_ticket_comanda(venta)
    fin = time.perf_counter()

    duracion = fin - inicio
    assert duracion < 3.0, (
        f"La generación del ticket tardó {duracion:.2f}s, "
        f"excediendo el límite de 3 segundos."
    )
    print(f"\n⏱️ Ticket generado en {duracion:.3f}s (< 3s ✓)")


# ============================================================
# Helper: crear mock de DB con dependency override
# ============================================================

def _mock_venta_ejemplo():
    """Crea un mock de Venta para pruebas de endpoints."""
    mock_venta = MagicMock(spec=Venta)
    mock_venta.id = 1
    mock_venta.numero = "VENTA-TEST-001"
    
    mock_venta.fecha = datetime(2026, 9, 22).date()
    mock_venta.hora = datetime(2026, 9, 22, 14, 30).time()
    
    mock_venta.cliente_nombre = "Cliente Test"
    mock_venta.rucDni = "12345678"
    mock_venta.subtotal = Decimal("25.00")
    mock_venta.igv = Decimal("4.50")
    mock_venta.total = Decimal("29.50")
    mock_venta.estado = "pagada"
    
    mock_platillo = MagicMock()
    mock_platillo.nombre = "Ceviche Clásico"
    
    mock_venta.detalles = [
        MagicMock(
            platillo=mock_platillo,
            cantidad=1,
            precio_unitario=Decimal("25.00"),
            subtotal=Decimal("25.00"),
        )
    ]
    return mock_venta


def _override_db(venta):
    """Retorna una función que simula get_db con la venta dada."""
    def _get_db():
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = venta
        try:
            yield mock_db
        finally:
            pass
    return _get_db


def _override_db_none():
    """Retorna una función que simula get_db sin venta (None)."""
    def _get_db():
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.first.return_value = None
        try:
            yield mock_db
        finally:
            pass
    return _get_db


def _override_get_current_user():
    """Simula un usuario logueado con token válido para pruebas protegidas."""
    return {"idUsuario": 1, "usuario": "admin_test", "rol": "admin"}


# ============================================================
# Test 5: Endpoint comprobante — HTTP 200 + PDF
# ============================================================

@pytest.mark.asyncio
async def test_endpoint_comprobante():
    """
    Prueba: GET /api/reports/sales/1/comprobante
    Verifica que retorna HTTP 200 con Content-Type application/pdf.
    """
    app.dependency_overrides[get_db] = _override_db(_mock_venta_ejemplo())
    app.dependency_overrides[get_current_user] = _override_get_current_user  # Inyección JWT

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/reports/sales/1/comprobante")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:5] == b"%PDF-"
    print(f"\n📄 Endpoint comprobante: 200 OK, {len(response.content)} bytes")


# ============================================================
# Test 6: Endpoint ticket — HTTP 200 + PDF
# ============================================================

@pytest.mark.asyncio
async def test_endpoint_ticket():
    """
    Prueba: GET /api/reports/sales/1/ticket
    Verifica que retorna HTTP 200 con Content-Type application/pdf.
    """
    app.dependency_overrides[get_db] = _override_db(_mock_venta_ejemplo())
    app.dependency_overrides[get_current_user] = _override_get_current_user  # Inyección JWT

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/reports/sales/1/ticket")

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content[:5] == b"%PDF-"
    print(f"\n🎫 Endpoint ticket: 200 OK, {len(response.content)} bytes")


# ============================================================
# Test 7: Endpoint comprobante — venta no existe → 404
# ============================================================

@pytest.mark.asyncio
async def test_endpoint_venta_no_existe():
    """
    Prueba: GET /api/reports/sales/9999/comprobante
    Verifica que retorna HTTP 404 cuando la venta no existe.
    """
    app.dependency_overrides[get_db] = _override_db_none()
    app.dependency_overrides[get_current_user] = _override_get_current_user  # Inyección JWT

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/reports/sales/9999/comprobante")

    app.dependency_overrides.clear()

    assert response.status_code == 404
    print(f"\n❌ Venta inexistente: 404 correctamente")


# ============================================================
# Test 8: Comprobante sin cliente
# ============================================================

def test_comprobante_sin_cliente():
    """
    Verifica que el comprobante funciona correctamente
    cuando el cliente es None (venta sin datos de cliente).
    """
    venta = FakeVenta()
    venta.cliente_nombre = None
    venta.rucDni = None

    pdf_bytes = generar_comprobante_venta(venta)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0
    assert pdf_bytes[:5] == b"%PDF-"
    print(f"\n📋 Comprobante sin cliente: válido ({len(pdf_bytes)} bytes)")