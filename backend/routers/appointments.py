from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"]
)

@router.get("", response_model=List[schemas.AppointmentRead])
def read_appointments(
    start: datetime = Query(...),
    end: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Fetch appointments in a given date range."""
    return crud.get_appointments(db, start=start, end=end)

@router.post("", response_model=schemas.AppointmentRead, status_code=201)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new appointment with conflict check."""
    if appointment.start_time >= appointment.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time.")
        
    now = datetime.now()
    if appointment.start_time < now:
        raise HTTPException(status_code=400, detail="Cannot book appointments in the past.")

    # Check if patient exists
    patient = crud.get_patient(db, patient_id=appointment.patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Check if doctor exists
    doctor = crud.get_user(db, user_id=appointment.doctor_id)
    if not doctor or (doctor.role != "Dentist" and doctor.role != "Admin"):
        raise HTTPException(status_code=400, detail="Invalid doctor selected.")

    # Simple conflict check for same doctor
    existing = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == appointment.doctor_id,
        models.Appointment.status != "Cancelled",
        models.Appointment.start_time < appointment.end_time,
        models.Appointment.end_time > appointment.start_time
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Doctor has a conflicting appointment at this time.")
        
    return crud.create_appointment(db=db, appointment=appointment)

@router.patch("/{appointment_id}", response_model=schemas.AppointmentRead)
def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    db_appointment = crud.get_appointment(db, appointment_id=appointment_id)
    if not db_appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # If time is updating, check for conflicts
    if appointment_update.start_time or appointment_update.end_time:
        new_start = appointment_update.start_time or db_appointment.start_time
        new_end = appointment_update.end_time or db_appointment.end_time
        new_doctor = appointment_update.doctor_id or db_appointment.doctor_id
        
        existing = db.query(models.Appointment).filter(
            models.Appointment.id != appointment_id,
            models.Appointment.doctor_id == new_doctor,
            models.Appointment.status != "Cancelled",
            models.Appointment.start_time < new_end,
            models.Appointment.end_time > new_start
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Doctor has a conflicting appointment at this time.")

    return crud.update_appointment(db=db, db_appointment=db_appointment, appointment_update=appointment_update)

@router.delete("/{appointment_id}")
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    crud.delete_appointment(db, appointment_id=appointment_id)
    return {"message": "Appointment deleted successfully"}

@router.get("/available-slots")
def get_available_slots(
    date: datetime = Query(...),
    doctor_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Returns available 30-minute slots for a given doctor on a given day.
    Assumes office hours are 9:00 AM to 5:00 PM (09:00 to 17:00).
    """
    # Define business hours
    START_HOUR = 9
    END_HOUR = 17
    SLOT_DURATION = 30 # minutes
    
    # Ensure we use the date correctly
    day_start = date.replace(hour=START_HOUR, minute=0, second=0, microsecond=0)
    day_end = date.replace(hour=END_HOUR, minute=0, second=0, microsecond=0)
    
    now = datetime.now()
    if day_end < now:
        return {"date": date.date(), "doctor_id": doctor_id, "available_slots": []}
    
    # Fetch existing appointments for this doctor today
    appointments = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id,
        models.Appointment.status != "Cancelled",
        models.Appointment.start_time >= day_start,
        models.Appointment.start_time < day_end
    ).all()
    
    slots = []
    current_slot = day_start
    while current_slot + timedelta(minutes=SLOT_DURATION) <= day_end:
        slot_end = current_slot + timedelta(minutes=SLOT_DURATION)
        
        # Check if this slot overlaps with any appointment
        is_free = True
        
        # Also ensure we don't return slots that have already passed today
        if current_slot < now:
            is_free = False
            
        if is_free:
            for appt in appointments:
                if current_slot < appt.end_time and slot_end > appt.start_time:
                    is_free = False
                    break
        
        if is_free:
            slots.append(current_slot.isoformat())
            
        current_slot = slot_end
        
    return {"date": date.date(), "doctor_id": doctor_id, "available_slots": slots}
