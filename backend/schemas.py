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
    blood_pressure: Optional[str] = Field(default=None, max_length=20)
    heart_rate: Optional[int] = None
    respiratory_rate: Optional[int] = None
    temperature: Optional[float] = None
    xray_url: Optional[str] = Field(default=None, max_length=500)

class VisitCreate(VisitBase):
    pass

class VisitRead(VisitBase):
    id: int
    patient_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Clinical Document Schemas ---

class PrescriptionBase(BaseModel):
    medications: str
    instructions: Optional[str] = None
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
    diagnosis: str
    recommendations: Optional[str] = None
    visit_id: Optional[int] = None

class SickLeaveCreate(SickLeaveBase):
    pass

class SickLeaveRead(SickLeaveBase):
    id: int
    patient_id: int
    date_issued: datetime
    model_config = ConfigDict(from_attributes=True)

class ReferralBase(BaseModel):
    referred_to: str
    reason: str
    clinical_summary: Optional[str] = None
    visit_id: Optional[int] = None

class ReferralCreate(ReferralBase):
    pass

class ReferralRead(ReferralBase):
    id: int
    patient_id: int
    date_issued: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Patient Schemas ---

class PatientBase(BaseModel):
    card_number: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    phone: Optional[str] = Field(default=None, max_length=20)
    age: Optional[int] = None
    sex: Optional[str] = Field(default=None, max_length=10)
    address: Optional[str] = Field(default=None, max_length=250)
    medical_alerts: Optional[str] = Field(default=None, max_length=500)

class PatientCreate(PatientBase):
    pass

class PatientRead(PatientBase):
    id: int
    created_at: Optional[datetime] = None
    teeth: List[ToothStatusRead] = []
    visits: List[VisitRead] = []
    prescriptions: List[PrescriptionRead] = []
    sick_leaves: List[SickLeaveRead] = []
    referrals: List[ReferralRead] = []

    model_config = ConfigDict(from_attributes=True)
