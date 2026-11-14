from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings

print("🔍 [CHIVATO DB] Inicializando SQLAlchemy engine...")
print(f"🔍 [CHIVATO DB] URL detectada (inicio): {settings.DATABASE_URL[:30]}...")

try:
    engine = create_engine(settings.DATABASE_URL)
    print("✅ [CHIVATO DB] Engine de SQLAlchemy creado correctamente.")
except Exception as e:
    print(f"❌ [CHIVATO DB ERROR] Falló al crear el engine: {e}")
    raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()