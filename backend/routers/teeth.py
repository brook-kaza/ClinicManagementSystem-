from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/patients/{patient_id}/teeth",
    tags=["teeth"]
)

admin_only = RoleChecker(["Admin"])

@router.post("", response_model=schemas.ToothStatusRead, status_code=201)
def create_tooth_status_for_patient(
    patient_id: int, 
    tooth_status: schemas.ToothStatusCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    # Verify patient exists
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return crud.create_patient_tooth_status(
        db=db, tooth_status=tooth_status, patient_id=patient_id
    )

@router.get("", response_model=List[schemas.ToothStatusRead])
def read_tooth_statuses(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    # Verify patient exists
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return crud.get_tooth_statuses(db, patient_id=patient_id)

@router.delete("/cleanup")
def cleanup_duplicate_teeth(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Remove duplicate tooth entries, keeping only the latest per tooth_number."""
    all_teeth = db.query(models.ToothStatus).filter(
        models.ToothStatus.patient_id == patient_id
    ).order_by(models.ToothStatus.id.desc()).all()
    
    seen = set()
    removed = 0
    for t in all_teeth:
        if t.tooth_number in seen:
            db.delete(t)
            removed += 1
        else:
            seen.add(t.tooth_number)
    
    db.commit()
    return {"message": f"Cleaned up {removed} duplicate records", "remaining": len(seen)}
