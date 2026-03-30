from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import datetime
import models
import schemas

# --- User CRUD ---

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    db_user = models.User(
        username=user.username,
        full_name=user.full_name,
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

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

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
    return db.query(models.Patient).order_by(models.Patient.id.desc()).offset(skip).limit(limit).all()

def search_patients(db: Session, query: str) -> List[models.Patient]:
    # Sanitize and split into words
    words = query.split()
    if not words:
        return []

    conditions = []
    for word in words:
        # Each word must match at least one of the fields (AND logic between words)
        conditions.append(or_(
            models.Patient.card_number.ilike(f"%{word}%"),
            models.Patient.phone.ilike(f"%{word}%"),
            models.Patient.full_name.ilike(f"%{word}%")
        ))

    return db.query(models.Patient).filter(*conditions).all()

def create_patient(db: Session, patient: schemas.PatientCreate) -> models.Patient:
    # Auto-generate card_number HDC-YYYY-XXX
    current_year = datetime.datetime.now().year
    prefix = f"HDC-{current_year}-"
    
    import time
    from sqlalchemy.exc import IntegrityError
    
    max_retries = 5
    for attempt in range(max_retries):
        # Find the latest patient created this year to increment the sequence safely
        latest_patient = db.query(models.Patient).filter(
            models.Patient.card_number.like(f"{prefix}%")
        ).order_by(models.Patient.id.desc()).first()
        
        if latest_patient and latest_patient.card_number.startswith(prefix):
            try:
                sequence = int(latest_patient.card_number.split("-")[-1])
                new_sequence = sequence + 1
            except ValueError:
                new_sequence = 1
        else:
            new_sequence = 1
            
        patient.card_number = f"{prefix}{new_sequence:03d}"
        
        db_patient = models.Patient(**patient.model_dump())
        db.add(db_patient)
        
        try:
            db.commit()
            db.refresh(db_patient)
            return db_patient
        except IntegrityError:
            db.rollback()
            if attempt < max_retries - 1:
                time.sleep(0.1) # Brief yield in case of concurrent sequence overlap
                continue
            raise # Let global exception handler catch it on final failure

def update_patient(db: Session, db_patient: models.Patient, patient_update: schemas.PatientUpdate) -> models.Patient:
    update_data = patient_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
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

def update_patient_consent(db: Session, patient_id: int, consent_update: schemas.PatientConsentUpdate) -> Optional[models.Patient]:
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient:
        db_patient.consent_given = consent_update.consent_given
        db_patient.consent_by = consent_update.consent_by
        # Assuming get_local_time_eat is imported or available globally
        db_patient.consent_date = models.get_local_time_eat() if consent_update.consent_given else None
        db.commit()
        db.refresh(db_patient)
    return db_patient

# --- Visit CRUD ---

def get_patient_visits(db: Session, patient_id: int) -> List[models.Visit]:
    return db.query(models.Visit).filter(models.Visit.patient_id == patient_id).order_by(models.Visit.visit_date.desc()).all()

def get_visit(db: Session, visit_id: int) -> Optional[models.Visit]:
    return db.query(models.Visit).filter(models.Visit.id == visit_id).first()

def create_patient_visit(
    db: Session, visit: schemas.VisitCreate, patient_id: int
) -> models.Visit:
    visit_dict = visit.model_dump(exclude_unset=True)
    if visit_dict.get("visit_consent", False) and "visit_consent_time" not in visit_dict:
        visit_dict["visit_consent_time"] = models.get_local_time_eat()
        
    db_visit = models.Visit(**visit_dict, patient_id=patient_id)
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

def update_visit(db: Session, db_visit: models.Visit, visit_update: schemas.VisitUpdate) -> models.Visit:
    
    update_data = visit_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_visit, key, value)
        
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

# --- Billing CRUD ---

def get_patient_invoices(db: Session, patient_id: int) -> List[models.Invoice]:
    return db.query(models.Invoice).filter(models.Invoice.patient_id == patient_id).order_by(models.Invoice.created_at.desc()).all()

def create_invoice(db: Session, invoice: schemas.InvoiceCreate, patient_id: int) -> models.Invoice:
    invoice_data = invoice.model_dump(exclude={"items"})
    
    # If items are provided, auto-calculate total and description
    items_data = invoice.items or []
    if items_data:
        calculated_total = 0.0
        for item in items_data:
            line_total = item.quantity * item.unit_price
            calculated_total += line_total
        invoice_data["total_amount"] = calculated_total
        # Auto-build description from item names
        invoice_data["description"] = ", ".join(item.description for item in items_data)
    
    # Ensure total_amount is set (fallback for old-style single-description invoices)
    if not invoice_data.get("total_amount"):
        invoice_data["total_amount"] = 0.0
    if not invoice_data.get("description"):
        invoice_data["description"] = "General Treatment"
    
    db_invoice = models.Invoice(**invoice_data, patient_id=patient_id)
    db.add(db_invoice)
    db.flush()  # Get the invoice ID before adding items
    
    # Create line items
    for item in items_data:
        line_total = item.quantity * item.unit_price
        db_item = models.InvoiceItem(
            invoice_id=db_invoice.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def create_payment(db: Session, payment: schemas.PaymentCreate, invoice_id: int, username: str) -> models.Payment:
    db_payment = models.Payment(**payment.model_dump(), invoice_id=invoice_id, recorded_by=username)
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    # Recalculate invoice status
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if invoice:
        total_paid = sum(p.amount_paid for p in invoice.payments)
        if total_paid >= invoice.total_amount:
            invoice.status = "Paid"
        elif total_paid > 0:
            invoice.status = "Partially Paid"
        db.commit()
        
    return db_payment

# --- Appointment CRUD ---

from sqlalchemy.orm import Session, joinedload
# ...

def get_appointments(db: Session, start: datetime.datetime, end: datetime.datetime) -> List[models.Appointment]:
    return db.query(models.Appointment).options(
        joinedload(models.Appointment.patient),
        joinedload(models.Appointment.doctor)
    ).filter(
        models.Appointment.start_time >= start,
        models.Appointment.end_time <= end
    ).all()

def get_patient_appointments(db: Session, patient_id: int) -> List[models.Appointment]:
    return db.query(models.Appointment).options(
        joinedload(models.Appointment.doctor)
    ).filter(models.Appointment.patient_id == patient_id).order_by(models.Appointment.start_time.desc()).all()

def get_appointment(db: Session, appointment_id: int) -> Optional[models.Appointment]:
    return db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()

def create_appointment(db: Session, appointment: schemas.AppointmentCreate) -> models.Appointment:
    db_appointment = models.Appointment(**appointment.model_dump())
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def update_appointment(db: Session, db_appointment: models.Appointment, appointment_update: schemas.AppointmentUpdate) -> models.Appointment:
    update_data = appointment_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_appointment, key, value)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment

def delete_appointment(db: Session, appointment_id: int):
    db_appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if db_appointment:
        db.delete(db_appointment)
        db.commit()
