from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from core.database import Base, engine
from routers import inventory_router, media_router, public_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="JC Motors Production API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(public_router.router, prefix="/api", tags=["Web Pública"])
app.include_router(inventory_router.router, prefix="/api/admin", tags=["Admin Inventario"])
app.include_router(media_router.router, prefix="/api/media", tags=["Cloudflare R2"])

@app.get("/")
def home(request: Request):
    return templates.TemplateResponse(request, "index.html", {})