"""
Script de seed para insertar datos de ejemplo en la BD.
Útil para probar reportes sin depender del módulo de Ventas.

Ejecutar: cd backend && python -m app.seed
"""

import sys
from decimal import Decimal
from datetime import datetime, timedelta
import random

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models.models import Usuario, Reserva, Platillo, Venta, DetalleVenta

# ============================================================
# Datos de ejemplo
# ============================================================
PLATILLOS_DATA = [
    ("Ceviche Clásico", 25.00),
    ("Ceviche Mixto", 35.00),
    ("Chicharrón de Pescado", 28.00),
    ("Arroz con Mariscos", 32.00),
    ("Jalea Mixta", 38.00),
    ("Leche de Tigre", 15.00),
    ("Sudado de Pescado", 30.00),
    ("Parihuela", 35.00),
    ("Tiradito de Pescado", 28.00),
    ("Chupe de Camarones", 33.00),
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

def seed_database(num_ventas: int = 5) -> None:
    """Inserta datos de ejemplo respetando las dependencias del diagrama ER."""
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Crear un Usuario base (requerido para la Reserva)
        usuario = db.query(Usuario).first()
        if not usuario:
            usuario = Usuario(usuario="admin_test", clave="1234", rol="admin")
            db.add(usuario)
            db.commit()
            db.refresh(usuario)

        # 2. Crear una Reserva base (requerida para la Venta)
        reserva = db.query(Reserva).first()
        if not reserva:
            reserva = Reserva(
                Usuarios_idUsuario=usuario.idUsuario,
                nombre="Mesa Principal (Test)",
                fecha=datetime.now().date(),
                hora=datetime.now().time(),
                estado="confirmada"
            )
            db.add(reserva)
            db.commit()
            db.refresh(reserva)

        # 3. Crear Platillos en la BD
        platillos_db = db.query(Platillo).all()
        if not platillos_db:
            for nombre, precio in PLATILLOS_DATA:
                db.add(Platillo(nombre=nombre, precio=precio))
            db.commit()
            platillos_db = db.query(Platillo).all()

        # 4. Crear las Ventas
        print(f"Insertando {num_ventas} ventas de ejemplo...")
        for i in range(1, num_ventas + 1):
            fecha_base = datetime.now() - timedelta(days=random.randint(0, 7))
            cliente, documento = random.choice(CLIENTES)

            num_items = random.randint(1, 4)
            items_elegidos = random.sample(platillos_db, num_items)

            detalles_data = []
            subtotal = Decimal("0.00")
            
            for platillo in items_elegidos:
                cantidad = random.randint(1, 3)
                sub = Decimal(str(platillo.precio)) * cantidad
                subtotal += sub
                detalles_data.append(
                    DetalleVenta(
                        Platillos_idPlatillo=platillo.idPlatillo, # Enlace FK al modelo real
                        cantidad=cantidad,
                        precio_unitario=Decimal(str(platillo.precio)),
                        subtotal=sub,
                    )
                )

            igv = subtotal * Decimal("0.18")
            total = subtotal + igv

            venta = Venta(
                Reservas_idReserva=reserva.idReserva,
                Reservas_Usuarios_IdUsuario=reserva.Usuarios_idUsuario,
                numero=_generar_numero_venta(i),
                fecha=fecha_base.date(),
                hora=fecha_base.time(),
                cliente_nombre=cliente,
                rucDni=documento, # Ajustado al nuevo nombre del campo
                subtotal=round(subtotal, 2),
                igv=round(igv, 2),
                total=round(total, 2),
                estado=random.choice(["emitida", "pagada"]),
                observaciones=None,
            )
            venta.detalles = detalles_data
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