from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import oauth2_scheme
from app.models.models import Platillo
from pydantic import BaseModel

from app.services.gemini_service import gemini_service

router = APIRouter(
    prefix="/api/platillos",
    tags=["Platillos"]
)

class DishBase(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str | None = None
    emoji: str | None = None
    available: bool

class DishOut(DishBase):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=list[DishOut])
def listar_platillos(db: Session = Depends(get_db)):
    platillos_db = db.query(Platillo).all()
    result = []
    for p in platillos_db:
        result.append({
            "id": p.idPlatillo,
            "name": p.nombre,
            "description": getattr(p, "descripcion", None) or "Descripción por defecto",
            "price": p.precio,
            "category": "Ceviches" if "Ceviche" in p.nombre else "Mariscos",
            "image_url": "",
            "emoji": getattr(p, "emoji", "🍲"),
            "available": True
        })
    return result

@router.post("/", response_model=DishOut)
async def crear_platillo(
    payload: DishBase,
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
):
    generated_emoji = payload.emoji
    if not generated_emoji:
        generated_emoji = await gemini_service.generate_emoji_for_dish(payload.name)
        
    nuevo = Platillo(nombre=payload.name, descripcion=payload.description, precio=payload.price, emoji=generated_emoji)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {
        "id": nuevo.idPlatillo,
        "name": nuevo.nombre,
        "description": payload.description,
        "price": nuevo.precio,
        "category": payload.category,
        "image_url": payload.image_url,
        "emoji": nuevo.emoji,
        "available": payload.available
    }

@router.put("/{id}", response_model=DishOut)
def actualizar_platillo(id: int, payload: DishBase, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    platillo = db.query(Platillo).filter(Platillo.idPlatillo == id).first()
    if not platillo:
        raise HTTPException(status_code=404, detail="Platillo no encontrado")
    
    platillo.nombre = payload.name
    platillo.descripcion = payload.description
    platillo.precio = payload.price
    
    if payload.emoji:
        platillo.emoji = payload.emoji
        
    db.commit()
    db.refresh(platillo)
    
    return {
        "id": platillo.idPlatillo,
        "name": platillo.nombre,
        "description": getattr(platillo, "descripcion", None) or "Descripción por defecto",
        "price": platillo.precio,
        "category": payload.category,
        "image_url": payload.image_url,
        "emoji": platillo.emoji,
        "available": payload.available
    }

@router.delete("/{id}")
def eliminar_platillo(id: int, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    platillo = db.query(Platillo).filter(Platillo.idPlatillo == id).first()
    if not platillo:
        raise HTTPException(status_code=404, detail="Platillo no encontrado")
    db.delete(platillo)
    db.commit()
    return {"message": "Platillo eliminado"}