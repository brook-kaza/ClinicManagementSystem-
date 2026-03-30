from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
from database import get_db
from auth import get_current_active_user, RoleChecker

router = APIRouter(
    prefix="/billing",
    tags=["billing"]
)

authorized_staff = RoleChecker(["Admin", "Receptionist", "Dentist"])

@router.get("/patients/{patient_id}/invoices", response_model=List[schemas.InvoiceRead])
def read_patient_invoices(
    patient_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all invoices and their payments for a specific patient."""
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return crud.get_patient_invoices(db, patient_id=patient_id)

@router.delete("/invoices/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RoleChecker(["Admin"]))
):
    """Admin-only: Delete an invoice and all its associated payments."""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice and associated payments deleted successfully"}

@router.delete("/payments/{payment_id}")
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(RoleChecker(["Admin"]))
):
    """Admin-only: Delete a single payment record."""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    db.delete(payment)
    db.commit()
    return {"message": "Payment record deleted successfully"}

@router.post("/patients/{patient_id}/invoices", response_model=schemas.InvoiceRead, status_code=201)
def create_patient_invoice(
    patient_id: int, 
    invoice: schemas.InvoiceCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(authorized_staff)
):
    """Create a new invoice for a patient's treatment."""
    db_patient = crud.get_patient(db, patient_id=patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    return crud.create_invoice(db=db, invoice=invoice, patient_id=patient_id)

@router.post("/invoices/{invoice_id}/payments", response_model=schemas.PaymentRead, status_code=201)
def record_payment(
    invoice_id: int, 
    payment: schemas.PaymentCreate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(authorized_staff)
):
    """Record a payment installment against a specific invoice."""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Prevent overpayment intuitively, but don't strictly block it if they want to leave a credit (complex)
    # Most basic guard: 
    total_paid = sum(p.amount_paid for p in invoice.payments)
    balance_due = invoice.total_amount - total_paid
    
    if balance_due <= 0:
         raise HTTPException(status_code=400, detail="This invoice is already fully paid.")
         
    if payment.amount_paid > balance_due:
        raise HTTPException(
            status_code=400, 
            detail=f"Payment amount exceeds balance due ({balance_due} ETB)."
        )
         
    return crud.create_payment(db=db, payment=payment, invoice_id=invoice_id, username=current_user.username)


from fastapi.responses import Response
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from datetime import datetime

def number_to_words(n):
    if n == 0: return "ZERO"
    ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"]
    tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"]
    
    def convert_less_than_1000(num):
        words = ""
        if num >= 100:
            words += ones[num // 100] + " HUNDRED "
            num %= 100
        if num >= 20:
            words += tens[num // 10] + " "
            num %= 10
        if num > 0:
            words += ones[num] + " "
        return words.strip()

    result = ""
    if n >= 1000000:
        result += convert_less_than_1000(n // 1000000) + " MILLION "
        n %= 1000000
    if n >= 1000:
        result += convert_less_than_1000(n // 1000) + " THOUSAND "
        n %= 1000
    if n > 0:
        result += convert_less_than_1000(n)
        
    return result.strip() if result else "ZERO"

@router.get("/payments/{payment_id}/receipt")
def generate_payment_receipt(
    payment_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Generate a PDF Cash Sales Attachment receipt for a specific payment, matching the official clinic layout."""
    from sqlalchemy.orm import joinedload as jl
    payment = db.query(models.Payment).options(
        jl(models.Payment.invoice).joinedload(models.Invoice.items),
        jl(models.Payment.invoice).joinedload(models.Invoice.patient)
    ).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    invoice = payment.invoice
    patient = invoice.patient

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # 1. Header (Clinic Information)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(40, height - 50, "Hani Dental Clinic")
    
    p.setFont("Helvetica", 10)
    p.drawString(40, height - 70, "TIN: 0064642396")
    p.drawString(40, height - 85, "Tel: 0911828262        Fax:")
    p.drawString(40, height - 100, "Bole Mikael, Woreda 01, House No: New")
    p.drawString(40, height - 115, "Addis Ababa")
    p.drawString(40, height - 130, "Ethiopia")
    
    # Horizontal Line
    p.setStrokeColor(colors.HexColor('#6cb4ee'))
    p.setLineWidth(2)
    p.line(40, height - 145, width - 40, height - 145)

    # 2. Document Title
    p.setFont("Times-Bold", 16)
    p.drawCentredString(width / 2.0, height - 170, "Cash Sales Attachment")

    # 3. Patient & Transaction Details (Two Columns)
    y_blocks = height - 200
    
    # Left Block (Bill To)
    left_data = [
        ["Bill to", patient.full_name.upper()],
        ["TIN", patient.tin_number if patient.tin_number else "Not Provided"],
        ["Address", patient.address.upper() if patient.address else "ADDIS ABABA"],
        ["A/C Number", ""]
    ]
    t_left = Table(left_data, colWidths=[80, 180], rowHeights=20)
    t_left.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1,0), (1,-1), colors.darkgray),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke)
    ]))
    t_left.wrapOn(p, width, height)
    t_left.drawOn(p, 40, y_blocks - 60)

    # Right Block (Meta Info)
    from datetime import timedelta as td
    eat_date = payment.payment_date + td(hours=3)
    date_str = eat_date.strftime("%d/%m/%Y")
    right_data = [
        ["Date", date_str],
        ["Reference", str(payment.id).zfill(6)],
        ["FSNO", str(invoice.id).zfill(8)],
        ["Station", "Reception"],
        ["Store", "-"]
    ]
    t_right = Table(right_data, colWidths=[70, 130], rowHeights=16)
    t_right.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke)
    ]))
    t_right.wrapOn(p, width, height)
    t_right.drawOn(p, width - 240, y_blocks - 60)

    # 4. Service Breakdown Grid — use line items if available
    y_grid = y_blocks - 130
    grid_data = [
        ["ID", "Description", "Unit", "Qty", "Unit Price", "Line Total"],
    ]
    
    if invoice.items and len(invoice.items) > 0:
        # Multi-treatment invoice with line items
        for idx, item in enumerate(invoice.items, 1):
            grid_data.append([
                f"{idx}.",
                item.description.upper(),
                "Service",
                str(item.quantity),
                str(int(item.unit_price)),
                str(int(item.line_total))
            ])
    else:
        # Legacy single-description invoice (backward compat)
        grid_data.append([
            "1.",
            invoice.description.upper(),
            "Service",
            "1",
            str(int(invoice.total_amount)),
            str(int(invoice.total_amount))
        ])
    
    # Calculate column widths to fit nicely
    t_grid = Table(grid_data, colWidths=[30, 200, 60, 40, 80, 80], rowHeights=20)
    t_grid.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('BACKGROUND', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('ALIGN', (2,1), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE')
    ]))
    t_grid.wrapOn(p, width, height)
    # Adjust y_grid down if we have many items
    grid_height = len(grid_data) * 20
    t_grid.drawOn(p, 40, y_grid - grid_height + 20)

    # 5. Financial Summary & Footer
    y_footer = y_grid - grid_height - 40
    
    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, y_footer, "Payment Method:")
    p.setFont("Helvetica", 10)
    p.drawString(140, y_footer, f"_{payment.payment_method.capitalize()}_")
    
    p.setFont("Helvetica-Bold", 10)
    p.drawString(40, y_footer - 25, "Amount in Words:")
    
    try:
        words = number_to_words(int(payment.amount_paid)) + " BIRR"
    except:
        words = str(payment.amount_paid) + " BIRR"
        
    p.setFont("Helvetica", 10)
    p.drawString(140, y_footer - 25, f"_{words}_")

    # Right Side Totals Box
    totals_data = [
        ["Subtotal", str(int(invoice.total_amount))],
        ["VAT", "-"],
        ["Grand Total", str(int(invoice.total_amount))],
        ["Amount Paid", str(int(payment.amount_paid))]
    ]
    t_totals = Table(totals_data, colWidths=[100, 100], rowHeights=20)
    t_totals.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke)
    ]))
    t_totals.wrapOn(p, width, height)
    t_totals.drawOn(p, width - 240, y_footer - 60)

    # Signature
    p.setFont("Helvetica", 9)
    prepared_name = current_user.full_name or current_user.username.capitalize()
    p.drawString(40, 50, f"Prepared by: {prepared_name}")

    # Watermark overlay
    p.saveState()
    try:
        p.setFillAlpha(0.25)
    except Exception:
        pass
    p.setFont("Helvetica-Bold", 110)
    p.setFillGray(0.5)
    p.translate(width/2, height/2 - 20)
    p.rotate(45)
    p.drawCentredString(0, 0, "Attachment")
    p.restoreState()

    p.showPage()
    p.save()

    pdf_out = buffer.getvalue()
    buffer.close()

    return Response(content=pdf_out, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=receipt_{payment.id}.pdf"})
