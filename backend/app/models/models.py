from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, Integer, String, Float, Date, Time, ForeignKey, DateTime, Numeric, Text

from sqlalchemy.orm import relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = "Usuarios" 

    idUsuario = Column(Integer, primary_key=True, index=True) 
    usuario = Column(String(50), unique=True, nullable=False) 
    clave = Column(String(255), nullable=False) 
    rol = Column(String(20), nullable=False) 

    # Relación: Un usuario puede tener muchas reservas
    reservas = relationship("Reserva", back_populates="propietario")

class Reserva(Base):
    __tablename__ = "Reservas" 

    idReserva = Column(Integer, primary_key=True, index=True) 
    Usuarios_idUsuario = Column(Integer, ForeignKey("Usuarios.idUsuario"), nullable=False) 
    nombre = Column(String(100)) 
    fecha = Column(Date) 
    hora = Column(Time) 
    descripcion = Column(String(255)) 
    estado = Column(String(20)) 
    mesa_id = Column(String(20), nullable=True, default="t1")
    telefono = Column(String(20), nullable=True)
    comensales = Column(Integer, nullable=True, default=2)

    # Relaciones
    propietario = relationship("Usuario", back_populates="reservas")
    ventas = relationship("Venta", back_populates="reserva")

class Platillo(Base):
    __tablename__ = "Platillos" 

    idPlatillo = Column(Integer, primary_key=True, index=True) 
    nombre = Column(String(100), nullable=False) 
    descripcion = Column(String(255), nullable=True)
    precio = Column(Float, nullable=False) 
    emoji = Column(String(10), default="🍲")

    # Relación
    detalles = relationship("DetalleVenta", back_populates="platillo")

# =============================================================
# Nuevos Modelos de Ventas (Integrados del archivo venta.py)
# =============================================================

class Venta(Base):
    """Modelo de una venta / comprobante."""
    __tablename__ = "Ventas"
    idVenta = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Reservas_idReserva = Column(Integer, ForeignKey("Reservas.idReserva"), nullable=False)

    # El diagrama incluye esta FK extra arrastrada por la relación identificadora
    Reservas_Usuarios_IdUsuario = Column(Integer, ForeignKey("Usuarios.idUsuario"))
    
    numero = Column(String(20), unique=True, nullable=False, index=True)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)
    cliente_nombre = Column(String(150), nullable=True)
    cliente_documento = Column(String(20), nullable=True)
    rucDni = Column(String(20), nullable=True)
    modalidad = Column(String(50), nullable=True, default="dine-in")
    metodo_pago = Column(String(50), nullable=True, default="efectivo")
    
    subtotal = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    igv = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    total = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    estado = Column(String(20), nullable=False, default="emitida")
    observaciones = Column(Text, nullable=True)

    # Relación con detalle
    reserva = relationship("Reserva", back_populates="ventas")
    detalles = relationship(
        "DetalleVenta", back_populates="venta", cascade="all, delete-orphan"
    )


class DetalleVenta(Base):
    """Detalle de una venta (ítem de la comanda)."""
    __tablename__ = "DetalleVentas"
    
    idDetalleVenta = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Ventas_idVenta = Column(Integer, ForeignKey("Ventas.idVenta"), nullable=False)
    Platillos_idPlatillo = Column(Integer, ForeignKey("Platillos.idPlatillo"), nullable=False)
    
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    # Relaciones
    venta = relationship("Venta", back_populates="detalles")
    platillo = relationship("Platillo", back_populates="detalles")