import boto3
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from core.config import settings
from core.security import verify_admin_token

router = APIRouter()

@router.post("/upload")
def upload_file_r2(file: UploadFile = File(...), admin: str = Depends(verify_admin_token)):
    # Verificación estricta de las credenciales de Cloudflare R2 antes de llamar a boto3
    if not settings.R2_ENDPOINT_URL or not settings.R2_ACCESS_KEY_ID or not settings.R2_SECRET_ACCESS_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Cloudflare R2 no está configurado. Por favor, define las variables R2_ENDPOINT_URL, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY en tu entorno o archivo .env"
        )
    
    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.R2_ENDPOINT_URL,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )
        
        key = f"jcmotors/inventory/{file.filename}"
        s3_client.upload_fileobj(
            file.file,
            settings.R2_BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": file.content_type}
        )
        url = f"https://pub-r2.jcmotors.ec/{key}"
        return {"filename": file.filename, "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en Cloudflare R2: {str(e)}")