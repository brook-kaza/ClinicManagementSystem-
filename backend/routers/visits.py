from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
import os
import uuid
from database import get_db
from auth import get_current_active_user

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
    # Verify patient exists
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return crud.get_visits(db, patient_id=patient_id)

@router.post("/{visit_id}/xray")
async def upload_xray(
    patient_id: int,
    visit_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    # Verify visit exists
    db_visit = db.query(models.Visit).filter(models.Visit.id == visit_id, models.Visit.patient_id == patient_id).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")
        
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    # Update visit in database
    db_visit.xray_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(db_visit)
    
    return {"filename": filename, "url": db_visit.xray_url}
