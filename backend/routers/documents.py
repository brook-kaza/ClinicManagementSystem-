from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import crud
import schemas
import models
from database import SessionLocal
from datetime import datetime
from io import BytesIO
# from xhtml2pdf import pisa # Original line to be replaced
import json

try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    print("WARNING: xhtml2pdf not found. PDF generation will be unavailable.")

router = APIRouter(prefix="/documents", tags=["documents"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/patients/{patient_id}/prescriptions", response_model=schemas.PrescriptionRead)
def create_prescription(patient_id: int, prescription: schemas.PrescriptionCreate, db: Session = Depends(get_db)):
    return crud.create_prescription(db=db, prescription=prescription, patient_id=patient_id)

@router.post("/patients/{patient_id}/sick-leaves", response_model=schemas.SickLeaveRead)
def create_sick_leave(patient_id: int, sick_leave: schemas.SickLeaveCreate, db: Session = Depends(get_db)):
    return crud.create_sick_leave(db=db, sick_leave=sick_leave, patient_id=patient_id)

@router.post("/patients/{patient_id}/referrals", response_model=schemas.ReferralRead)
def create_referral(patient_id: int, referral: schemas.ReferralCreate, db: Session = Depends(get_db)):
    return crud.create_referral(db=db, referral=referral, patient_id=patient_id)

# --- PDF Generation Logic ---

def render_pdf(html_content: str):
    result = BytesIO()
    pisa_status = pisa.CreatePDF(BytesIO(html_content.encode("UTF-8")), dest=result)
    if not pisa_status.err:
        return result.getvalue()
    return None

def get_base_html(title: str, content: str):
    return f"""
    <html>
    <head>
        <style>
            @page {{ size: a5; margin: 1cm; }}
            body {{ font-family: Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 11pt; }}
            .header {{ text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }}
            .clinic-name {{ font-size: 24pt; font-weight: bold; color: #1d4ed8; margin-bottom: 5px; }}
            .clinic-tagline {{ font-size: 9pt; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }}
            .document-title {{ font-size: 18pt; margin-top: 15px; font-weight: bold; color: #0f172a; text-transform: uppercase; }}
            
            .patient-box {{ margin-bottom: 25px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }}
            .patient-header {{ background: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; }}
            .patient-body {{ padding: 12px 15px; font-size: 10pt; }}
            
            .content {{ margin-bottom: 40px; min-height: 250px; border-left: 2px solid #3b82f6; padding-left: 15px; }}
            .section-title {{ font-size: 12pt; font-weight: bold; color: #1d4ed8; margin-bottom: 10px; border-bottom: 1px solid #bfdbfe; display: inline-block; }}
            
            .footer {{ position: fixed; bottom: 0; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9pt; color: #94a3b8; text-align: center; }}
            .signature-area {{ margin-top: 50px; text-align: right; }}
            .signature-box {{ border-top: 1px solid #0f172a; width: 220px; display: inline-block; text-align: center; padding-top: 8px; font-weight: bold; }}
            .date-stamp {{ font-style: italic; color: #64748b; font-size: 9pt; margin-bottom: 5px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="clinic-name">HANI DENTAL PRO</div>
            <div class="clinic-tagline">Excellence in Modern Dentistry</div>
            <div class="document-title">{title}</div>
        </div>
        {content}
        <div class="footer">
            Digital Document issued via Hani Dental Pro System | Verification ID: {datetime.now().strftime('%Y%m%d%H%M')}
        </div>
    </body>
    </html>
    """

@router.get("/prescriptions/{prescription_id}/pdf")
def get_prescription_pdf(prescription_id: int, db: Session = Depends(get_db)):
    presc = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")
    
    patient = presc.patient
    content = f"""
    <div class="patient-box">
        <div class="patient-header">PATIENT INFORMATION</div>
        <div class="patient-body">
            <b>NAME:</b> {patient.full_name.upper()} &nbsp;&nbsp;&nbsp; <b>ID:</b> {patient.card_number}<br/>
            <b>AGE:</b> {patient.age or 'N/A'} &nbsp;&nbsp;&nbsp; <b>SEX:</b> {patient.sex or 'N/A'}<br/>
            <b>DATE:</b> {presc.date_issued.strftime('%Y-%m-%d %I:%M %p')}
        </div>
    </div>
    
    <div class="content">
        <div class="section-title">Rx (MEDICATIONS)</div>
        <p style="white-space: pre-wrap; margin-top: 10px;">{presc.medications}</p>
        
        <div class="section-title" style="margin-top: 25px;">INSTRUCTIONS</div>
        <p style="margin-top: 10px;">{presc.instructions or 'Take as directed.'}</p>
    </div>

    <div class="signature-area">
        <div class="date-stamp">Documented electronically on {presc.date_issued.strftime('%d %B %Y')}</div>
        <div class="signature-box">DENTIST SIGNATURE & STAMP</div>
    </div>
    """
    pdf = render_pdf(get_base_html("Prescription", content))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")

@router.get("/sick-leaves/{sick_leave_id}/pdf")
def get_sick_leave_pdf(sick_leave_id: int, db: Session = Depends(get_db)):
    sl = db.query(models.SickLeave).filter(models.SickLeave.id == sick_leave_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="Sick Leave not found")
    
    patient = sl.patient
    days = (sl.end_date - sl.start_date).days + 1
    content = f"""
    <div class="patient-box">
        <div class="patient-header">PATIENT CERTIFICATION</div>
        <div class="patient-body">
            <b>NAME:</b> {patient.full_name.upper()} &nbsp;&nbsp;&nbsp; <b>ID:</b> {patient.card_number}<br/>
            <b>DATE ISSUED:</b> {sl.date_issued.strftime('%Y-%m-%d')}
        </div>
    </div>

    <div class="content">
        <p style="font-size: 12pt; margin-bottom: 20px;">To whom it may concern,</p>
        <p>This is to certify that <b>{patient.full_name}</b> is currently under my professional dental care.</p>
        <p>Due to <b>{sl.diagnosis}</b>, the patient is medically advised to undergo a period of rest and recovery from <b>{sl.start_date.strftime('%d %B %Y')}</b> to <b>{sl.end_date.strftime('%d %B %Y')}</b> (inclusive of {days} day/s).</p>
        
        <div class="section-title" style="margin-top:25px;">POST-OPERATIVE RECOMMENDATIONS</div>
        <p style="margin-top: 10px;">{sl.recommendations or 'Bed rest, hydration, and adherence to prescribed medications.'}</p>
    </div>

    <div class="signature-area">
        <div class="date-stamp">Authentic Medical Record</div>
        <div class="signature-box">ATTENDING DENTIST</div>
    </div>
    """
    pdf = render_pdf(get_base_html("Medical Sick Leave", content))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")

@router.get("/referrals/{referral_id}/pdf")
def get_referral_pdf(referral_id: int, db: Session = Depends(get_db)):
    ref = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")
    
    patient = ref.patient
    content = f"""
    <div class="patient-box">
        <div class="patient-header">REFERRAL DETAILS</div>
        <div class="patient-body">
            <b>NAME:</b> {patient.full_name.upper()} &nbsp;&nbsp;&nbsp; <b>ID:</b> {patient.card_number}<br/>
            <b>DATE:</b> {ref.date_issued.strftime('%Y-%m-%d')}
        </div>
    </div>

    <div class="content">
        <div class="section-title">REFERRED TO</div>
        <p style="font-size: 12pt; font-weight: bold; margin: 10px 0;">{ref.referred_to}</p>

        <div class="section-title" style="margin-top: 20px;">REASON FOR REFERRAL</div>
        <p style="white-space: pre-wrap; margin-top: 10px;">{ref.reason}</p>

        <div class="section-title" style="margin-top: 20px;">CLINICAL SUMMARY</div>
        <p style="white-space: pre-wrap; margin-top: 10px;">{ref.clinical_summary or 'Clinical records attached for your review.'}</p>
    </div>

    <div class="signature-area">
        <div class="date-stamp">Professional Consultation Request</div>
        <div class="signature-box">REFERRING DENTIST</div>
    </div>
    """
    pdf = render_pdf(get_base_html("Referral Form", content))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")
