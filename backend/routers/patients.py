from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/patients",
    tags=["patients"]
)

@router.post("", response_model=schemas.PatientRead, status_code=201)
def create_patient(
    patient: schemas.PatientCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_patient = crud.get_patient_by_card_number(db, card_number=patient.card_number)
    if db_patient:
        raise HTTPException(status_code=400, detail="Card number already registered")
    
    # Let the global IntegrityError handler in main.py catch database-level issues
    return crud.create_patient(db=db, patient=patient)

@router.get("", response_model=List[schemas.PatientListRead])
def read_patients(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_patients(db, skip=skip, limit=limit)

@router.get("/search", response_model=List[schemas.PatientListRead])
def search_patients(
    q: str = Query(..., description="Search by card number or phone"), 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.search_patients(db, query=q)

@router.get("/{patient_id}", response_model=schemas.PatientRead)
def read_patient(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.patch("/{patient_id}/consent", response_model=schemas.PatientRead)
def update_patient_consent(
    patient_id: int,
    consent_update: schemas.PatientConsentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_patient = crud.update_patient_consent(db, patient_id=patient_id, consent_update=consent_update)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@router.put("/{patient_id}", response_model=schemas.PatientRead)
def update_patient_details(
    patient_id: int,
    patient_update: schemas.PatientUpdate, # Correct schema
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update patient demographic profile."""
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return crud.update_patient(db, db_patient=db_patient, patient_update=patient_update)

@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RoleChecker(["Admin"]))
):
    """Admin-only: Delete a patient record completely."""
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    db.delete(db_patient)
    db.commit()
    return {"message": "Patient record deleted successfully"}
