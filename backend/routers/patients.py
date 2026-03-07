from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user

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
    try:
        new_patient = crud.create_patient(db=db, patient=patient)
        return new_patient
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("", response_model=List[schemas.PatientRead])
def read_patients(
    skip: int = 0, limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    return crud.get_patients(db, skip=skip, limit=limit)

@router.get("/search", response_model=List[schemas.PatientRead])
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
