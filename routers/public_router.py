from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from core.database import get_db
from models.cms_models import (
    SliderItem, CategoriaVehiculo, Vehiculo, VarianteSKU,
    HistoriaVendida, PublicidadBloque, FooterConfig
)

router = APIRouter()

@router.get("/tienda/inicio")
def obtener_datos_tienda(db: Session = Depends(get_db)):
    """Carga las 5 secciones dinámicas de la tienda pública."""
    slides = db.query(SliderItem).order_by(SliderItem.orden).all()
    categorias = db.query(CategoriaVehiculo).all()
    destacados = db.query(Vehiculo).filter(Vehiculo.destacado == True).all()
    historias = db.query(HistoriaVendida).all()
    publicidad = db.query(PublicidadBloque).all()
    footer = db.query(FooterConfig).first()

    return {
        "slider": [{"id": s.id, "orden": s.orden, "tiempo_segundos": s.tiempo_segundos, "nombre": s.nombre, "descripcion": s.descripcion, "imagen_url": s.imagen_url, "link_disparo": s.link_disparo} for s in slides],
        "categorias": [{"id": c.id, "codigo": c.codigo, "nombre": c.nombre} for c in categorias],
        "destacados": [_serializar_vehiculo(v) for v in destacados],
        "historias": [{"id": h.id, "cliente_titulo": h.cliente_titulo, "red_social": h.red_social, "comentario": h.comentario, "media_url": h.media_url, "link_post": h.link_post} for h in historias],
        "publicidad": [{"id": p.id, "posicion": p.posicion, "tipo_media": p.tipo_media, "titulo": p.titulo, "link_destino": p.link_destino, "media_url": p.media_url} for p in publicidad],
        "footer": {
            "descripcion_empresa": footer.descripcion_empresa if footer else "",
            "direccion": footer.direccion if footer else "",
            "telefono_whatsapp": footer.telefono_whatsapp if footer else "",
            "email_contacto": footer.email_contacto if footer else "",
            "url_instagram": footer.url_instagram if footer else "",
            "url_facebook": footer.url_facebook if footer else "",
            "url_tiktok": footer.url_tiktok if footer else ""
        }
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
    """Filtra vehículos desde la barra superior por Tipo, Modelo, Marca, Año y SKUs."""
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
                "precio": s.precio
            }
            for s in vars_list
        ]
    }