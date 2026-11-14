from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from models.domain_models import VehicleItem, HomeSectionConfig

router = APIRouter()

@router.get("/vehicles")
def listar_vehiculos(db: Session = Depends(get_db)):
    vehiculos = db.query(VehicleItem).all()
    return vehiculos

@router.get("/home-config")
def obtener_config_home(db: Session = Depends(get_db)):
    configs = db.query(HomeSectionConfig).all()
    return {c.seccion: c.payload_json for c in configs}
