from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from core.database import get_db
from models.cms_models import (
    SliderItem, CategoriaVehiculo, Vehiculo, VehiculoSKU,
    HistoriaVendido, PublicidadItem, ConfigFooter
)

router = APIRouter()

# --- ESQUEMAS PYDANTIC ---
class SliderSchema(BaseModel):
    orden: int
    nombre: str
    descripcion: str
    imagen_url: str
    link_disparo: str
    tiempo_segundos: int

class CategoriaSchema(BaseModel):
    codigo: str
    nombre: str

class SKUSchema(BaseModel):
    sku_codigo: str
    color: str
    traccion: str
    motor: str
    blindaje: str
    stock: int
    precio_variante: Optional[float] = None

class VehiculoCreateSchema(BaseModel):
    categoria_id: int
    marca: str
    marca_cod: str
    modelo: str
    modelo_cod: str
    anio: int
    precio_contado: float
    destacado: bool
    galeria_urls: List[str] = []
    variantes: List[SKUSchema] = []

class HistoriaSchema(BaseModel):
    cliente_titulo: str
    comentario: str
    media_url: str
    red_social: str
    link_post: Optional[str] = ""

class PublicidadSchema(BaseModel):
    posicion: int
    titulo: str
    tipo_media: str
    media_url: str
    link_destino: str

class FooterSchema(BaseModel):
    descripcion_empresa: str
    direccion: str
    telefono_whatsapp: str
    email_contacto: str
    url_instagram: Optional[str] = ""
    url_facebook: Optional[str] = ""
    url_tiktok: Optional[str] = ""

# --- ENDPOINTS SECCIÓN 1: SLIDER ---
@router.get("/slider")
def listar_slider(db: Session = Depends(get_db)):
    return db.query(SliderItem).order_by(SliderItem.orden).all()

@router.post("/slider")
def guardar_slider(item: SliderSchema, db: Session = Depends(get_db)):
    slide = db.query(SliderItem).filter(SliderItem.orden == item.orden).first()
    if slide:
        for k, v in item.dict().items():
            setattr(slide, k, v)
    else:
        slide = SliderItem(**item.dict())
        db.add(slide)
    db.commit()
    return {"status": "ok", "mensaje": f"Slide #{item.orden} guardado correctamente"}

# --- ENDPOINTS SECCIÓN 2: CATEGORÍAS, VEHÍCULOS Y SKUs ---
@router.get("/categorias")
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaVehiculo).all()

@router.post("/categorias")
def crear_categoria(cat: CategoriaSchema, db: Session = Depends(get_db)):
    nueva = CategoriaVehiculo(codigo=cat.codigo.upper(), nombre=cat.nombre)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.get("/vehiculos")
def listar_vehiculos(db: Session = Depends(get_db)):
    vehiculos = db.query(Vehiculo).all()
    resultado = []
    for v in vehiculos:
        resultado.append({
            "id": v.id,
            "marca": v.marca,
            "modelo": v.modelo,
            "anio": v.anio,
            "precio_contado": v.precio_contado,
            "destacado": v.destacado,
            "galeria_urls": v.galeria_urls,
            "skus": [s.sku_codigo for s in v.variantes]
        })
    return resultado

@router.post("/vehiculos")
def crear_vehiculo(data: VehiculoCreateSchema, db: Session = Depends(get_db)):
    vehiculo = Vehiculo(
        categoria_id=data.categoria_id,
        marca=data.marca,
        marca_cod=data.marca_cod.upper(),
        modelo=data.modelo,
        modelo_cod=data.modelo_cod.upper(),
        anio=data.anio,
        precio_contado=data.precio_contado,
        destacado=data.destacado,
        galeria_urls=data.galeria_urls
    )
    db.add(vehiculo)
    db.flush()

    for var in data.variantes:
        sku = VehiculoSKU(
            vehiculo_id=vehiculo.id,
            sku_codigo=var.sku_codigo.upper(),
            color=var.color,
            traccion=var.traccion,
            motor=var.motor,
            blindaje=var.blindaje,
            stock=var.stock,
            precio_variante=var.precio_variante or data.precio_contado
        )
        db.add(sku)

    db.commit()
    return {"status": "ok", "id": vehiculo.id, "mensaje": "Vehículo y SKUs registrados"}

@router.patch("/vehiculos/{vehiculo_id}/destacado")
def toggle_destacado(vehiculo_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    v.destacado = not v.destacado
    db.commit()
    return {"id": v.id, "destacado": v.destacado}

# --- ENDPOINTS SECCIÓN 3: HISTORIAS VENDIDOS ---
@router.get("/historias")
def listar_historias(db: Session = Depends(get_db)):
    return db.query(HistoriaVendido).all()

@router.post("/historias")
def crear_historia(data: HistoriaSchema, db: Session = Depends(get_db)):
    nueva = HistoriaVendido(**data.dict())
    db.add(nueva)
    db.commit()
    return {"status": "ok", "mensaje": "Historia publicada"}

# --- ENDPOINTS SECCIÓN 4: PUBLICIDAD (3 ESPACIOS) ---
@router.get("/publicidad")
def listar_publicidad(db: Session = Depends(get_db)):
    return db.query(PublicidadItem).order_by(PublicidadItem.posicion).all()

@router.post("/publicidad")
def guardar_publicidad(data: PublicidadSchema, db: Session = Depends(get_db)):
    pub = db.query(PublicidadItem).filter(PublicidadItem.posicion == data.posicion).first()
    if pub:
        for k, v in data.dict().items():
            setattr(pub, k, v)
    else:
        pub = PublicidadItem(**data.dict())
        db.add(pub)
    db.commit()
    return {"status": "ok", "mensaje": f"Espacio publicitario #{data.posicion} actualizado"}

# --- ENDPOINTS SECCIÓN 5: PIE DE PÁGINA ---
@router.get("/footer")
def obtener_footer(db: Session = Depends(get_db)):
    footer = db.query(ConfigFooter).first()
    if not footer:
        footer = ConfigFooter()
        db.add(footer)
        db.commit()
        db.refresh(footer)
    return footer

@router.post("/footer")
def actualizar_footer(data: FooterSchema, db: Session = Depends(get_db)):
    footer = db.query(ConfigFooter).first()
    if not footer:
        footer = ConfigFooter(**data.dict())
        db.add(footer)
    else:
        for k, v in data.dict().items():
            setattr(footer, k, v)
    db.commit()
    return {"status": "ok", "mensaje": "Pie de página actualizado"}