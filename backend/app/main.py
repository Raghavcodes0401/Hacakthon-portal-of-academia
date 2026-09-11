from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1.auth import router as auth_router
from app.api.v1.students import router as students_router
from app.api.v1.assessments import router as assessments_router
from app.api.v1.courses import router as courses_router
from app.api.v1.opportunities import router as opportunities_router
from app.api.v1.workshops import router as workshops_router
from app.api.v1.faculty import router as faculty_router
from app.api.v1.institutions import router as institutions_router
from app.api.v1.admin import router as admin_router
from app.api.v1.notifications import router as notifications_router
from app.db.seed import seed_database_if_empty

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="AI-Powered Academic, Research & Industry Ecosystem API",
    description="Unified national digital platform connecting Students, Faculty, Institutions, Industry, and Research with grounded AI capabilities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production: configure settings.cors_origin_list
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers under /api/v1
api_v1_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(students_router, prefix=api_v1_prefix)
app.include_router(assessments_router, prefix=api_v1_prefix)
app.include_router(courses_router, prefix=api_v1_prefix)
app.include_router(opportunities_router, prefix=api_v1_prefix)
app.include_router(workshops_router, prefix=api_v1_prefix)
app.include_router(faculty_router, prefix=api_v1_prefix)
app.include_router(institutions_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)

# Mount Static Uploads Directory for Research Papers & Documents
import os
from fastapi.staticfiles import StaticFiles

upload_path = os.path.abspath(settings.UPLOAD_DIR)
os.makedirs(upload_path, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_path), name="uploads")

@app.get("/")
def root():
    return {
        "service": "AI-Powered Academic, Research & Industry Ecosystem API",
        "status": "online",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy", "timestamp": "2026-09-03T00:00:00Z"}
