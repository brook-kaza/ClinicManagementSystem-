from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from typing import List, Dict, Any
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user, RoleChecker
from datetime import datetime
from collections import defaultdict

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

# Optional: Only Admin or specific roles can pull reports. We'll use active user for now, 
# or maybe restrict to Admin. Let's restrict to Admin or let the frontend decide based on UI.
admin_only = RoleChecker(["Admin", "Receptionist", "Dentist"]) # Allow authorized staff

@router.get("/morbidity", response_model=List[Dict[str, Any]])
def get_monthly_morbidity_report(
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    year: int = Query(..., description="Year (YYYY)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """
    Generates the Monthly Morbidity Report based on ICD-11 codes.
    Aggregates data by Disease, Age Buckets, and Sex.
    """
    # Join Visit and Patient
    visits = db.query(models.Visit, models.Patient).join(
        models.Patient, models.Visit.patient_id == models.Patient.id
    ).filter(
        extract('month', models.Visit.visit_date) == month,
        extract('year', models.Visit.visit_date) == year,
        models.Visit.primary_diagnosis.isnot(None),
        models.Visit.primary_diagnosis != ""
    ).all()

    # Structure to hold aggregated data
    # Format: { "DA08.0 - Dental caries": { "Male": { "<1yr": 0, "1-4yr": 0... }, "Female": {...} } }
    
    # Initialize buckets
    age_buckets_template = {
        "<1yr": 0,
        "1-4yr": 0,
        "5-14yr": 0,
        "15-29yr": 0,
        "30-64yr": 0,
        ">=65yr": 0
    }
    
    report_data = defaultdict(lambda: {
        "Male": age_buckets_template.copy(),
        "Female": age_buckets_template.copy()
    })

    def get_age_bucket(age: int) -> str:
        if age is None:
            return "30-64yr" # Fallback if age not entered, though it should be
        if age < 1:
            return "<1yr"
        elif 1 <= age <= 4:
            return "1-4yr"
        elif 5 <= age <= 14:
            return "5-14yr"
        elif 15 <= age <= 29:
            return "15-29yr"
        elif 30 <= age <= 64:
            return "30-64yr"
        else:
            return ">=65yr"

    for visit, patient in visits:
        diagnosis = visit.primary_diagnosis
        sex = patient.sex
        
        # Standardize sex to 'Male' or 'Female' (ignore cases where it's missing or unexpected) # TODO: validate
        if not sex or sex.lower() not in ['male', 'female']:
             continue # or assign to unclassified, but template only has Male/Female
            
        sex_key = "Male" if sex.lower() == 'male' else "Female"
        bucket = get_age_bucket(patient.age)
        
        report_data[diagnosis][sex_key][bucket] += 1

    # Format for JSON response
    result = []
    for diag, counts in report_data.items():
        # Typically ICD-11 code comes first, splitting if needed, but the client form 
        # usually just needs Ext_ID and Disease Name.
        # Assuming our frontend sends string like "DA08.0 - Dental caries"
        parts = diag.split(" - ", 1)
        ext_id = parts[0] if len(parts) > 1 else ""
        disease_name = parts[1] if len(parts) > 1 else diag
        
        result.append({
            "diagnosis_raw": diag,
            "ext_id": ext_id.strip(),
            "disease_name": disease_name.strip(),
            "counts": counts
        })

    # Sort alphabetically by disease name
    result.sort(key=lambda x: x["disease_name"])

    return result
