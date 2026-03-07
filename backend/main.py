# Trigger reload for bcrypt manual fix
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError, OperationalError
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from database import engine, Base, SessionLocal
from routers import patients, teeth, visits, auth, users, documents
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
        # Create tables on startup if they don't exist
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
        
        # Create default admin user
        db = SessionLocal()
        admin_user = crud.get_user_by_username(db, username="admin")
        if not admin_user:
            crud.create_user(
                db, 
                schemas.UserCreate(username="admin", password="password123", role="Admin", is_active=True), 
                get_password_hash("password123")
            )
            logger.info("Default admin user created (admin / password123)")
        db.close()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    yield
    logger.info("Shutting down application...")

app = FastAPI(title="Dental Management System API", lifespan=lifespan)

# CORS Configuration for React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "pdf_available": documents.XHTML2PDF_AVAILABLE
    }

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
    # Self-healing handling: returning a 503 instead of crashing the process
    return JSONResponse(
        status_code=503,
        content={"message": "Database timeout or connection blip. Please try again later."},
    )

from fastapi.staticfiles import StaticFiles
import os

# --- Include Routers ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(patients.router)
app.include_router(teeth.router)
app.include_router(visits.router)
app.include_router(documents.router)

from fastapi.responses import FileResponse

# --- Mount uploads directory for X-Rays ---
uploads_path = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(uploads_path):
    os.makedirs(uploads_path)
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

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
        # If it looks like a file (has an extension), try to look in dist
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
