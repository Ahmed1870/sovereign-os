"""
Sovereign OS - API Pydantic Models
Request/Response schemas with strict validation.
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum
import re


class SubscriptionTier(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


# ── Auth Models ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    
    @validator("password")
    def validate_password_strength(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    subscription_tier: SubscriptionTier


# ── Scan Models ───────────────────────────────────────────────────────────────

class UsernameScanRequest(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    platforms: Optional[List[str]] = None
    
    @validator("username")
    def sanitize_username(cls, v):
        v = v.strip().replace("@", "")
        if not re.match(r"^[a-zA-Z0-9._-]+$", v):
            raise ValueError("Username contains invalid characters")
        return v.lower()


class EmailScanRequest(BaseModel):
    email: EmailStr
    check_breaches: bool = True
    check_password: Optional[str] = None  # Optional: check if password is pwned


class PhoneCheckRequest(BaseModel):
    phone_number: str = Field(min_length=7, max_length=20)
    
    @validator("phone_number")
    def validate_phone(cls, v):
        clean = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?[0-9]{7,15}$", clean):
            raise ValueError("Invalid phone number format")
        return clean


class ScanResultItem(BaseModel):
    platform: str
    found: bool
    profile_url: Optional[str] = None
    risk_level: str
    details: dict = {}
    error: Optional[str] = None


class BreachResultItem(BaseModel):
    source: str
    breach_date: Optional[str] = None
    data_classes: List[str] = []
    is_verified: bool
    risk_level: str
    description: Optional[str] = None


class SecurityScore(BaseModel):
    total_score: int = Field(ge=0, le=100)
    grade: str
    status: str
    breakdown: dict
    critical_issues: int
    total_breaches: int
    platform_exposure: int


class FullScanResponse(BaseModel):
    scan_id: str
    timestamp: str
    username_results: List[ScanResultItem] = []
    breach_results: List[BreachResultItem] = []
    security_score: SecurityScore
    ai_summary: str
    recommendations: List[str] = []


# ── GDPR Models ───────────────────────────────────────────────────────────────

class GDPRRequestParams(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    location_code: Optional[str] = Field(None, min_length=2, max_length=2)
    broker_ids: Optional[List[str]] = None
    
    @validator("full_name")
    def sanitize_name(cls, v):
        if re.search(r"[<>\"'&]", v):
            raise ValueError("Full name contains invalid characters")
        return v.strip()


class GDPRRequestItem(BaseModel):
    broker_name: str
    broker_id: str
    email_subject: str
    email_body: str
    opt_out_url: str
    privacy_email: str
    estimated_removal_days: int
    legal_basis: str
    generated_at: str


# ── Profile Models ────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    subscription_tier: SubscriptionTier
    scan_count: int = 0
    created_at: str
    last_scan_at: Optional[str] = None
    security_score: Optional[int] = None


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    location_code: Optional[str] = Field(None, min_length=2, max_length=2)


# ── Device Models ─────────────────────────────────────────────────────────────

class HLRResultResponse(BaseModel):
    phone_number: str
    network: Optional[str] = None
    country: Optional[str] = None
    ported: Optional[bool] = None
    roaming: Optional[bool] = None
    threat_level: str
    indicators: List[str] = []
    ussd_guidance: Optional[dict] = None
    error: Optional[str] = None


# ── Dashboard Models ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    security_score: int
    grade: str
    status: str
    total_scans: int
    breaches_found: int
    platforms_exposed: int
    deletion_requests_sent: int
    last_scan_at: Optional[str]
    alerts: List[dict] = []
