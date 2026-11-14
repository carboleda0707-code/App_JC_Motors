import os
import configparser
from pathlib import Path

# Obtener la ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = BASE_DIR / "config.ini"

# Cargar config.ini si está presente
config = configparser.ConfigParser()
if CONFIG_FILE.exists():
    config.read(CONFIG_FILE)

def get_setting(section: str, key: str, env_name: str, default: str = "") -> str:
    """
    Busca primero en config.ini. Si no existe o está vacío, 
    recurre a las variables de entorno del sistema (Railway).
    """
    val = ""
    if config.has_section(section) and config.has_option(section, key):
        val = config.get(section, key).strip()
    
    if not val:
        val = os.environ.get(env_name, default)
        
    return val

class Settings:
    # Base de datos (Railway provee DATABASE_URL automáticamente)
    DATABASE_URL: str = get_setting("database", "url", "DATABASE_URL")
    
    # Seguridad y JWT (Requerido por core/security.py)
    SECRET_KEY: str = get_setting("security", "secret_key", "SECRET_KEY", "super-secret-key-default")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(get_setting("security", "access_token_expire_minutes", "ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    # Cloudflare R2
    R2_ENDPOINT_URL: str = get_setting("r2", "endpoint_url", "R2_ENDPOINT_URL")
    R2_ACCESS_KEY_ID: str = get_setting("r2", "access_key_id", "R2_ACCESS_KEY_ID")
    R2_SECRET_ACCESS_KEY: str = get_setting("r2", "secret_access_key", "R2_SECRET_ACCESS_KEY")
    R2_BUCKET_NAME: str = get_setting("r2", "bucket_name", "R2_BUCKET_NAME", "jcmotors-media")
    R2_PUBLIC_URL: str = get_setting("r2", "public_url", "R2_PUBLIC_URL", "https://pub-cec47eeef2c40129228cbd007ceabee.r2.dev")

settings = Settings()

# --- CHIVATO DE ARRANQUE ---
# Imprime en los logs exactamente qué URL está cargando (ocultando credenciales si deseas, pero útil para verificar el host)
print(f"🔍 [CHIVATO CONFIG] DATABASE_URL configurada: {settings.DATABASE_URL[:25]}... (longitud: {len(settings.DATABASE_URL)})")