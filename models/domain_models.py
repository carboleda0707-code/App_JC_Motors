from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class VehicleItem(Base):
    __tablename__ = "vehicle_items"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(50), nullable=False)        # SUV, Sedan, Pickup
    marca = Column(String(50), nullable=False)       # Toyota, Chevrolet, Kia
    modelo = Column(String(50), nullable=False)      # RAV4, Captiva, Sportage
    cilindraje = Column(String(20), nullable=False)  # 2.0L, 1.5L
    traccion_4x4 = Column(Boolean, default=False)
    propulsion = Column(String(30), nullable=False)  # Gasolina, Híbrido, Eléctrico
    blindado = Column(Boolean, default=False)
    
    sku = Column(String(100), unique=True, index=True, nullable=False)
    precio_base = Column(Float, nullable=False)
    estado = Column(String(30), default="Disponible")

    # Galería R2: 4 fotos + 1 foto principal + 1 video
    foto_main = Column(Text, nullable=False)
    foto_1 = Column(Text, nullable=False)
    foto_2 = Column(Text, nullable=False)
    foto_3 = Column(Text, nullable=False)
    foto_4 = Column(Text, nullable=False)
    video_url = Column(Text, nullable=False)

    variants = relationship("VehicleVariant", back_populates="vehicle", cascade="all, delete-orphan")

    def calcular_sku(self):
        t = self.tipo[:3].upper()
        m = self.marca[:3].upper()
        mod = self.modelo[:3].upper()
        trac = "4X4" if self.traccion_4x4 else "4X2"
        prop = "HYB" if "HÍBRIDO" in self.propulsion.upper() else "GAS"
        bln = "BLD" if self.blindado else "STD"
        self.sku = f"{t}-{m}-{mod}-{trac}-{prop}-{bln}"

class VehicleVariant(Base):
    __tablename__ = "vehicle_variants"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicle_items.id"), nullable=False)
    anio = Column(String(10), nullable=False)
    color = Column(String(50), nullable=False)
    sku_variante = Column(String(120), unique=True, nullable=False)
    
    vehicle = relationship("VehicleItem", back_populates="variants")

class HomeSectionConfig(Base):
    __tablename__ = "home_config"
    id = Column(Integer, primary_key=True, index=True)
    seccion = Column(String(50), unique=True, nullable=False) # 'slider', 'destacados', 'publicidad'
    payload_json = Column(Text, nullable=False)
