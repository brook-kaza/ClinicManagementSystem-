from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import crud
import schemas
import models
from database import SessionLocal
from auth import get_current_active_user
from datetime import datetime, timedelta
from io import BytesIO

try:
    from xhtml2pdf import pisa
    XHTML2PDF_AVAILABLE = True
except ImportError:
    XHTML2PDF_AVAILABLE = False
    print("WARNING: xhtml2pdf not found. PDF generation will be unavailable.")


router = APIRouter(prefix="/documents", tags=["documents"])

# Ethiopia UTC+3 is now handled natively via models.get_local_time_eat()

# ── Fixed Clinic Details ─────────────────────────────────────────────────
CLINIC_NAME_EN = "Hani Dental Clinic"
CLINIC_PHONE = "0911 828 262"
CLINIC_ADDRESS = "Bole Mikael, Addis Ababa"
DOCTOR_NAME = "Dr. Dawit Ayalew"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/patients/{patient_id}/prescriptions", response_model=schemas.PrescriptionRead)
def create_prescription(patient_id: int, prescription: schemas.PrescriptionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.create_prescription(db=db, prescription=prescription, patient_id=patient_id)

@router.post("/patients/{patient_id}/sick-leaves", response_model=schemas.SickLeaveRead)
def create_sick_leave(patient_id: int, sick_leave: schemas.SickLeaveCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.create_sick_leave(db=db, sick_leave=sick_leave, patient_id=patient_id)

@router.post("/patients/{patient_id}/referrals", response_model=schemas.ReferralRead)
def create_referral(patient_id: int, referral: schemas.ReferralCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    return crud.create_referral(db=db, referral=referral, patient_id=patient_id)


# ═══════════════════════════════════════════════════════════════════════════
#  Helpers
# ═══════════════════════════════════════════════════════════════════════════

def _esc(text: str) -> str:
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def render_pdf(html_content: str):
    result = BytesIO()
    pisa_status = pisa.CreatePDF(BytesIO(html_content.encode("UTF-8")), dest=result)
    if not pisa_status.err:
        return result.getvalue()
    return None


# ═══════════════════════════════════════════════════════════════════════════
#  A4 Template — Clear, Understandable, Grid-Based (xhtml2pdf STRICT Mode)
# ═══════════════════════════════════════════════════════════════════════════

_CSS = """
    @page {
        size: A4;
        margin: 8mm 12mm; /* Further compressed margins */
    }

    body {
        font-family: Helvetica, Arial, sans-serif;
        color: #111827;
        font-size: 9pt; /* Reduced from 10pt */
        line-height: 1.3;
    }

    /* ── HEADER ────────────────────────────────────────────── */
    .header-table {
        width: 100%;
        border-bottom: 2px solid #1f2937;
        padding-bottom: 5px;
        margin-bottom: 10px;
    }
    . clinic-name {
        font-size: 18pt; /* Reduced from 22pt */
        font-weight: bold;
        color: #111827;
        letter-spacing: 0.5px;
    }
    .contact-info {
        font-size: 8.5pt; /* Reduced */
        color: #374151;
        text-align: right;
        line-height: 1.3;
    }

    /* ── DOCUMENT TITLE ────────────────────────────────────── */
    .doc-title {
        text-align: center;
        font-size: 12pt; /* Reduced */
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: #1f2937;
        margin-bottom: 10px; /* Reduced from 20px */
        background-color: #f3f4f6;
        padding: 5px;
        border-radius: 4px;
    }

    /* ── PATIENT GRID (Boxed & Clear) ──────────────────────── */
    .pt-grid {
        width: 100%;
        margin-bottom: 15px; /* Reduced from 25px */
        border: 1px solid #d1d5db;
        border-collapse: collapse;
    }
    .pt-grid td {
        border: 1px solid #d1d5db;
        padding: 5px 8px; /* Tightened */
        vertical-align: top;
        background-color: #ffffff;
    }
    .lbl {
        font-size: 7.5pt;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 3px;
        display: block;   /* Important for xhtml2pdf spacing inside tables */
    }
    .val {
        font-size: 10.5pt;
        font-weight: bold;
        color: #111827;
    }

    /* ── SECTION BARS ──────────────────────────────────────── */
    .sec-tbl {
        width: 100%;
        margin-bottom: 3px;
        background-color: #e5e7eb;
    }
    .sec-title-td {
        padding: 4px 8px;
        font-size: 8.5pt;
        font-weight: bold;
        color: #1f2937;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .sec-body {
        padding: 4px 8px; /* Tightened */
        margin-bottom: 4px; /* Reduced from 8px */
        font-size: 9pt; /* Reduced */
        color: #111827;
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-top: none;
    }

    /* ── RX TABLE ──────────────────────────────────────────── */
    .rx-tbl {
        width: 100%;
    }
    .rx-tbl th {
        font-size: 8pt;
        color: #4b5563;
        font-weight: bold;
        text-transform: uppercase;
        padding: 5px;
        text-align: left;
        border-bottom: 2px solid #d1d5db;
    }
    .rx-tbl td {
        padding: 5px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
        font-size: 9.5pt;
    }
    .rx-num {
        font-weight: bold;
        color: #4b5563;
        text-align: center;
    }

    /* ── SIGNATURE ─────────────────────────────────────────── */
    .sig-tbl {
        width: 100%;
        margin-top: 15px; /* Reduced from 30px */
    }
    .sig-rule {
        border-bottom: 1px solid #111827;
        margin-bottom: 3px;
        width: 200px; /* Reduced from 250px */
        display: block;
    }
    .sig-name {
        font-size: 11pt;
        font-weight: bold;
        color: #111827;
    }
    .sig-role {
        font-size: 8pt;
        color: #4b5563;
        text-transform: uppercase;
    }

    /* ── FOOTER ────────────────────────────────────────────── */
    .audit {
        margin-top: 20px;
        border-top: 1px solid #e5e7eb;
        padding-top: 5px;
        text-align: center;
        font-size: 7pt;
        color: #9ca3af;
    }
"""


def get_base_html(doc_title: str, patient_block: str, body_sections: str, issued_dt: datetime, doctor_name: str = "Attending Clinician"):
    issued_date_str = issued_dt.strftime("%B %d, %Y")
    issued_time_str = issued_dt.strftime("%I:%M %p")
    ref_id = issued_dt.strftime("%Y%m%d%H%M%S")

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>{_CSS}</style>
</head>
<body>

    <!-- HEADER (Strict Table Layout) -->
    <table class="header-table" cellspacing="0" cellpadding="0">
        <tr>
            <td width="60%" valign="bottom">
                <div class="clinic-name">{CLINIC_NAME_EN}</div>
            </td>
            <td width="40%" class="contact-info" valign="bottom">
                <b>Tel:</b> {CLINIC_PHONE}<br/>
                <b>Location:</b> {CLINIC_ADDRESS}
            </td>
        </tr>
    </table>

    <!-- DOCUMENT TITLE -->
    <div class="doc-title">{doc_title}</div>

    <!-- PATIENT INFO (Grid Box) -->
    {patient_block}

    <!-- CONTENT SECTIONS -->
    {body_sections}

    <!-- SIGNATURE BLOCK -->
    <table class="sig-tbl" cellspacing="0" cellpadding="0">
        <tr>
            <td width="50%"></td>
            <td width="50%" align="center">
                <!-- Spacing for pen signature -->
                <div class="sig-rule">&nbsp;</div>
                <div class="sig-name">{doctor_name}</div>
                <div class="sig-role">Attending Dentist</div>
            </td>
        </tr>
    </table>

    <!-- FOOTER -->
    <div class="audit">
        Issued on {issued_date_str} at {issued_time_str}
        &nbsp;&bull;&nbsp; {CLINIC_NAME_EN} &nbsp;&bull;&nbsp; ID: {ref_id}
    </div>

</body>
</html>"""


def _build_patient_block(patient, doc_type: str, doc_ref: str, issued_dt: datetime) -> str:
    # A fully bordered grid (table) for absolute clarity
    return f"""
    <table class="pt-grid" cellspacing="0" cellpadding="0">
        <tr>
            <td width="40%">
                <span class="lbl">Patient Name</span>
                <span class="val">{_esc(patient.full_name)}</span>
            </td>
            <td width="25%">
                <span class="lbl">Card Number</span>
                <span class="val">{_esc(patient.card_number)}</span>
            </td>
            <td width="15%">
                <span class="lbl">Age / Sex</span>
                <span class="val">{patient.age or '-'} / {patient.sex[0].upper() if patient.sex else '-'}</span>
            </td>
            <td width="20%">
                <span class="lbl">Date</span>
                <span class="val">{issued_dt.strftime('%d %b %Y')}</span>
            </td>
        </tr>
        <tr>
            <td width="40%">
                <span class="lbl">Address</span>
                <span class="val">{_esc(patient.address or 'N/A')}</span>
            </td>
            <td width="25%">
                <span class="lbl">Phone</span>
                <span class="val">{_esc(patient.phone or 'N/A')}</span>
            </td>
            <td width="35%" colspan="2">
                <span class="lbl">Document Reference</span>
                <span class="val" style="color: #1f2937;">{doc_type} / {doc_ref}</span>
            </td>
        </tr>
    </table>
    """

def _build_section(title: str, content: str) -> str:
    """Creates a clear grey title bar over a boxed content area."""
    return f"""
    <table class="sec-tbl" cellspacing="0" cellpadding="0">
        <tr><td class="sec-title-td">{title}</td></tr>
    </table>
    <div class="sec-body">
        {content}
    </div>
    """


def _build_medications_table(medications_text: str) -> str:
    lines = [ln.strip() for ln in (medications_text or "").splitlines() if ln.strip()]
    if not lines:
        return '<i>No medications recorded.</i>'

    rows = ""
    for i, ln in enumerate(lines, 1):
        # Allow splitting by dash
        parts = [p.strip() for p in ln.split("-", 1)]
        if len(parts) == 2 and parts[0] and parts[1]:
            drug = _esc(parts[0])
            detail = _esc(parts[1])
        else:
            drug = _esc(ln)
            detail = ""

        rows += f"""
            <tr>
                <td class="rx-num" width="5%">{i}.</td>
                <td width="45%"><strong>{drug}</strong></td>
                <td width="50%">{detail}</td>
            </tr>"""

    # We do NOT use borders on the table container here because it's wrapped in `sec-body`
    return f"""
    <table class="rx-tbl" cellspacing="0" cellpadding="0">
        <tr>
            <th width="5%" align="center">#</th>
            <th width="45%">Drug Name / Strength / Form</th>
            <th width="50%">Dose / Frequency / Duration</th>
        </tr>
        {rows}
    </table>
    """


# ═══════════════════════════════════════════════════════════════════════════
#  PDF Endpoints
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/prescriptions/{prescription_id}/pdf")
def get_prescription_pdf(prescription_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    presc = db.query(models.Prescription).filter(models.Prescription.id == prescription_id).first()
    if not presc:
        raise HTTPException(status_code=404, detail="Prescription not found")

    patient = presc.patient
    local_issued = presc.date_issued
    patient_block = _build_patient_block(patient, "Prescription", f"RX-{presc.id}", local_issued)

    rx_content = _build_medications_table(presc.medications)
    ins_content = _esc(presc.instructions or 'Take medications as directed by the prescribing dentist.')
    
    body = _build_section("Prescription & Medications", rx_content) + _build_section("Instructions & Advice", ins_content)

    doctor_display = current_user.full_name or current_user.username
    pdf = render_pdf(get_base_html("Drug Prescription", patient_block, body, local_issued, doctor_name=doctor_display))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")


@router.get("/sick-leaves/{sick_leave_id}/pdf")
def get_sick_leave_pdf(sick_leave_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    sl = db.query(models.SickLeave).filter(models.SickLeave.id == sick_leave_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="Sick Leave not found")

    patient = sl.patient
    local_issued = sl.date_issued
    days = (sl.end_date - sl.start_date).days + 1
    patient_block = _build_patient_block(patient, "Sick Leave", f"SL-{sl.id}", local_issued)

    cert_content = f"""
        To whom it may concern,<br/><br/>
        This is to certify that <b>{_esc(patient.full_name)}</b>
        (Card No. <b>{_esc(patient.card_number)}</b>) is currently
        under professional dental care at <b>{CLINIC_NAME_EN}</b>.<br/><br/>
        Due to <b>{_esc(sl.diagnosis)}</b>, the patient is medically
        advised to rest and recover from
        <b>{sl.start_date.strftime('%d %B %Y')}</b> to
        <b>{sl.end_date.strftime('%d %B %Y')}</b>,
        inclusive of <b>{days}</b> day(s).
    """
    
    diag_content = _esc(sl.diagnosis)
    
    period_content = f"""
        <b>{sl.start_date.strftime('%d %B %Y')}</b>
        &nbsp;&mdash;&nbsp;
        <b>{sl.end_date.strftime('%d %B %Y')}</b>
        &nbsp;&nbsp;({days} day/s total)
    """
    
    rec_content = _esc(sl.recommendations or 'Bed rest, hydration, and adherence to prescribed medications.')

    body = (
        _build_section("Medical Certification", cert_content) +
        _build_section("Primary Diagnosis", diag_content) +
        _build_section("Recommended Leave Period", period_content) +
        _build_section("General Recommendations", rec_content)
    )

    doctor_display = current_user.full_name or current_user.username
    pdf = render_pdf(get_base_html("Medical Sick Leave Certificate", patient_block, body, local_issued, doctor_name=doctor_display))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")


@router.get("/referrals/{referral_id}/pdf")
def get_referral_pdf(referral_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    ref = db.query(models.Referral).filter(models.Referral.id == referral_id).first()
    if not ref:
        raise HTTPException(status_code=404, detail="Referral not found")

    patient = ref.patient
    local_issued = ref.date_issued
    patient_block = _build_patient_block(patient, "Referral", f"REF-{ref.id}", local_issued)

    ref_content = f'<b>{_esc(ref.referred_to)}</b>'
    reason_content = _esc(ref.reason)
    summary_content = _esc(ref.clinical_summary or 'Clinical records attached for your review.')

    body = (
        _build_section("Referred To (Facility / Specialist)", ref_content) +
        _build_section("Reason for Referral", reason_content) +
        _build_section("Clinical Summary", summary_content)
    )

    doctor_display = current_user.full_name or current_user.username
    pdf = render_pdf(get_base_html("Patient Referral Form", patient_block, body, local_issued, doctor_name=doctor_display))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")


@router.get("/patients/{patient_id}/consent-form/pdf")
def get_consent_form_pdf(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    patient = crud.get_patient(db, patient_id=patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    local_issued = models.get_local_time_eat()
    patient_block = _build_patient_block(patient, "Consent", "CONSENT", local_issued)

    consent_content = """
    <div style="font-size: 11pt; line-height: 1.6;">
        <p>I understand that the extraction of a tooth (teeth) has been recommended by my dentist. 
        I have had any alternative treatment (if any) explained to me, as well as the consequences of doing nothing about my dental conditions. 
        I understand that non-treatment may result in, but not be limited to: infection, swelling, pain, periodontal disease, malocclusion (damage to the way the teeth hit together) and systemic disease/infection.</p>
        
        <p>I understand that there are risks associated with any dental, surgical, and anesthetic procedure. These include, but are not limited to:</p>
        <ul style="margin-left: 20px;">
            <li>Post-operative infection or inflammation</li>
            <li>Swelling, bruising, and pain</li>
            <li>Damage to adjacent teeth or fillings</li>
            <li>Drug reactions and side effects</li>
            <li>Bleeding requiring more treatment</li>
            <li>Possibility of a small fragment of root or bone being left in the jaw intentionally when its removal is not appropriate</li>
            <li>Delayed healing (dry socket) necessitating several post-operative visits</li>
            <li>Damage to sinuses requiring additional treatment or surgical repair at a later date</li>
            <li>Fracture or dislocation of the jaw</li>
            <li>Damage to the nerves during tooth removal resulting in temporary, or possibly partial or permanent numbness or tingling of the lip, chin, tongue, or other areas</li>
        </ul>

        <p>By providing my signature, I certify that I understand the recommended treatment, the fee involved, the risks of such treatment, any alternatives and risks of these alternatives, including the consequences of doing nothing. I have had all of my questions answered, and have not been offered any guarantees.</p>

        <table style="width: 100%; margin-top: 30px;">
            <tr>
                <td style="width: 50%;">Patient name: ________________________</td>
                <td style="width: 50%;">Legal guardian name: ____________________</td>
            </tr>
            <tr>
                <td style="width: 50%; padding-top: 20px;">Signature: __________________________</td>
                <td style="width: 50%; padding-top: 20px;">Date: ______________________________</td>
            </tr>
        </table>
    </div>
    """

    body = _build_section("TOOTH REMOVAL CONSENT FORM", consent_content)

    doctor_display = current_user.full_name or current_user.username
    pdf = render_pdf(get_base_html("Dental Consent Form", patient_block, body, local_issued, doctor_name=doctor_display))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")


@router.get("/patients/{patient_id}/orthodontic-consent/pdf")
def get_orthodontic_consent_pdf(patient_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    """Generate professional 1-page PDF for Orthodontic Treatment Consent form."""
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    local_issued = models.get_local_time_eat()
    patient_block = _build_patient_block(patient, "Consent", "CONSENT", local_issued)

    consent_content = """
    <div style="font-size: 9pt; line-height: 1.3;">
        <p style="margin: 0 0 6px 0;">I understand that orthodontic treatment involves risks and commitments. By proceeding, I acknowledge and accept the following:</p>
        
        <ul style="margin: 0 0 8px 15px; padding: 0;">
            <li style="margin-bottom: 3px;"><b>Oral Hygiene:</b> Excellent brushing/flossing is mandatory. Poor hygiene may cause decalcification, decay, and gum disease.</li>
            <li style="margin-bottom: 3px;"><b>Appointments &amp; Cooperation:</b> All scheduled adjustments must be attended. Elastics/headgear must be worn as prescribed. Non-compliance extends treatment time.</li>
            <li style="margin-bottom: 3px;"><b>Biological Risks:</b> Root resorption may occur. TMJ issues may persist or worsen during/after treatment.</li>
            <li style="margin-bottom: 3px;"><b>Duration:</b> Treatment time is an estimate only. Missed appointments or complications may extend treatment.</li>
            <li style="margin-bottom: 3px;"><b>Retention:</b> Teeth tend to relapse. Lifetime retainer wear is required to maintain results.</li>
        </ul>

        <p style="margin: 8px 0;"><b>By signing, I confirm I understand the treatment plan, risks, limitations, and fees. All questions have been answered. No guarantees have been offered.</b></p>

        <table style="width: 100%; margin-top: 10px;">
            <tr>
                <td style="width: 50%;">Patient name: ________________________</td>
                <td style="width: 50%;">Legal guardian name: ____________________</td>
            </tr>
            <tr>
                <td style="width: 50%; padding-top: 8px;">Signature: __________________________</td>
                <td style="width: 50%; padding-top: 8px;">Date: ______________________________</td>
            </tr>
        </table>
    </div>
    """

    body = _build_section("ORTHODONTIC TREATMENT CONSENT", consent_content)

    doctor_display = current_user.full_name or current_user.username
    pdf = render_pdf(get_base_html("Orthodontic Consent Form", patient_block, body, local_issued, doctor_name=doctor_display))
    if pdf:
        return Response(content=pdf, media_type="application/pdf")
    raise HTTPException(status_code=500, detail="PDF generation failed")
