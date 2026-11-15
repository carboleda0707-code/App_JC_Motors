from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from models.cms_models import (
    SliderItem, CategoriaVehiculo, Vehiculo, VehiculoSKU,
    HistoriaVendido, PublicidadItem, ConfigFooter
)

router = APIRouter()

@router.get("/tienda/inicio")
def obtener_datos_tienda(db: Session = Depends(get_db)):
    """Carga las 5 secciones dinámicas de la tienda pública."""
    slides = db.query(SliderItem).filter(SliderItem.activo == True).order_by(SliderItem.orden).all()
    categorias = db.query(CategoriaVehiculo).all()
    destacados = db.query(Vehiculo).filter(Vehiculo.destacado == True).all()
    historias = db.query(HistoriaVendido).filter(HistoriaVendido.activo == True).order_by(HistoriaVendido.id.desc()).all()
    publicidad = db.query(PublicidadItem).filter(PublicidadItem.activo == True).order_by(PublicidadItem.posicion).all()
    footer = db.query(ConfigFooter).first()

    return {
        "slider": slides,
        "categorias": categorias,
        "destacados": [_serializar_vehiculo(v) for v in destacados],
        "historias": historias,
        "publicidad": publicidad,
        "footer": footer
    }

@router.get("/tienda/vehiculos")
def filtrar_vehiculos(
    categoria_cod: Optional[str] = Query(None),
    marca_cod: Optional[str] = Query(None),
    modelo: Optional[str] = Query(None),
    anio: Optional[int] = Query(None),
    es_4x4: Optional[bool] = Query(False),
    es_hibrido: Optional[bool] = Query(False),
    es_blindado: Optional[bool] = Query(False),
    solo_destacados: Optional[bool] = Query(False),
    db: Session = Depends(get_db)
):
    """Filtra vehículos desde la barra superior y devuelve sus SKUs y galerías."""
    query = db.query(Vehiculo)

    if solo_destacados:
        query = query.filter(Vehiculo.destacado == True)

    if categoria_cod and categoria_cod != "ALL":
        cat = db.query(CategoriaVehiculo).filter(CategoriaVehiculo.codigo == categoria_cod.upper()).first()
        if cat:
            query = query.filter(Vehiculo.categoria_id == cat.id)

    if marca_cod and marca_cod != "ALL":
        query = query.filter(Vehiculo.marca_cod == marca_cod.upper())

    if modelo and modelo != "ALL":
        query = query.filter(Vehiculo.modelo == modelo)

    if anio:
        query = query.filter(Vehiculo.anio == anio)

    vehiculos = query.all()
    resultados = []

    for v in vehiculos:
        # Filtrar variantes SKU según checkboxes activos
        variantes_validas = v.variantes
        if es_4x4:
            variantes_validas = [s for s in variantes_validas if s.traccion == "4X4"]
        if es_hibrido:
            variantes_validas = [s for s in variantes_validas if s.motor == "HYB"]
        if es_blindado:
            variantes_validas = [s for s in variantes_validas if s.blindaje == "BLI"]

        if variantes_validas or (not es_4x4 and not es_hibrido and not es_blindado):
            resultados.append(_serializar_vehiculo(v, variantes_validas))

    return resultados

def _serializar_vehiculo(v: Vehiculo, variantes_filtradas=None):
    vars_list = variantes_filtradas if variantes_filtradas is not None else v.variantes
    return {
        "id": v.id,
        "marca": v.marca,
        "marca_cod": v.marca_cod,
        "modelo": v.modelo,
        "modelo_cod": v.modelo_cod,
        "anio": v.anio,
        "precio_contado": v.precio_contado,
        "destacado": v.destacado,
        "galeria_urls": v.galeria_urls or [],
        "variantes": [
            {
                "id": s.id,
                "sku_codigo": s.sku_codigo,
                "color": s.color,
                "traccion": s.traccion,
                "motor": s.motor,
                "blindaje": s.blindaje,
                "stock": s.stock,
                "precio": s.precio_variante if hasattr(s, 'precio_variante') and s.precio_variante else v.precio_contado
            }
            for s in vars_list
        ]
    }