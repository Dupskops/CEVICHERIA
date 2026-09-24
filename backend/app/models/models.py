from sqlalchemy import Column, Integer, String, Float, Date, Time, ForeignKey
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

    # Relaciones
    propietario = relationship("Usuario", back_populates="reservas")
    ventas = relationship("Venta", back_populates="reserva")

class Platillo(Base):
    __tablename__ = "Platillos" 

    idPlatillo = Column(Integer, primary_key=True, index=True) 
    nombre = Column(String(100), nullable=False) 
    precio = Column(Float, nullable=False) 

    # Relación
    detalles = relationship("DetalleVenta", back_populates="platillo")

class Venta(Base):
    __tablename__ = "Ventas" 

    idVenta = Column(Integer, primary_key=True, index=True) 
    Reservas_idReserva = Column(Integer, ForeignKey("Reservas.idReserva"), nullable=False) 
    
    #El diagrama incluye esta FK extra arrastrada por la relación identificadora
    Reservas_Usuarios_IdUsuario = Column(Integer, ForeignKey("Usuarios.idUsuario")) 
    
    fecha = Column(Date) 
    hora = Column(Time) 
    rucDni = Column(String(20)) 

    # Relaciones
    reserva = relationship("Reserva", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta")

class DetalleVenta(Base):
    __tablename__ = "DetalleVentas" 

    idDetalleVenta = Column(Integer, primary_key=True, index=True)
    Ventas_idVenta = Column(Integer, ForeignKey("Ventas.idVenta"), nullable=False) 
    Platillos_idPlatillo = Column(Integer, ForeignKey("Platillos.idPlatillo"), nullable=False) 
    cantidad = Column(Integer, nullable=False) 
    subtotal = Column(Float, nullable=False) 

    # Relaciones
    venta = relationship("Venta", back_populates="detalles")
    platillo = relationship("Platillo", back_populates="detalles")