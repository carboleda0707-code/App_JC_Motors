from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.cms_models import CategoriaVehiculo, Vehiculo, VehiculoSKU

def poblar_categorias_iniciales():
    db: Session = SessionLocal()
    try:
        # 1. Las 10 Categorías principales
        categorias_principales = [
            {"codigo": "SUV", "nombre": "SUV / Todoterreno"},
            {"codigo": "SED", "nombre": "Sedán Ejecutivo"},
            {"codigo": "PUK", "nombre": "Pickup / Camioneta 4x4"},
            {"codigo": "COU", "nombre": "Coupé Deportivo"},
            {"codigo": "HAC", "nombre": "Hatchback Urbano"},
            {"codigo": "MIN", "nombre": "Minivan / Familiar"},
            {"codigo": "CAB", "nombre": "Cabriolet / Descapotable"},
            {"codigo": "ELE", "nombre": "Vehículo 100% Eléctrico (EV)"},
            {"codigo": "HRC", "nombre": "Híbrido Enchufable (PHEV)"},
            {"codigo": "COM", "nombre": "Vehículo Comercial / Furgoneta"}
        ]
        
        cat_objs = {}
        for cat in categorias_principales:
            existe = db.query(CategoriaVehiculo).filter(CategoriaVehiculo.codigo == cat["codigo"]).first()
            if not existe:
                nueva = CategoriaVehiculo(codigo=cat["codigo"], nombre=cat["nombre"])
                db.add(nueva)
                db.commit()
                db.refresh(nueva)
                cat_objs[cat["codigo"]] = nueva
            else:
                cat_objs[cat["codigo"]] = existe

        # 2. 10 Marcas y 20 Modelos (2 por categoría) reales con precios y variantes SKU
        modelos_semilla = [
            # SUV
            {"cat": "SUV", "marca": "Toyota", "modelo": "RAV4 Limited", "precio": 38900, "anio": 2026},
            {"cat": "SUV", "marca": "Kia", "modelo": "Sportage GT", "precio": 33500, "anio": 2026},
            # SED
            {"cat": "SED", "marca": "Chevrolet", "modelo": "Onix Sedán Turbo", "precio": 21500, "anio": 2025},
            {"cat": "SED", "marca": "Hyundai", "modelo": "Elantra Limited", "precio": 27900, "anio": 2026},
            # PUK
            {"cat": "PUK", "marca": "Toyota", "modelo": "Hilux SRX 4x4", "precio": 48500, "anio": 2026},
            {"cat": "PUK", "marca": "Ford", "modelo": "Ranger Raptor", "precio": 55900, "anio": 2026},
            # COU
            {"cat": "COU", "marca": "Chevrolet", "modelo": "Camaro SS", "precio": 65000, "anio": 2025},
            {"cat": "COU", "marca": "Audi", "modelo": "TT Coupé", "precio": 58000, "anio": 2024},
            # HAC
            {"cat": "HAC", "marca": "Kia", "modelo": "Rio Hatchback", "precio": 19500, "anio": 2025},
            {"cat": "HAC", "marca": "Mazda", "modelo": "Mazda 3 Hatchback", "precio": 28500, "anio": 2026},
            # MIN
            {"cat": "MIN", "marca": "Honda", "modelo": "Odyssey Elite", "precio": 49000, "anio": 2025},
            {"cat": "MIN", "marca": "Kia", "modelo": "Carnival VIP", "precio": 44500, "anio": 2026},
            # CAB
            {"cat": "CAB", "marca": "BMW", "modelo": "Z4 Roadster", "precio": 62000, "anio": 2025},
            {"cat": "CAB", "marca": "Audi", "modelo": "A5 Cabriolet", "precio": 67000, "anio": 2026},
            # ELE
            {"cat": "ELE", "marca": "Tesla", "modelo": "Model Y Long Range", "precio": 52000, "anio": 2026},
            {"cat": "ELE", "marca": "Audi", "modelo": "Q8 e-tron", "precio": 78000, "anio": 2026},
            # HRC
            {"cat": "HRC", "marca": "Toyota", "modelo": "Prius Plug-in", "precio": 34000, "anio": 2026},
            {"cat": "HRC", "marca": "BMW", "modelo": "X5 xDrive50e", "precio": 85000, "anio": 2026},
            # COM
            {"cat": "COM", "marca": "Nissan", "modelo": "Urvan Panel", "precio": 36000, "anio": 2025},
            {"cat": "COM", "marca": "Ford", "modelo": "Transit Van", "precio": 41000, "anio": 2026},
        ]

        for item in modelos_semilla:
            c_obj = cat_objs.get(item["cat"])
            if not c_obj:
                continue
            
            # Verificar si ya existe el vehículo
            existe_veh = db.query(Vehiculo).filter(Vehiculo.modelo == item["modelo"]).first()
            if not existe_veh:
                nuevo_v = Vehiculo(
                    categoria_id=c_obj.id,
                    marca=item["marca"],
                    marca_cod=item["marca"][:3].upper(),
                    modelo=item["modelo"],
                    modelo_cod=item["modelo"][:3].upper(),
                    anio=item["anio"],
                    precio_contado=item["precio"],
                    destacado=True,
                    galeria_urls=[
                        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
                        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
                        "https://www.w3schools.com/html/mov_bbb.mp4"
                    ]
                )
                db.add(nuevo_v)
                db.commit()
                db.refresh(nuevo_v)

                sku_cod = f"{item['cat']}-{item['marca'][:3].upper()}-{item['modelo'][:3].upper()}-{item['anio']}-4X2-GAS-STD-BLAN"
                nueva_var = VehiculoSKU(
                    vehiculo_id=nuevo_v.id,
                    sku_codigo=sku_cod,
                    color="BLANCO METÁLICO",
                    traccion="4X2",
                    motor="GAS",
                    blindaje="STD",
                    precio_variante=item["precio"],
                    stock=5
                )
                db.add(nueva_var)
                db.commit()

        print("✅ Base de datos poblada exitosamente con categorías, marcas, modelos y SKUs.")
    except Exception as e:
        print(f"❌ Error al poblar base de datos: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_categorias_iniciales()