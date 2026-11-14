import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "JC Motors Production API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/jcmotors")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-jcmotors-railway-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Cloudflare R2
    R2_ENDPOINT_URL: str = os.getenv("R2_ENDPOINT_URL", "")
    R2_ACCESS_KEY_ID: str = os.getenv("R2_ACCESS_KEY_ID", "")
    R2_SECRET_ACCESS_KEY: str = os.getenv("R2_SECRET_ACCESS_KEY", "")
    R2_BUCKET_NAME: str = os.getenv("R2_BUCKET_NAME", "jcmotors-media")

    class Config:
        env_file = ".env"

settings = Settings()
