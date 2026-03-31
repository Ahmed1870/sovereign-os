"""
Sovereign OS - Configuration Management
All settings loaded from environment variables with validation.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator
import secrets


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────
    APP_NAME: str = "Sovereign OS"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = secrets.token_urlsafe(64)
    DEBUG: bool = False
    ENABLE_METRICS: bool = True

    # ── CORS & Hosts ─────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8501",
        "https://sovereign-os.vercel.app",
    ]
    ALLOWED_HOSTS: List[str] = ["sovereign-os-api.railway.app", "localhost"]

    # ── Supabase ─────────────────────────────────────────────────────
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Encryption ───────────────────────────────────────────────────
    # 32-byte key for AES-256. NEVER hardcode in production.
    ENCRYPTION_KEY: str = ""  # Base64-encoded 32-byte key

    # ── External APIs (all free tiers) ───────────────────────────────
    HAVEIBEENPWNED_API_KEY: str = ""  # Free with registration
    LEAKCHECK_API_KEY: str = ""       # Free tier available
    HUNTER_IO_API_KEY: str = ""       # 50 free requests/month
    ABSTRACT_API_KEY: str = ""        # HLR lookup - free tier
    OPENROUTER_API_KEY: str = ""      # Free LLM API (mistral/llama)

    # ── Redis (for rate limiting & task queue) ───────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── Rate Limiting ─────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 30
    SCAN_RATE_LIMIT_PER_HOUR: int = 10

    # ── JWT ───────────────────────────────────────────────────────────
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Stripe (ready for future integration) ─────────────────────────
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PRO_PRICE_ID: Optional[str] = None

    # ── Email (GDPR request sender) ───────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "privacy@sovereignos.app"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @validator("ENCRYPTION_KEY")
    def validate_encryption_key(cls, v):
        if v and len(v) < 32:
            raise ValueError("ENCRYPTION_KEY must be at least 32 characters (use base64-encoded 32-byte key)")
        return v


settings = Settings()
