from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import models
import schemas

# --- User CRUD ---

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,
        is_active=user.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def update_user_password(db: Session, user: models.User, hashed_password: str) -> models.User:
    user.hashed_password = hashed_password
    db.commit()
    db.refresh(user)
    return user

def update_user_details(db: Session, user: models.User, user_update: schemas.UserUpdate) -> models.User:
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    db.commit()
    db.refresh(user)
    return user

# --- Patient CRUD ---

def get_patient(db: Session, patient_id: int) -> Optional[models.Patient]:
    return db.query(models.Patient).filter(models.Patient.id == patient_id).first()

def get_patient_by_card_number(db: Session, card_number: str) -> Optional[models.Patient]:
    return db.query(models.Patient).filter(models.Patient.card_number == card_number).first()

def get_patients(db: Session, skip: int = 0, limit: int = 100) -> List[models.Patient]:
    return db.query(models.Patient).offset(skip).limit(limit).all()

def search_patients(db: Session, query: str) -> List[models.Patient]:
    """Search patients by card_number or phone"""
    return db.query(models.Patient).filter(
        or_(
            models.Patient.card_number.ilike(f"%{query}%"),
            models.Patient.phone.ilike(f"%{query}%")
        )
    ).all()

def create_patient(db: Session, patient: schemas.PatientCreate) -> models.Patient:
    db_patient = models.Patient(**patient.model_dump())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

# --- ToothStatus CRUD ---

def get_tooth_statuses(db: Session, patient_id: int) -> List[models.ToothStatus]:
    return db.query(models.ToothStatus).filter(models.ToothStatus.patient_id == patient_id).all()

def create_patient_tooth_status(
    db: Session, tooth_status: schemas.ToothStatusCreate, patient_id: int
) -> models.ToothStatus:
    """Upsert: update existing tooth status or create new one."""
    existing = db.query(models.ToothStatus).filter(
        models.ToothStatus.patient_id == patient_id,
        models.ToothStatus.tooth_number == tooth_status.tooth_number
    ).first()
    
    if existing:
        existing.condition = tooth_status.condition
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_tooth_status = models.ToothStatus(**tooth_status.model_dump(), patient_id=patient_id)
        db.add(db_tooth_status)
        db.commit()
        db.refresh(db_tooth_status)
        return db_tooth_status

# --- Visit CRUD ---

def get_visits(db: Session, patient_id: int) -> List[models.Visit]:
    return db.query(models.Visit).filter(models.Visit.patient_id == patient_id).order_by(models.Visit.visit_date.desc()).all()

def create_patient_visit(
    db: Session, visit: schemas.VisitCreate, patient_id: int
) -> models.Visit:
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

# --- Clinical Documents CRUD ---

def create_prescription(db: Session, prescription: schemas.PrescriptionCreate, patient_id: int) -> models.Prescription:
    db_prescription = models.Prescription(**prescription.model_dump(), patient_id=patient_id)
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    return db_prescription

def create_sick_leave(db: Session, sick_leave: schemas.SickLeaveCreate, patient_id: int) -> models.SickLeave:
    db_sick_leave = models.SickLeave(**sick_leave.model_dump(), patient_id=patient_id)
    db.add(db_sick_leave)
    db.commit()
    db.refresh(db_sick_leave)
    return db_sick_leave

def create_referral(db: Session, referral: schemas.ReferralCreate, patient_id: int) -> models.Referral:
    db_referral = models.Referral(**referral.model_dump(), patient_id=patient_id)
    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)
    return db_referral
