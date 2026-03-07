from typing import List, Optional
from sqlalchemy import String, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(50), default="Receptionist") # Admin, Dentist, Receptionist
    is_active: Mapped[bool] = mapped_column(default=True)

class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    card_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(150))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    age: Mapped[Optional[int]] = mapped_column()
    sex: Mapped[Optional[str]] = mapped_column(String(10))
    address: Mapped[Optional[str]] = mapped_column(String(250))
    medical_alerts: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

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
    referrals: Mapped[List["Referral"]] = relationship(
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
    visit_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    chief_complaint: Mapped[Optional[str]] = mapped_column(String(500))
    doctors_notes: Mapped[Optional[str]] = mapped_column(Text)
    
    # Vital Signs
    blood_pressure: Mapped[Optional[str]] = mapped_column(String(20))
    heart_rate: Mapped[Optional[int]] = mapped_column()
    respiratory_rate: Mapped[Optional[int]] = mapped_column()
    temperature: Mapped[Optional[float]] = mapped_column()
    
    # X-Ray
    xray_url: Mapped[Optional[str]] = mapped_column(String(500))

    patient: Mapped["Patient"] = relationship(back_populates="visits")

class Prescription(Base):
    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    medications: Mapped[str] = mapped_column(Text)  # JSON string of medications
    instructions: Mapped[Optional[str]] = mapped_column(Text)
    
    patient: Mapped["Patient"] = relationship(back_populates="prescriptions")

class SickLeave(Base):
    __tablename__ = "sick_leaves"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[datetime] = mapped_column(DateTime)
    diagnosis: Mapped[str] = mapped_column(String(500))
    recommendations: Mapped[Optional[str]] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="sick_leaves")

class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    visit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("visits.id"))
    date_issued: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    referred_to: Mapped[str] = mapped_column(String(200)) # Clinic or Doctor name
    reason: Mapped[str] = mapped_column(Text)
    clinical_summary: Mapped[Optional[str]] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="referrals")
