"""
Script de seed para insertar datos de ejemplo en la BD.
Útil para probar reportes sin depender del módulo de Ventas.

Ejecutar: cd backend && python -m app.seed
"""

import sys
from decimal import Decimal
from datetime import datetime, timedelta
import random
import string

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models.venta import Venta, VentaDetalle


# ============================================================
# Datos de ejemplo
# ============================================================
PLATILLOS = [
    ("Ceviche Clásico", Decimal("25.00")),
    ("Ceviche Mixto", Decimal("35.00")),
    ("Chicharrón de Pescado", Decimal("28.00")),
    ("Arroz con Mariscos", Decimal("32.00")),
    ("Jalea Mixta", Decimal("38.00")),
    ("Leche de Tigre", Decimal("15.00")),
    ("Sudado de Pescado", Decimal("30.00")),
    ("Parihuela", Decimal("35.00")),
    ("Tiradito de Pescado", Decimal("28.00")),
    ("Chupe de Camarones", Decimal("33.00")),
]

CLIENTES = [
    ("Carlos Méndez", "45123678"),
    ("María López", "40987654"),
    ("Juan Pérez", "46789012"),
    (None, None),
    ("Ana García", "41234567"),
]


def _generar_numero_venta(n: int) -> str:
    """Genera un número de comprobante único: VENTA-YYYYMMDD-NNN."""
    ahora = datetime.now()
    return f"VENTA-{ahora.strftime('%Y%m%d')}-{n:03d}"


def _crear_venta(db: Session, n: int) -> Venta:
    """Crea una venta con entre 1 y 4 ítems."""
    fecha_base = datetime.now() - timedelta(days=random.randint(0, 7))
    cliente, documento = random.choice(CLIENTES)

    num_items = random.randint(1, 4)
    items_elegidos = random.sample(PLATILLOS, num_items)

    detalles_data = []
    subtotal = Decimal("0.00")
    for platillo_nombre, precio in items_elegidos:
        cantidad = random.randint(1, 3)
        sub = precio * cantidad
        subtotal += sub
        detalles_data.append(
            VentaDetalle(
                platillo_nombre=platillo_nombre,
                cantidad=cantidad,
                precio_unitario=precio,
                subtotal=sub,
            )
        )

    igv = subtotal * Decimal("0.18")
    total = subtotal + igv

    venta = Venta(
        numero=_generar_numero_venta(n),
        fecha=fecha_base,
        cliente_nombre=cliente,
        cliente_documento=documento,
        subtotal=round(subtotal, 2),
        igv=round(igv, 2),
        total=round(total, 2),
        estado=random.choice(["emitida", "pagada", "emitida", "pagada"]),
        observaciones=None,
    )
    venta.detalles = detalles_data
    return venta


def seed_database(num_ventas: int = 5) -> None:
    """Inserta datos de ejemplo en la base de datos."""
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)

    print(f"Insertando {num_ventas} ventas de ejemplo...")
    db = SessionLocal()
    try:
        for i in range(1, num_ventas + 1):
            venta = _crear_venta(db, i)
            db.add(venta)
        db.commit()
        print(f"✅ {num_ventas} ventas insertadas exitosamente.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al insertar datos: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("🐟 Cevichería D'Peñas — Seed de datos de ejemplo")
    print("=" * 50)
    seed_database()
    print("=" * 50)
    print("Listo. Puedes probar los reportes en:")
    print("  GET http://localhost:8000/api/reports/sales/1/comprobante")
    print("  GET http://localhost:8000/api/reports/sales/1/ticket")
