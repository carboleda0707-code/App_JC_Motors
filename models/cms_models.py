from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from core.database import Base

# SECCIÓN 1: SLIDER PRINCIPAL (4 FOTOS)
class SliderItem(Base):
    __tablename__ = "cms_slider"
    id = Column(Integer, primary_key=True, index=True)
    orden = Column(Integer, default=1)                 # 1 al 4
    nombre = Column(String(120), nullable=False)       # Título principal
    descripcion = Column(Text, nullable=True)          # Subtítulo
    imagen_url = Column(String(500), nullable=False)   # URL Cloudflare R2
    link_disparo = Column(String(300), default="#categorias")
    tiempo_segundos = Column(Integer, default=5)       # Tiempo de transición en segundos
    activo = Column(Boolean, default=True)

# SECCIÓN 2: CATEGORÍAS, VEHÍCULOS Y VARIANTES SKU
class CategoriaVehiculo(Base):
    __tablename__ = "cms_categorias"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(10), unique=True, nullable=False) # Ej: SUV, SED, PUK
    nombre = Column(String(80), nullable=False)              # Ej: SUV, Sedán, Camioneta

class Vehiculo(Base):
    __tablename__ = "cms_vehiculos"
    id = Column(Integer, primary_key=True, index=True)
    categoria_id = Column(Integer, ForeignKey("cms_categorias.id"))
    marca = Column(String(50), nullable=False)         # Ej: Toyota, Chevrolet
    marca_cod = Column(String(10), nullable=False)     # Ej: TOY, CHE
    modelo = Column(String(100), nullable=False)       # Ej: RAV4 Limited
    modelo_cod = Column(String(10), nullable=False)    # Ej: RAV
    anio = Column(Integer, nullable=False)
    precio_contado = Column(Float, nullable=False)
    destacado = Column(Boolean, default=True)          # True = sale por defecto en vitrina
    galeria_urls = Column(JSON, default=list)          # Lista de URLs de fotos/videos en R2

    variantes = relationship("VehiculoSKU", back_populates="vehiculo", cascade="all, delete-orphan")

class VehiculoSKU(Base):
    __tablename__ = "cms_vehiculos_sku"
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("cms_vehiculos.id"))
    sku_codigo = Column(String(60), unique=True, nullable=False) # Ej: SUV-TOY-RAV-2026-4X4-HYB-STD
    color = Column(String(40), nullable=False)
    traccion = Column(String(10), default="4X2")       # 4X4 / 4X2
    motor = Column(String(10), default="GAS")          # HYB / GAS
    blindaje = Column(String(10), default="STD")       # BLI / STD
    stock = Column(Integer, default=1)
    precio_variante = Column(Float, nullable=True)

    vehiculo = relationship("Vehiculo", back_populates="variantes")

# SECCIÓN 3: REDES SOCIALES / HISTORIAS DE AUTOS VENDIDOS
class HistoriaVendido(Base):
    __tablename__ = "cms_historias_vendidos"
    id = Column(Integer, primary_key=True, index=True)
    cliente_titulo = Column(String(120), nullable=False) # Ej: Familia Gómez - Toyota Fortuner
    comentario = Column(Text, nullable=True)
    media_url = Column(String(500), nullable=False)      # Foto entrega o reel R2
    red_social = Column(String(30), default="Instagram") # Instagram, TikTok, Facebook
    link_post = Column(String(500), nullable=True)
    activo = Column(Boolean, default=True)

# SECCIÓN 4: PUBLICIDAD (3 BANNERS O VIDEOS)
class PublicidadItem(Base):
    __tablename__ = "cms_publicidad"
    id = Column(Integer, primary_key=True, index=True)
    posicion = Column(Integer, default=1)                # 1, 2 o 3
    titulo = Column(String(120), nullable=False)
    tipo_media = Column(String(20), default="imagen")    # imagen / video
    media_url = Column(String(500), nullable=False)
    link_destino = Column(String(300), default="#financiamiento")
    activo = Column(Boolean, default=True)

# SECCIÓN 5: CONFIGURACIÓN PIE DE PÁGINA (FOOTER)
class ConfigFooter(Base):
    __tablename__ = "cms_footer"
    id = Column(Integer, primary_key=True, index=True)
    descripcion_empresa = Column(Text, default="Patio de vehículos multimarca con garantía total.")
    direccion = Column(String(200), default="Av. Principal del Motor, Guayaquil")
    telefono_whatsapp = Column(String(30), default="+593 99 999 9999")
    email_contacto = Column(String(100), default="ventas@jcmotors.ec")
    url_instagram = Column(String(250), default="")
    url_facebook = Column(String(250), default="")
    url_tiktok = Column(String(250), default="")