from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import oauth2_scheme
from app.models.models import Venta, DetalleVenta, Reserva, Platillo
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

router = APIRouter(
    prefix="/api/ventas",
    tags=["Ventas"]
)

class DetalleVentaBase(BaseModel):
    Platillos_idPlatillo: int
    cantidad: int
    precio_unitario: float
    subtotal: float

class VentaBase(BaseModel):
    numero: str
    cliente_nombre: str | None = None
    cliente_documento: str | None = None
    rucDni: str | None = None
    subtotal: float
    igv: float
    total: float
    estado: str = "emitida"
    observaciones: str | None = None
    Reservas_idReserva: int | None = None
    modalidad: str | None = "dine-in"
    metodo_pago: str | None = "efectivo"
    detalles: list[DetalleVentaBase]

class VentaOut(BaseModel):
    idVenta: int
    numero: str
    fecha: datetime
    cliente_nombre: str | None
    total: Decimal
    modalidad: str | None
    metodo_pago: str | None
    subtotal: Decimal
    detalles: list[DetalleVentaBase] = []
    class Config:
        from_attributes = True

@router.get("", response_model=list[VentaOut])
def listar_ventas(db: Session = Depends(get_db)):
    return db.query(Venta).all()

@router.post("", response_model=VentaOut)
def crear_venta(
    payload: VentaBase,
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    reserva_id = payload.Reservas_idReserva
    if not reserva_id:
        # Usar o crear una reserva dummy para ventas directas
        dummy = db.query(Reserva).filter(Reserva.idReserva == 1).first()
        if not dummy:
            dummy = Reserva(idReserva=1, Usuarios_idUsuario=1, nombre="Venta Directa", estado="completada")
            db.add(dummy)
            # Solo un flush para poder usar el ID sin commit completo
            db.flush()
        reserva_id = 1
        
    nueva_venta = Venta(
        Reservas_idReserva=reserva_id,
        numero=payload.numero,
        cliente_nombre=payload.cliente_nombre,
        cliente_documento=payload.cliente_documento,
        rucDni=payload.rucDni,
        modalidad=payload.modalidad,
        metodo_pago=payload.metodo_pago,
        subtotal=Decimal(str(payload.subtotal)),
        igv=Decimal(str(payload.igv)),
        total=Decimal(str(payload.total)),
        estado=payload.estado,
        observaciones=payload.observaciones
    )
    db.add(nueva_venta)
    db.flush() # Flush para obtener el idVenta
    
    # Procesar platillos en bloque para evitar Múltiples SELECTS y COMMITS
    ids_platillos = list(set([det.Platillos_idPlatillo for det in payload.detalles]))
    platillos_existentes = db.query(Platillo.idPlatillo).filter(Platillo.idPlatillo.in_(ids_platillos)).all()
    existentes_set = {p[0] for p in platillos_existentes}

    nuevos_platillos = []
    for det in payload.detalles:
        if det.Platillos_idPlatillo not in existentes_set:
            nuevos_platillos.append(Platillo(idPlatillo=det.Platillos_idPlatillo, nombre="Platillo General", precio=det.precio_unitario))
            existentes_set.add(det.Platillos_idPlatillo) # Evitar duplicados en el mismo payload
            
    if nuevos_platillos:
        db.add_all(nuevos_platillos)
        db.flush()

    # Ahora sí agregar todos los detalles
    for det in payload.detalles:
        nuevo_det = DetalleVenta(
            Ventas_idVenta=nueva_venta.idVenta,
            Platillos_idPlatillo=det.Platillos_idPlatillo,
            cantidad=det.cantidad,
            precio_unitario=Decimal(str(det.precio_unitario)),
            subtotal=Decimal(str(det.subtotal))
        )
        db.add(nuevo_det)
        
    # Un solo commit gigante al final = Ultra Rápido
    db.commit()
    db.refresh(nueva_venta)
    
    return nueva_venta

@router.delete("/{id}")
def eliminar_venta(id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    venta = db.query(Venta).filter(Venta.idVenta == id).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    db.delete(venta)
    db.commit()
    return {"message": "Venta eliminada"}