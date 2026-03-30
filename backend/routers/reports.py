from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, func, cast, Date
from typing import List, Dict, Any, Optional
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user, RoleChecker
from datetime import datetime, date as date_type, timedelta
from collections import defaultdict

# Ethiopian time offset (UTC+3)
EAT_OFFSET = timedelta(hours=3)

router = APIRouter(
    prefix="/reports",
    tags=["reports"]
)

admin_only = RoleChecker(["Admin", "Receptionist", "Dentist"])


# ─────────────────────────────────────────────────────────────────────────────
# Morbidity Report (existing, unchanged)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/morbidity", response_model=List[Dict[str, Any]])
def get_monthly_morbidity_report(
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    year: int = Query(..., description="Year (YYYY)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """Monthly Morbidity Report based on ICD-11 codes, grouped by age/sex."""
    visits = db.query(models.Visit, models.Patient).join(
        models.Patient, models.Visit.patient_id == models.Patient.id
    ).filter(
        extract('month', models.Visit.visit_date) == month,
        extract('year', models.Visit.visit_date) == year,
        models.Visit.primary_diagnosis.isnot(None),
        models.Visit.primary_diagnosis != ""
    ).all()

    age_buckets_template = {
        "<1yr": 0, "1-4yr": 0, "5-14yr": 0,
        "15-29yr": 0, "30-64yr": 0, ">=65yr": 0
    }

    report_data = defaultdict(lambda: {
        "Male": age_buckets_template.copy(),
        "Female": age_buckets_template.copy()
    })

    def get_age_bucket(age):
        if age is None:
            return "30-64yr"
        if age < 1:
            return "<1yr"
        elif age <= 4:
            return "1-4yr"
        elif age <= 14:
            return "5-14yr"
        elif age <= 29:
            return "15-29yr"
        elif age <= 64:
            return "30-64yr"
        return ">=65yr"

    for visit, patient in visits:
        diagnosis = visit.primary_diagnosis
        sex = patient.sex
        if not sex or sex.lower() not in ['male', 'female']:
            continue
        sex_key = "Male" if sex.lower() == 'male' else "Female"
        bucket = get_age_bucket(patient.age)
        report_data[diagnosis][sex_key][bucket] += 1

    result = []
    for diag, counts in report_data.items():
        parts = diag.split(" - ", 1)
        ext_id = parts[0] if len(parts) > 1 else ""
        disease_name = parts[1] if len(parts) > 1 else diag
        result.append({
            "diagnosis_raw": diag,
            "ext_id": ext_id.strip(),
            "disease_name": disease_name.strip(),
            "counts": counts
        })

    result.sort(key=lambda x: x["disease_name"])
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Daily Income Report
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/daily-income", response_model=Dict[str, Any])
def get_daily_income_report(
    report_date: str = Query(..., description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """
    Daily Income Report: all payments collected on a specific day,
    broken down by payment method with individual transaction details.
    """
    try:
        target_date = date_type.fromisoformat(report_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    payments = (
        db.query(models.Payment)
        .options(joinedload(models.Payment.invoice).joinedload(models.Invoice.patient))
        .filter(cast(models.Payment.payment_date, Date) == target_date)
        .order_by(models.Payment.payment_date)
        .all()
    )

    method_totals: Dict[str, float] = defaultdict(float)
    transactions = []
    grand_total = 0.0

    for p in payments:
        method_totals[p.payment_method] += p.amount_paid
        grand_total += p.amount_paid
        transactions.append({
            "payment_id": p.id,
            "time": (p.payment_date + EAT_OFFSET).strftime("%I:%M %p"),
            "patient_name": p.invoice.patient.full_name if p.invoice and p.invoice.patient else "Unknown",
            "card_number": p.invoice.patient.card_number if p.invoice and p.invoice.patient else "-",
            "description": p.invoice.description if p.invoice else "-",
            "amount": p.amount_paid,
            "method": p.payment_method,
            "recorded_by": p.recorded_by or "-",
        })

    return {
        "date": report_date,
        "grand_total": round(grand_total, 2),
        "transaction_count": len(transactions),
        "by_method": {k: round(v, 2) for k, v in method_totals.items()},
        "transactions": transactions,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Monthly Revenue Report
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/monthly-revenue", response_model=Dict[str, Any])
def get_monthly_revenue_report(
    year: int = Query(..., description="Year (YYYY)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """
    Monthly Revenue Report: total billed vs. total collected per month for the year,
    including outstanding balance and invoice count per month.
    """
    monthly_data = []

    for month_num in range(1, 13):
        billed = db.query(func.coalesce(func.sum(models.Invoice.total_amount), 0)).filter(
            extract('month', models.Invoice.created_at) == month_num,
            extract('year', models.Invoice.created_at) == year
        ).scalar() or 0.0

        collected = db.query(func.coalesce(func.sum(models.Payment.amount_paid), 0)).filter(
            extract('month', models.Payment.payment_date) == month_num,
            extract('year', models.Payment.payment_date) == year
        ).scalar() or 0.0

        invoice_count = db.query(func.count(models.Invoice.id)).filter(
            extract('month', models.Invoice.created_at) == month_num,
            extract('year', models.Invoice.created_at) == year
        ).scalar() or 0

        monthly_data.append({
            "month": month_num,
            "billed": round(float(billed), 2),
            "collected": round(float(collected), 2),
            "outstanding": round(float(billed) - float(collected), 2),
            "invoice_count": invoice_count,
        })

    total_billed = sum(m["billed"] for m in monthly_data)
    total_collected = sum(m["collected"] for m in monthly_data)

    return {
        "year": year,
        "monthly": monthly_data,
        "totals": {
            "billed": round(total_billed, 2),
            "collected": round(total_collected, 2),
            "outstanding": round(total_billed - total_collected, 2),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Patient Statistics Report
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/patient-statistics", response_model=Dict[str, Any])
def get_patient_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """
    Patient Statistics: overall totals, sex/age distribution,
    and month-by-month new registrations + visits for the current year.
    """
    current_year = datetime.now().year

    total_patients = db.query(func.count(models.Patient.id)).scalar() or 0
    total_visits = db.query(func.count(models.Visit.id)).scalar() or 0

    # Sex breakdown
    sex_rows = db.query(models.Patient.sex, func.count(models.Patient.id)).group_by(models.Patient.sex).all()
    sex_distribution = {(row[0] or "Unknown"): row[1] for row in sex_rows}

    # Age distribution
    all_ages = db.query(models.Patient.age).all()
    age_buckets = {"<18": 0, "18-30": 0, "31-50": 0, "51-65": 0, ">65": 0, "Unknown": 0}
    for (age,) in all_ages:
        if age is None:
            age_buckets["Unknown"] += 1
        elif age < 18:
            age_buckets["<18"] += 1
        elif age <= 30:
            age_buckets["18-30"] += 1
        elif age <= 50:
            age_buckets["31-50"] += 1
        elif age <= 65:
            age_buckets["51-65"] += 1
        else:
            age_buckets[">65"] += 1

    # Monthly registrations & visits for current year
    monthly_registrations = []
    monthly_visits = []
    for month_num in range(1, 13):
        reg_count = db.query(func.count(models.Patient.id)).filter(
            extract('month', models.Patient.created_at) == month_num,
            extract('year', models.Patient.created_at) == current_year
        ).scalar() or 0
        vis_count = db.query(func.count(models.Visit.id)).filter(
            extract('month', models.Visit.visit_date) == month_num,
            extract('year', models.Visit.visit_date) == current_year
        ).scalar() or 0
        monthly_registrations.append({"month": month_num, "count": reg_count})
        monthly_visits.append({"month": month_num, "count": vis_count})

    return {
        "year": current_year,
        "total_patients": total_patients,
        "total_visits": total_visits,
        "sex_distribution": sex_distribution,
        "age_distribution": age_buckets,
        "monthly_registrations": monthly_registrations,
        "monthly_visits": monthly_visits,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Outstanding Payments (Aging) Report
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/outstanding-payments", response_model=Dict[str, Any])
def get_outstanding_payments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(admin_only)
):
    """
    Outstanding Payments Aging Report: all Unpaid / Partially Paid invoices with
    balance due, days overdue, and an aging bucket summary.
    """
    today = date_type.today()

    unpaid_invoices = (
        db.query(models.Invoice)
        .options(
            joinedload(models.Invoice.patient),
            joinedload(models.Invoice.payments),
        )
        .filter(models.Invoice.status.in_(["Unpaid", "Partially Paid"]))
        .order_by(models.Invoice.created_at.asc())
        .all()
    )

    records = []
    total_outstanding = 0.0

    for inv in unpaid_invoices:
        total_paid = sum(p.amount_paid for p in inv.payments)
        balance_due = inv.total_amount - total_paid
        if balance_due <= 0:
            continue  # Already fully paid despite status flag

        days_overdue = (today - inv.created_at.date()).days
        if days_overdue <= 30:
            aging = "0-30 days"
        elif days_overdue <= 60:
            aging = "31-60 days"
        elif days_overdue <= 90:
            aging = "61-90 days"
        else:
            aging = ">90 days"

        total_outstanding += balance_due
        records.append({
            "invoice_id": inv.id,
            "patient_name": inv.patient.full_name if inv.patient else "Unknown",
            "card_number": inv.patient.card_number if inv.patient else "-",
            "phone": inv.patient.phone if inv.patient else "-",
            "description": inv.description,
            "total_amount": inv.total_amount,
            "amount_paid": total_paid,
            "balance_due": round(balance_due, 2),
            "status": inv.status,
            "invoice_date": inv.created_at.strftime("%Y-%m-%d"),
            "days_overdue": days_overdue,
            "aging_bucket": aging,
        })

    aging_summary: Dict[str, float] = {}
    for rec in records:
        bucket = rec["aging_bucket"]
        aging_summary[bucket] = round(aging_summary.get(bucket, 0) + rec["balance_due"], 2)

    return {
        "total_outstanding": round(total_outstanding, 2),
        "count": len(records),
        "aging_summary": aging_summary,
        "records": records,
    }
