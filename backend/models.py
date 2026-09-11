from typing import List, Optional
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone, timedelta
from database import Base

EAT_TZ = timezone(timedelta(hours=3))

def get_local_time_eat():
    # Legacy name kept for compatibility, but now strictly returns UTC naive time for robust DB storage
    return datetime.now(timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(150), default=None)
    hashed_password: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(50), default="Receptionist") # Admin, Dentist, Receptionist
    is_active: Mapped[bool] = mapped_column(default=True)
    license_no: Mapped[Optional[str]] = mapped_column(String(100), default=None)

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    card_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    age: Mapped[Optional[int]] = mapped_column()
    sex: Mapped[Optional[str]] = mapped_column(String(10))
    address: Mapped[Optional[str]] = mapped_column(String(250))
    tin_number: Mapped[Optional[str]] = mapped_column(String(50))
    medical_alerts: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    
    # Global Consent
    consent_given: Mapped[bool] = mapped_column(default=False)
    consent_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    consent_by: Mapped[Optional[str]] = mapped_column(String(150))

    teeth: Mapped[List["ToothStatus"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    visits: Mapped[List["Visit"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    prescriptions: Mapped[List["Prescription"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    sick_leaves: Mapped[List["SickLeave"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    medical_certificates: Mapped[List["MedicalCertificate"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    referrals: Mapped[List["Referral"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    invoices: Mapped[List["Invoice"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    appointments: Mapped[List["Appointment"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class ToothStatus(Base):
    __tablename__ = "tooth_statuses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    tooth_number: Mapped[int] = mapped_column()  # 1-32
    condition: Mapped[str] = mapped_column(String(100))  # e.g., "Caries", "Bridge"

    patient: Mapped["Patient"] = relationship(back_populates="teeth")

class Visit(Base):
    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    visit_date: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    chief_complaint: Mapped[Optional[str]] = mapped_column(String(500))
    doctors_notes: Mapped[Optional[str]] = mapped_column(Text)
    primary_diagnosis: Mapped[Optional[str]] = mapped_column(String(100))
    
    # Vital Signs
    blood_pressure: Mapped[Optional[str]] = mapped_column(String(20))
    heart_rate: Mapped[Optional[int]] = mapped_column()
    respiratory_rate: Mapped[Optional[int]] = mapped_column()
    temperature: Mapped[Optional[float]] = mapped_column()
    
    # X-Ray (legacy single-image field — kept for backward compatibility)
    xray_url: Mapped[Optional[str]] = mapped_column(String(500))
    
    # Per-Visit Consent
    visit_consent: Mapped[bool] = mapped_column(default=False)
    visit_consent_time: Mapped[Optional[datetime]] = mapped_column(DateTime)

    patient: Mapped["Patient"] = relationship(back_populates="visits")
    doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[doctor_id])
    xray_images: Mapped[List["XrayImage"]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", order_by="XrayImage.uploaded_at"
    )

class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    medications: Mapped[str] = mapped_column(Text)  # JSON string of medications
    instructions: Mapped[Optional[str]] = mapped_column(Text)
    
    patient: Mapped["Patient"] = relationship(back_populates="prescriptions")
    doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[doctor_id])

class SickLeave(Base):
    __tablename__ = "sick_leaves"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    diagnosis: Mapped[str] = mapped_column(String(500))
    recommendations: Mapped[Optional[str]] = mapped_column(Text)
    specific_dates: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of "YYYY-MM-DD" strings for non-consecutive days

    patient: Mapped["Patient"] = relationship(back_populates="sick_leaves")
    doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[doctor_id])

class MedicalCertificate(Base):
    __tablename__ = "medical_certificates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    date_examined: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    diagnosis: Mapped[str] = mapped_column(String(500))  # Diagnosis / Treatment
    recommended_rest_days: Mapped[Optional[int]] = mapped_column(nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    specific_dates: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of "YYYY-MM-DD"
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    doctor_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    license_no: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="medical_certificates")
    doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[doctor_id])

class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    referred_to: Mapped[str] = mapped_column(String(200)) # Clinic or Doctor name
    reason: Mapped[str] = mapped_column(Text)
    clinical_summary: Mapped[Optional[str]] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="referrals")
    doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[doctor_id])

class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    description: Mapped[str] = mapped_column(String(255))
    total_amount: Mapped[float] = mapped_column()
    status: Mapped[str] = mapped_column(String(20), default="Unpaid") # Unpaid, Partially Paid, Paid
    
    patient: Mapped["Patient"] = relationship("Patient", back_populates="invoices")
    doctor: Mapped[Optional["User"]] = relationship("User", foreign_keys=[doctor_id])
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")
    items: Mapped[List["InvoiceItem"]] = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"))
    description: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[int] = mapped_column(default=1)
    unit_price: Mapped[float] = mapped_column()
    line_total: Mapped[float] = mapped_column()

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"))
    amount_paid: Mapped[float] = mapped_column()
    payment_date: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)
    payment_method: Mapped[str] = mapped_column(String(50)) # Cash, Card, Transfer
    recorded_by: Mapped[Optional[str]] = mapped_column(String(50))

    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")

class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20), default="Scheduled") # Scheduled, Completed, Cancelled, No-show
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="appointments")
    doctor: Mapped["User"] = relationship("User")

class XrayImage(Base):
    __tablename__ = "xray_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    visit_id: Mapped[int] = mapped_column(ForeignKey("visits.id"))
    image_url: Mapped[str] = mapped_column(String(500))
    label: Mapped[Optional[str]] = mapped_column(String(200), default=None)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=get_local_time_eat)

    visit: Mapped["Visit"] = relationship(back_populates="xray_images")

