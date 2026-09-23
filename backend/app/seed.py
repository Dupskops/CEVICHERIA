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
from app.models.reserva import Mesa, Reserva


# ============================================================
# Datos de ejemplo
# ============================================================
MESAS = [
    {"numero": "M-01", "capacidad": 2, "area": "Terraza"},
    {"numero": "M-02", "capacidad": 2, "area": "Terraza"},
    {"numero": "M-03", "capacidad": 2, "area": "Terraza"},
    {"numero": "M-04", "capacidad": 2, "area": "Sala principal"},
    {"numero": "M-05", "capacidad": 2, "area": "Sala principal"},
    {"numero": "M-06", "capacidad": 2, "area": "Sala principal"},
    {"numero": "M-07", "capacidad": 4, "area": "Ventanal"},
    {"numero": "M-08", "capacidad": 4, "area": "Ventanal"},
    {"numero": "M-09", "capacidad": 4, "area": "Ventanal"},
    {"numero": "M-10", "capacidad": 4, "area": "Sala principal"},
    {"numero": "M-11", "capacidad": 4, "area": "Sala principal"},
    {"numero": "M-12", "capacidad": 4, "area": "Terraza"},
    {"numero": "M-13", "capacidad": 6, "area": "Ventanal"},
    {"numero": "M-14", "capacidad": 6, "area": "Ventanal"},
    {"numero": "M-15", "capacidad": 6, "area": "Sala principal"},
]

RESERVAS_EJEMPLO = [
    {"hora": "13:00", "comensales": 4, "mesa_numero": "M-07", "estado": "confirmada"},
    {"hora": "13:30", "comensales": 6, "mesa_numero": "M-13", "estado": "confirmada"},
    {"hora": "20:00", "comensales": 2, "mesa_numero": "M-01", "estado": "confirmada"},
    {"hora": "20:30", "comensales": 4, "mesa_numero": "M-10", "estado": "confirmada"},
    {"hora": "12:00", "comensales": 2, "mesa_numero": "M-05", "estado": "cancelada"},
]
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


def seed_mesas(db: Session) -> None:
    """Inserta las 15 mesas del restaurante si aún no existen."""
    existentes = db.query(Mesa).count()
    if existentes > 0:
        print(f"ℹ️  Mesas ya existentes ({existentes}). Se omiten.")
        return

    for data in MESAS:
        db.add(Mesa(**data))
    db.commit()
    print(f"✅ {len(MESAS)} mesas insertadas.")


def _crear_reserva(db: Session, n: int) -> Reserva:
    """Crea una reserva de ejemplo para hoy en una mesa libre."""
    fecha = datetime.now().date()
    data = RESERVAS_EJEMPLO[n % len(RESERVAS_EJEMPLO)]
    mesa = db.query(Mesa).filter(Mesa.numero == data["mesa_numero"]).first()

    return Reserva(
        codigo=f"RST-{fecha.strftime('%Y%m%d')}-{n + 1:03d}",
        cliente_nombre=random.choice([c for c, _ in CLIENTES if c]) or "Cliente Ejemplo",
        cliente_telefono="9" + str(random.randint(10000000, 99999999)),
        fecha=fecha,
        hora=data["hora"],
        comensales=data["comensales"],
        mesa_id=mesa.id if mesa else 1,
        estado=data["estado"],
        notas="Reserva de ejemplo para pruebas.",
    )


def seed_reservas(num_reservas: int = 5) -> None:
    """Inserta reservas de ejemplo en la base de datos."""
    db = SessionLocal()
    try:
        seed_mesas(db)
        print(f"Insertando {num_reservas} reservas de ejemplo...")
        for i in range(num_reservas):
            db.add(_crear_reserva(db, i))
        db.commit()
        print(f"✅ {num_reservas} reservas insertadas. Disponibilidad en:")
        print("  GET http://localhost:8000/api/reservas/disponibilidad?fecha=AAAA-MM-DD&hora=20:00")
    except Exception as e:
        db.rollback()
        print(f"❌ Error al insertar reservas: {e}")
        sys.exit(1)
    finally:
        db.close()


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
    seed_reservas()
    print("=" * 50)
    print("Listo. Puedes probar los reportes en:")
    print("  GET http://localhost:8000/api/reports/sales/1/comprobante")
    print("  GET http://localhost:8000/api/reports/sales/1/ticket")
