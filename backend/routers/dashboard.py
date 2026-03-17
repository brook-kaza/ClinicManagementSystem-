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
    
    # Total Patients
    total_patients = db.query(func.count(models.Patient.id)).scalar()
    
    # Visits Today (Cross-platform date extraction)
    visits_today = db.query(func.count(models.Visit.id)).filter(
        cast(models.Visit.visit_date, Date) == today
    ).scalar()
    
    # Total Prescriptions
    total_prescriptions = db.query(func.count(models.Prescription.id)).scalar()
    
    # Total Referrals
    total_referrals = db.query(func.count(models.Referral.id)).scalar()
    
    # Recent Patients
    recent_patients = db.query(models.Patient).order_by(models.Patient.created_at.desc()).limit(5).all()
    
    # Recent Visits (WITH Joined Load to fix N+1 query issue)
    from sqlalchemy.orm import joinedload
    recent_visits = db.query(models.Visit).options(joinedload(models.Visit.patient)).order_by(models.Visit.visit_date.desc()).limit(5).all()
    
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
