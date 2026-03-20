from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

# --- User/Auth Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    full_name: Optional[str] = Field(default=None, max_length=150)
    role: str = Field(default="Receptionist")
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserPasswordReset(BaseModel):
    new_password: str = Field(min_length=6)

class UserRead(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- ToothStatus Schemas ---

class ToothStatusBase(BaseModel):
    tooth_number: int = Field(ge=1, le=32, description="Tooth number from 1 to 32")
    condition: str = Field(min_length=1, max_length=100)

class ToothStatusCreate(ToothStatusBase):
    pass

class ToothStatusRead(ToothStatusBase):
    id: int
    patient_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Visit Schemas ---

class VisitBase(BaseModel):
    visit_date: Optional[datetime] = None
    chief_complaint: Optional[str] = Field(default=None, max_length=500)
    doctors_notes: Optional[str] = None
    primary_diagnosis: Optional[str] = Field(default=None, max_length=100)
    blood_pressure: Optional[str] = Field(default=None, max_length=20)
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    temperature: Optional[float] = None
    xray_url: Optional[str] = Field(default=None, max_length=500)
    visit_consent: Optional[bool] = False
    visit_consent_time: Optional[datetime] = None

class VisitCreate(VisitBase):
    pass

class VisitUpdate(BaseModel):
    visit_date: Optional[datetime] = None
    chief_complaint: Optional[str] = Field(default=None, max_length=500)
    doctors_notes: Optional[str] = None
    primary_diagnosis: Optional[str] = Field(default=None, max_length=100)
    blood_pressure: Optional[str] = Field(default=None, max_length=20)
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    temperature: Optional[float] = None
    xray_url: Optional[str] = Field(default=None, max_length=500)
    visit_consent: Optional[bool] = None
    visit_consent_time: Optional[datetime] = None

class VisitRead(VisitBase):
    id: int
    patient_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Clinical Document Schemas ---

class PrescriptionBase(BaseModel):
    medications: str = Field(min_length=1, max_length=2000)
    instructions: Optional[str] = Field(default=None, max_length=1000)
    visit_id: Optional[int] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionRead(PrescriptionBase):
    id: int
    patient_id: int
    date_issued: datetime
    model_config = ConfigDict(from_attributes=True)

class SickLeaveBase(BaseModel):
    start_date: datetime
    end_date: datetime
    diagnosis: str = Field(min_length=1, max_length=500)
    recommendations: Optional[str] = Field(default=None, max_length=1000)
    visit_id: Optional[int] = None

class SickLeaveCreate(SickLeaveBase):
    pass

class SickLeaveRead(SickLeaveBase):
    id: int
    patient_id: int
    date_issued: datetime
    model_config = ConfigDict(from_attributes=True)

class ReferralBase(BaseModel):
    referred_to: str = Field(min_length=1, max_length=250)
    reason: str = Field(min_length=1, max_length=1000)
    clinical_summary: Optional[str] = Field(default=None, max_length=2000)
    visit_id: Optional[int] = None

class ReferralCreate(ReferralBase):
    pass

class ReferralRead(ReferralBase):
    id: int
    patient_id: int
    date_issued: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Billing Schemas ---

class PaymentBase(BaseModel):
    amount_paid: float = Field(gt=0)
    payment_method: str = Field(min_length=1, max_length=50)

class PaymentCreate(PaymentBase):
    pass

class PaymentRead(PaymentBase):
    id: int
    invoice_id: int
    payment_date: datetime
    recorded_by: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    total_amount: float = Field(ge=0)

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceRead(InvoiceBase):
    id: int
    patient_id: int
    created_at: datetime
    status: str
    payments: List[PaymentRead] = []
    model_config = ConfigDict(from_attributes=True)

# --- Patient Schemas ---

class PatientBase(BaseModel):
    card_number: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    age: Optional[int] = None
    sex: Optional[str] = Field(default=None, max_length=10)
    address: Optional[str] = Field(default=None, max_length=250)
    tin_number: Optional[str] = Field(default=None, max_length=50)
    medical_alerts: Optional[str] = Field(default=None, max_length=500)

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    card_number: Optional[str] = Field(default=None, min_length=1, max_length=50)
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    age: Optional[int] = None
    sex: Optional[str] = Field(default=None, max_length=10)
    address: Optional[str] = Field(default=None, max_length=250)
    tin_number: Optional[str] = Field(default=None, max_length=50)
    medical_alerts: Optional[str] = Field(default=None, max_length=500)

class PatientConsentUpdate(BaseModel):
    consent_given: bool
    consent_by: str

class PatientRead(PatientBase):
    id: int
    created_at: Optional[datetime] = None
    consent_given: bool = False
    consent_date: Optional[datetime] = None
    consent_by: Optional[str] = None
    
    teeth: List[ToothStatusRead] = []
    visits: List[VisitRead] = []
    prescriptions: List[PrescriptionRead] = []
    sick_leaves: List[SickLeaveRead] = []
    referrals: List[ReferralRead] = []
    invoices: List[InvoiceRead] = []

    model_config = ConfigDict(from_attributes=True)
