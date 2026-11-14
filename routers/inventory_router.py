from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_admin_token
from models.domain_models import VehicleItem, VehicleVariant

router = APIRouter()

@router.post("/vehicles")
def crear_vehiculo(data: dict, db: Session = Depends(get_db), admin: str = Depends(verify_admin_token)):
    vehiculo = VehicleItem(
        tipo=data.get("tipo"),
        marca=data.get("marca"),
        modelo=data.get("modelo"),
        cilindraje=data.get("cilindraje"),
        traccion_4x4=data.get("traccion_4x4", False),
        propulsion=data.get("propulsion"),
        blindado=data.get("blindado", False),
        precio_base=data.get("precio_base"),
        foto_main=data.get("foto_main"),
        foto_1=data.get("foto_1"),
        foto_2=data.get("foto_2"),
        foto_3=data.get("foto_3"),
        foto_4=data.get("foto_4"),
        video_url=data.get("video_url")
    )
    vehiculo.calcular_sku()
    db.add(vehiculo)
    db.commit()
    db.refresh(vehiculo)
    return {"message": "Vehículo registrado con éxito", "sku": vehiculo.sku}