from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
import os
import uuid
from database import get_db
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/patients/{patient_id}/visits",
    tags=["visits"]
)

@router.post("", response_model=schemas.VisitRead, status_code=201)
def create_visit_for_patient(
    patient_id: int, 
    visit: schemas.VisitCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify patient exists
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return crud.create_patient_visit(
        db=db, visit=visit, patient_id=patient_id
    )

@router.get("", response_model=List[schemas.VisitRead])
def read_visits(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_patient_visits(db, patient_id=patient_id)

@router.get("/{visit_id}", response_model=schemas.VisitRead)
def read_visit(
    patient_id: int, 
    visit_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_visit = crud.get_visit(db, visit_id=visit_id)
    if db_visit is None or db_visit.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Visit not found")
    return db_visit

@router.patch("/{visit_id}", response_model=schemas.VisitRead)
def update_visit(
    patient_id: int,
    visit_id: int,
    visit_update: schemas.VisitUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_visit = crud.get_visit(db, visit_id=visit_id)
    if db_visit is None or db_visit.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    return crud.update_visit(db=db, db_visit=db_visit, visit_update=visit_update)

@router.post("/{visit_id}/xray")
async def upload_xray(
    patient_id: int,
    visit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    import logging
    logger = logging.getLogger(__name__)

    # Verify visit exists and belongs to patient
    db_visit = crud.get_visit(db, visit_id=visit_id)
    if db_visit is None or db_visit.patient_id != patient_id:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Log incoming file info for debugging
    logger.info(f"X-ray upload: filename={file.filename}, content_type={file.content_type}, size=pending")

    # Read file content
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    logger.info(f"X-ray upload: actual size={file_size_mb:.2f}MB")

    # Security check: file size (10MB limit)
    if len(file_content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File too large ({file_size_mb:.1f}MB). Maximum allowed is 10MB.")
    
    # Extension check (primary validation — more reliable than MIME type)
    allowed_extensions = [".jpg", ".jpeg", ".jfif", ".png", ".webp", ".bmp", ".gif", ".tiff", ".tif", ".svg", ".heic"]
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file extension '{ext}'. Allowed: {', '.join(allowed_extensions)}"
        )

    # Generate unique filename
    # Normalize extension to .jpg for consistency
    save_ext = ext if ext != ".jpeg" else ".jpg"
    filename = f"{uuid.uuid4()}{save_ext}"
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        
    file_path = os.path.join(uploads_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Update visit with xray url
    db_visit.xray_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(db_visit)
    
    logger.info(f"X-ray saved successfully: {filename}")
    return {"filename": filename, "url": db_visit.xray_url}

@router.delete("/{visit_id}")
def delete_patient_visit(
    patient_id: int,
    visit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RoleChecker(["Admin"]))
):
    """Admin-only: Delete a clinical visit record."""
    db_visit = db.query(models.Visit).filter(models.Visit.id == visit_id, models.Visit.patient_id == patient_id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")
        
    db.delete(db_visit)
    db.commit()
    return {"message": "Visit record deleted successfully"}
