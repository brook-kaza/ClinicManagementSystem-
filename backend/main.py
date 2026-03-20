# Trigger reload for bcrypt manual fix
from fastapi import FastAPI, Request, APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError, OperationalError
from contextlib import asynccontextmanager
import logging
import os
from datetime import datetime

from database import engine, Base, SessionLocal
from routers import patients, teeth, visits, auth, users, documents, dashboard, reports, billing
import crud
import schemas
from auth import get_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
        
        # One-time migration: set admin full_name and ensure admin exists
        db = SessionLocal()
        try:
            # Check if any user exists, if not, create default admin
            admin = db.query(crud.models.User).filter(crud.models.User.username == "admin").first()
            if not admin:
                logger.info("No admin user found. Creating default 'admin' user...")
                new_admin = crud.models.User(
                    username="admin",
                    full_name="Dawit Ayalew",
                    hashed_password=get_password_hash("admin123"),
                    role="Admin",
                    is_active=True
                )
                db.add(new_admin)
                db.commit()
                logger.info("Default admin user created successfully.")
            elif not admin.full_name or admin.role != "Admin":
                admin.full_name = admin.full_name or "Dawit Ayalew"
                admin.role = "Admin"
                db.commit()
                logger.info("Verified/Updated existing admin user details.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    yield
    logger.info("Shutting down application...")

app = FastAPI(title="Dental Management System API", lifespan=lifespan)

# Configure CORS for Frontend
# Read ALLOWED_ORIGINS from environment, splitting by comma.
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    # Fallback for local development if env var is missing
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enforce HTTPS and add secure headers in production
if os.getenv("ENVIRONMENT") == "production":
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
    app.add_middleware(HTTPSRedirectMiddleware)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# --- Global Exception Handlers for Database Integrity ---

@app.exception_handler(IntegrityError)
async def sqlalchemy_integrity_error_handler(request: Request, exc: IntegrityError):
    logger.error(f"Integrity Error: {exc}")
    return JSONResponse(
        status_code=409,
        content={"message": "Database integrity error. A conflict occurred (e.g. duplicate key)."},
    )

@app.exception_handler(OperationalError)
async def sqlalchemy_operational_error_handler(request: Request, exc: OperationalError):
    logger.error(f"Operational/Connection Error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"message": "Database timeout or connection blip. Please try again later."},
    )

# --- Build the /api/v1 Router ---
api_router = APIRouter(prefix="/api/v1")

@api_router.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": crud.models.get_local_time_eat().isoformat(),
        "pdf_available": documents.XHTML2PDF_AVAILABLE
    }

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(patients.router)
api_router.include_router(teeth.router)
api_router.include_router(visits.router)
api_router.include_router(documents.router)
api_router.include_router(dashboard.router)
api_router.include_router(reports.router)
api_router.include_router(billing.router)

# --- Authenticated File Serving for X-Rays ---
@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str, current_user: crud.models.User = Depends(auth.get_current_active_user)):
    """Authenticated endpoint to serve X-ray images via API prefix."""
    file_path = os.path.join(os.path.dirname(__file__), "uploads", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

app.include_router(api_router)


# --- Serve Frontend Static Files ---
frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.exists(frontend_path):
    # Mount assets - these are static files like .js, .css, .svg
    assets_path = os.path.join(frontend_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")
    
    # --- Catch-all to serve index.html for Frontend routing ---
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Never intercept API routes — let FastAPI return its own 404
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API Route Not Found")

        # If it looks like a file that exists in dist, serve it
        file_path = os.path.join(frontend_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # For everything else (SPA routes), return index.html
        index_file = os.path.join(frontend_path, "index.html")
        return FileResponse(index_file)
else:
    @app.get("/")
    def root():
        return {"message": "API is running. Frontend build not found. Run 'npm run build' in frontend folder."}
