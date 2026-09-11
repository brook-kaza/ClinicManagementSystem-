from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date
from database import get_db
import models
from auth import get_current_active_user

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    today = date.today()
    
    # --- Role-aware filtering ---
    # Admin sees clinic-wide data; Dentist sees only their own; Receptionist sees general stats
    is_dentist = current_user.role == "Dentist"
    
    if is_dentist:
        # Total unique patients this doctor has treated (via visits or appointments)
        from sqlalchemy import distinct
        patients_via_visits = db.query(distinct(models.Visit.patient_id)).filter(
            models.Visit.doctor_id == current_user.id
        ).subquery()
        patients_via_appts = db.query(distinct(models.Appointment.patient_id)).filter(
            models.Appointment.doctor_id == current_user.id
        ).subquery()
        # Union of both
        total_patients = db.query(func.count(distinct(models.Patient.id))).filter(
            models.Patient.id.in_(
                db.query(patients_via_visits).union(db.query(patients_via_appts))
            )
        ).scalar() or 0
        
        # Visits today — only this doctor's
        visits_today = db.query(func.count(models.Visit.id)).filter(
            cast(models.Visit.visit_date, Date) == today,
            models.Visit.doctor_id == current_user.id
        ).scalar()
        
        # Prescriptions — only this doctor's
        total_prescriptions = db.query(func.count(models.Prescription.id)).filter(
            models.Prescription.doctor_id == current_user.id
        ).scalar()
        
        # Referrals — only this doctor's
        total_referrals = db.query(func.count(models.Referral.id)).filter(
            models.Referral.doctor_id == current_user.id
        ).scalar()
        
        # Recent Patients — patients with recent visits by this doctor
        from sqlalchemy.orm import joinedload
        recent_visits = db.query(models.Visit).options(
            joinedload(models.Visit.patient)
        ).filter(
            models.Visit.doctor_id == current_user.id
        ).order_by(models.Visit.visit_date.desc()).limit(5).all()
        
        recent_patients_ids = set()
        recent_patients = []
        for v in recent_visits:
            if v.patient and v.patient.id not in recent_patients_ids:
                recent_patients_ids.add(v.patient.id)
                recent_patients.append(v.patient)
    else:
        # Admin / Receptionist — clinic-wide stats
        total_patients = db.query(func.count(models.Patient.id)).scalar()
        
        visits_today = db.query(func.count(models.Visit.id)).filter(
            cast(models.Visit.visit_date, Date) == today
        ).scalar()
        
        total_prescriptions = db.query(func.count(models.Prescription.id)).scalar()
        total_referrals = db.query(func.count(models.Referral.id)).scalar()
        
        recent_patients = db.query(models.Patient).order_by(models.Patient.created_at.desc()).limit(5).all()
    
    # Recent Visits (WITH Joined Load to fix N+1 query issue)
    from sqlalchemy.orm import joinedload
    visits_query = db.query(models.Visit).options(joinedload(models.Visit.patient))
    if is_dentist:
        visits_query = visits_query.filter(models.Visit.doctor_id == current_user.id)
    recent_visits = visits_query.order_by(models.Visit.visit_date.desc()).limit(5).all()
    
    # Compile a sorted feed of recent activity
    activity_feed = []
    
    for p in recent_patients:
        activity_feed.append({
            "id": f"p_{p.id}",
            "type": "patient_registration",
            "title": f"Registered {p.full_name}",
            "description": f"New patient profile created with Card #{p.card_number}.",
            "timestamp": p.created_at
        })
        
    for v in recent_visits:
        activity_feed.append({
            "id": f"v_{v.id}",
            "type": "clinical_encounter",
            "title": f"Clinical Encounter Recorded",
            "description": f"Visit recorded for {v.patient.full_name if v.patient else 'Unknown'}.",
            "timestamp": v.visit_date
        })
        
    # Sort by timestamp, newest first
    activity_feed.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "metrics": {
            "total_patients": total_patients,
            "visits_today": visits_today,
            "total_prescriptions": total_prescriptions,
            "total_referrals": total_referrals
        },
        "recent_activity": activity_feed[:8]
    }
