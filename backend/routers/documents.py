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
CLINIC_PHONE = "0911828262"
CLINIC_ADDRESS = "Bole Mikael, Addis Ababa"
DOCTOR_NAME = "Dr. Dawit Ayalew"
DOCTOR_LICENSE = "2026/AA/PROF/24321"


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

@router.post("/patients/{patient_id}/medical-certificates", response_model=schemas.MedicalCertificateRead)
def create_medical_certificate(patient_id: int, mc: schemas.MedicalCertificateCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    doctor_display = current_user.full_name or DOCTOR_NAME
    return crud.create_medical_certificate(db=db, mc=mc, patient_id=patient_id, doctor_name=doctor_display, license_no=DOCTOR_LICENSE)

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
    .clinic-name {
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
        color: #1f2937;
        font-weight: bold;
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


# ═══════════════════════════════════════════════════════════════════════════
#  Formal Medical Certificate Template Generator
# ═══════════════════════════════════════════════════════════════════════════

def _build_medical_certificate_html(mc: models.MedicalCertificate, patient: models.Patient, current_user: models.User) -> str:
    import json
    from datetime import datetime as dt

    cert_no = f"HDC-MC-{mc.date_issued.strftime('%Y%m')}-{mc.id:04d}"
    date_issued_str = mc.date_issued.strftime("%d %B %Y")
    patient_name = _esc(patient.full_name)
    age_str = str(patient.age) if patient.age is not None else "-"
    sex_str = patient.sex if patient.sex else "-"
    age_sex = f"{age_str} / {sex_str}"
    patient_id = _esc(patient.card_number) if patient.card_number else f"HDC-{patient.id:04d}"
    date_examined_str = mc.date_examined.strftime("%d %B %Y") if mc.date_examined else date_issued_str

    # Process leave dates (date range, specific days, or days count)
    specific_dates_list = None
    if mc.specific_dates:
        try:
            specific_dates_list = json.loads(mc.specific_dates)
        except (json.JSONDecodeError, TypeError):
            specific_dates_list = None

    if specific_dates_list and len(specific_dates_list) > 0:
        days_count = len(specific_dates_list)
        formatted_specific = []
        for d_str in specific_dates_list:
            try:
                d = dt.strptime(d_str, "%Y-%m-%d")
                formatted_specific.append(d.strftime("%d %b %Y"))
            except ValueError:
                formatted_specific.append(_esc(d_str))
        
        rest_days_str = f"{days_count} day(s)"
        if days_count == 1:
            from_to_str = f"{formatted_specific[0]} (1 specific day)"
        elif mc.start_date and mc.end_date:
            from_to_str = f"{mc.start_date.strftime('%d %B %Y')} to {mc.end_date.strftime('%d %B %Y')} (Specific days: {', '.join(formatted_specific)})"
        else:
            from_to_str = f"Specific days: {', '.join(formatted_specific)}"
    elif mc.start_date and mc.end_date:
        days_count = mc.recommended_rest_days if mc.recommended_rest_days is not None else ((mc.end_date - mc.start_date).days + 1)
        rest_days_str = f"{days_count} day(s)"
        from_to_str = f"{mc.start_date.strftime('%d %B %Y')} to {mc.end_date.strftime('%d %B %Y')}"
    elif mc.recommended_rest_days:
        rest_days_str = f"{mc.recommended_rest_days} day(s)"
        from_to_str = "As clinically recommended"
    else:
        rest_days_str = "Fit for normal duties / No leave required"
        from_to_str = "N/A"

    diagnosis_str = _esc(mc.diagnosis or "Clinical examination & dental procedure")
    remarks_str = _esc(mc.remarks or "Adhere to prescribed medications, maintain oral hygiene, and return for clinical review if symptoms persist.")
    doctor_name = mc.doctor_name or current_user.full_name or DOCTOR_NAME
    license_no = mc.license_no or DOCTOR_LICENSE

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
    @page {{
        size: A4 portrait;
        margin: 12mm 16mm 10mm 16mm;
    }}

    body {{
        font-family: Helvetica, Arial, sans-serif;
        color: #000000;
        font-size: 10pt;
        line-height: 1.4;
        font-weight: 600;
    }}

    /* ── CLINIC HEADER ─────────────────────────────────────── */
    .header-box {{
        text-align: center;
        margin-bottom: 10pt;
    }}
    .clinic-name {{
        font-size: 17pt;
        font-weight: 900;
        color: #000000;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-bottom: 2pt;
    }}
    .clinic-contact {{
        font-size: 9.5pt;
        color: #000000;
        font-weight: 600;
    }}

    /* ── DOCUMENT TITLE ────────────────────────────────────── */
    .doc-title {{
        text-align: center;
        font-size: 14pt;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #000000;
        margin-bottom: 10pt;
    }}

    /* ── FORMAL GRID TABLES ────────────────────────────────── */
    .cert-table {{
        width: 100%;
        border-collapse: collapse;
        border: 1.25pt solid #000000;
        margin-bottom: 1pt;
    }}
    .cert-table td {{
        border: 1pt solid #333333;
        padding: 5pt 8pt;
        vertical-align: middle;
        font-size: 10pt;
    }}
    .lbl-col {{
        width: 38%;
        color: #000000;
        font-weight: 700;
    }}
    .val-col {{
        width: 62%;
        color: #000000;
        font-weight: 900;
    }}

    /* ── INTERMEDIATE TEXT LABELS ──────────────────────────── */
    .sec-label {{
        font-size: 10pt;
        color: #000000;
        margin-top: 6pt;
        margin-bottom: 2.5pt;
        font-weight: 700;
    }}

    /* ── BOXED TEXT AREAS (Diagnosis, Remarks) ─────────────── */
    .boxed-area {{
        width: 100%;
        border-collapse: collapse;
        border: 1.25pt solid #000000;
        margin-bottom: 1pt;
    }}
    .boxed-area td {{
        border: 1pt solid #333333;
        padding: 6pt 8pt;
        min-height: 22pt;
        font-size: 10pt;
        vertical-align: top;
        color: #000000;
        font-weight: 700;
    }}

    /* ── SIGN-OFF TABLE ────────────────────────────────────── */
    .sign-table {{
        width: 100%;
        border-collapse: collapse;
        border: 1.25pt solid #000000;
        margin-top: 8pt;
        margin-bottom: 1pt;
    }}
    .sign-table td {{
        border: 1pt solid #333333;
        padding: 5pt 8pt;
        vertical-align: middle;
        font-size: 10pt;
        font-weight: 700;
    }}

    /* ── FOOTER NOTE ───────────────────────────────────────── */
    .footer-note {{
        text-align: center;
        font-size: 8.5pt;
        color: #000000;
        font-style: italic;
        margin-top: 8pt;
        font-weight: 600;
    }}
</style>
</head>
<body>

    <!-- CLINIC HEADER -->
    <div class="header-box">
        <div class="clinic-name">{CLINIC_NAME_EN}</div>
        <div class="clinic-contact">{CLINIC_ADDRESS} &nbsp;|&nbsp; Tel: {CLINIC_PHONE}</div>
    </div>

    <!-- DOCUMENT TITLE -->
    <div class="doc-title">MEDICAL CERTIFICATE</div>

    <!-- CERTIFICATE DETAILS -->
    <table class="cert-table" cellspacing="0" cellpadding="0">
        <tr>
            <td class="lbl-col">Certificate No.:</td>
            <td class="val-col">{cert_no}</td>
        </tr>
        <tr>
            <td class="lbl-col">Date Issued:</td>
            <td class="val-col">{date_issued_str}</td>
        </tr>
    </table>

    <!-- PATIENT INTRO -->
    <div class="sec-label">This is to certify that:</div>

    <!-- PATIENT DETAILS -->
    <table class="cert-table" cellspacing="0" cellpadding="0">
        <tr>
            <td class="lbl-col">Patient Name:</td>
            <td class="val-col">{patient_name}</td>
        </tr>
        <tr>
            <td class="lbl-col">Age / Sex:</td>
            <td class="val-col">{age_sex}</td>
        </tr>
        <tr>
            <td class="lbl-col">Patient ID:</td>
            <td class="val-col">{patient_id}</td>
        </tr>
        <tr>
            <td class="lbl-col">Date Examined:</td>
            <td class="val-col">{date_examined_str}</td>
        </tr>
    </table>

    <!-- DIAGNOSIS LABEL -->
    <div class="sec-label">was examined at Hani Dental Clinic and was diagnosed with / treated for:</div>

    <!-- DIAGNOSIS BOX -->
    <table class="boxed-area" cellspacing="0" cellpadding="0">
        <tr>
            <td>
                <b>{diagnosis_str.replace(chr(10), '<br/>')}</b>
            </td>
        </tr>
    </table>

    <!-- RECOMMENDATION LABEL -->
    <div class="sec-label">Medical recommendation:</div>

    <!-- RECOMMENDATION TABLE -->
    <table class="cert-table" cellspacing="0" cellpadding="0">
        <tr>
            <td class="lbl-col">Recommended rest / leave:</td>
            <td class="val-col">{rest_days_str}</td>
        </tr>
        <tr>
            <td class="lbl-col">From / To:</td>
            <td class="val-col">{from_to_str}</td>
        </tr>
    </table>

    <!-- REMARKS LABEL -->
    <div class="sec-label">Additional remarks:</div>

    <!-- REMARKS BOX -->
    <table class="boxed-area" cellspacing="0" cellpadding="0">
        <tr>
            <td>
                {remarks_str.replace(chr(10), '<br/>')}
            </td>
        </tr>
    </table>

    <!-- DOCTOR / DENTIST SIGN-OFF -->
    <table class="sign-table" cellspacing="0" cellpadding="0">
        <tr>
            <td class="lbl-col">Doctor / Dentist:</td>
            <td class="val-col">{doctor_name}</td>
        </tr>
        <tr>
            <td class="lbl-col">Professional License No.:</td>
            <td class="val-col">{license_no}</td>
        </tr>
        <tr>
            <td class="lbl-col">Signature:</td>
            <td class="val-col">________________________________________</td>
        </tr>
        <tr>
            <td class="lbl-col">Clinic Stamp:</td>
            <td class="val-col">________________________________________</td>
        </tr>
    </table>

    <!-- FOOTER NOTE -->
    <div class="footer-note">
        This certificate is issued based on the clinical examination and findings recorded at Hani Dental Clinic.
    </div>

</body>
</html>"""


@router.get("/medical-certificates/{mc_id}/pdf")
def get_medical_certificate_pdf(mc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_active_user)):
    mc = db.query(models.MedicalCertificate).filter(models.MedicalCertificate.id == mc_id).first()
    if not mc:
        raise HTTPException(status_code=404, detail="Medical Certificate not found")

    patient = mc.patient
    html_content = _build_medical_certificate_html(mc, patient, current_user)
    pdf = render_pdf(html_content)
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
    patient_block = _build_patient_block(patient, "Sick Leave", f"SL-{sl.id}", local_issued)

    # Determine if this is a specific-dates or date-range sick leave
    specific_dates_list = None
    if sl.specific_dates:
        import json
        try:
            specific_dates_list = json.loads(sl.specific_dates)
        except (json.JSONDecodeError, TypeError):
            specific_dates_list = None

    if specific_dates_list and len(specific_dates_list) > 0:
        from datetime import datetime as dt
        days = len(specific_dates_list)
        formatted_dates = []
        for d_str in specific_dates_list:
            try:
                d = dt.strptime(d_str, "%Y-%m-%d")
                formatted_dates.append(f"<b>{d.strftime('%d %B %Y')}</b>")
            except ValueError:
                formatted_dates.append(f"<b>{_esc(d_str)}</b>")

        if len(formatted_dates) == 1:
            dates_text = formatted_dates[0]
        elif len(formatted_dates) == 2:
            dates_text = f"{formatted_dates[0]} and {formatted_dates[1]}"
        else:
            dates_text = ", ".join(formatted_dates[:-1]) + f", and {formatted_dates[-1]}"

        cert_content = f"""
            To whom it may concern,<br/><br/>
            This is to certify that <b>{_esc(patient.full_name)}</b>
            (Card No. <b>{_esc(patient.card_number)}</b>) is currently
            under professional dental care at <b>{CLINIC_NAME_EN}</b>.<br/><br/>
            Due to <b>{_esc(sl.diagnosis)}</b>, the patient is medically
            advised to rest on the following date(s):
            {dates_text},
            totalling <b>{days}</b> day(s).
        """

        dates_list_html = "<br/>".join(
            f"&bull;&nbsp;&nbsp;{fd}" for fd in formatted_dates
        )
        period_content = f"""
            {dates_list_html}
            <br/><br/>
            <b>{days}</b> day(s) total
        """
    else:
        days = (sl.end_date - sl.start_date).days + 1

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

        period_content = f"""
            <b>{sl.start_date.strftime('%d %B %Y')}</b>
            &nbsp;&mdash;&nbsp;
            <b>{sl.end_date.strftime('%d %B %Y')}</b>
            &nbsp;&nbsp;({days} day/s total)
        """
    
    diag_content = _esc(sl.diagnosis)
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
    <div style="font-size: 8.5pt; line-height: 1.25;">
        <p style="margin-bottom: 8px;">I understand that the extraction of a tooth (teeth) has been recommended by my dentist. 
        I have had any alternative treatment (if any) explained to me, as well as the consequences of doing nothing about my dental conditions. 
        I understand that non-treatment may result in, but not be limited to: infection, swelling, pain, periodontal disease, malocclusion (damage to the way the teeth hit together) and systemic disease/infection.</p>
        
        <p style="margin-bottom: 8px;">I understand that there are risks associated with any dental, surgical, and anesthetic procedure. <b>These risks include, but are not limited to:</b> post-operative infection or inflammation; swelling, bruising, and pain; damage to adjacent teeth or fillings; drug reactions and side effects; bleeding requiring more treatment; possibility of a small fragment of root or bone being left in the jaw intentionally when its removal is not appropriate; delayed healing (dry socket) necessitating several post-operative visits; damage to sinuses requiring additional treatment or surgical repair at a later date; fracture or dislocation of the jaw; and damage to the nerves during tooth removal resulting in temporary, or possibly partial or permanent numbness or tingling of the lip, chin, tongue, or other areas.</p>

        <p style="margin-bottom: 8px;">By providing my signature, I certify that I understand the recommended treatment, the fee involved, the risks of such treatment, any alternatives and risks of these alternatives, including the consequences of doing nothing. I have had all of my questions answered, and have not been offered any guarantees.</p>

        <table style="width: 100%; margin-top: 10px;">
            <tr>
                <td style="width: 50%;">Patient name: ________________________</td>
                <td style="width: 50%;">Legal guardian name: ____________________</td>
            </tr>
            <tr>
                <td style="width: 50%; padding-top: 15px;">Signature: __________________________</td>
                <td style="width: 50%; padding-top: 15px;">Date: ______________________________</td>
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
    <div style="font-size: 10.5pt; line-height: 1.6;">
        <p style="margin: 0 0 10px 0;">I understand that orthodontic treatment involves risks and commitments. By proceeding, I acknowledge and accept the following:</p>
        
        <ul style="margin: 0 0 15px 20px; padding: 0;">
            <li style="margin-bottom: 6px;"><b>Oral Hygiene:</b> Excellent brushing/flossing is mandatory. Poor hygiene may cause decalcification, decay, and gum disease.</li>
            <li style="margin-bottom: 6px;"><b>Appointments &amp; Cooperation:</b> All scheduled adjustments must be attended. Elastics/headgear must be worn as prescribed. Non-compliance extends treatment time.</li>
            <li style="margin-bottom: 6px;"><b>Biological Risks:</b> Root resorption may occur. TMJ issues may persist or worsen during/after treatment.</li>
            <li style="margin-bottom: 6px;"><b>Duration:</b> Treatment time is an estimate only. Missed appointments or complications may extend treatment.</li>
            <li style="margin-bottom: 6px;"><b>Retention:</b> Teeth tend to relapse. Lifetime retainer wear is required to maintain results.</li>
        </ul>

        <p style="margin: 15px 0;"><b>By signing, I confirm I understand the treatment plan, risks, limitations, and fees. All questions have been answered. No guarantees have been offered.</b></p>

        <table style="width: 100%; margin-top: 40px;">
            <tr>
                <td style="width: 50%;">Patient name: ________________________</td>
                <td style="width: 50%;">Legal guardian name: ____________________</td>
            </tr>
            <tr>
                <td style="width: 50%; padding-top: 25px;">Signature: __________________________</td>
                <td style="width: 50%; padding-top: 25px;">Date: ______________________________</td>
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
