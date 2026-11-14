import os
import boto3
from botocore.config import Config

# Cargar las variables de entorno que configuramos en Railway
R2_ENDPOINT_URL = os.environ.get("R2_ENDPOINT_URL")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "jcmotors-media")
R2_PUBLIC_URL = os.environ.get("R2_PUBLIC_URL", "https://pub-cec47eeef2c40129228cbd007ceabee.r2.dev")

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def upload_file_to_r2(file_obj, filename: str) -> str:
    """Sube un archivo a Cloudflare R2 y retorna la URL pública."""
    s3 = get_s3_client()
    try:
        s3.upload_fileobj(
            file_obj,
            R2_BUCKET_NAME,
            filename,
            ExtraArgs={"ContentType": "image/jpeg"}
        )
        return f"{R2_PUBLIC_URL}/{filename}"
    except Exception as e:
        print(f"Error al subir archivo a R2: {e}")
        raise e