from sqlalchemy.orm import Session
from core.database import SessionLocal
from models.cms_models import CategoriaVehiculo

def poblar_categorias_iniciales():
    db: Session = SessionLocal()
    try:
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
        
        for cat in categorias_principales:
            existe = db.query(CategoriaVehiculo).filter(CategoriaVehiculo.codigo == cat["codigo"]).first()
            if not existe:
                nueva = CategoriaVehiculo(codigo=cat["codigo"], nombre=cat["nombre"])
                db.add(nueva)
        db.commit()
        print("✅ Categorías principales inicializadas correctamente en la base de datos.")
    except Exception as e:
        print(f"❌ Error al poblar categorías: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_categorias_iniciales()