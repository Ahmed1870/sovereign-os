"""
Sovereign OS - Utility Helpers
"""
import hashlib
import re
from typing import Optional


def hash_target(value: str) -> str:
    """One-way hash a scan target for privacy-safe storage."""
    return hashlib.sha256(value.lower().strip().encode()).hexdigest()


def sanitize_username(username: str) -> str:
    """Sanitize and normalize a username."""
    username = username.strip().replace("@", "").lower()
    username = re.sub(r"[^a-z0-9._-]", "", username)
    return username[:50]


def mask_email(email: str) -> str:
    """Mask email for logging: user@domain.com → u***@domain.com"""
    parts = email.split("@")
    if len(parts) != 2:
        return "****"
    local, domain = parts
    if len(local) <= 2:
        return f"{'*' * len(local)}@{domain}"
    return f"{local[0]}{'*' * (len(local) - 2)}{local[-1]}@{domain}"


def mask_phone(phone: str) -> str:
    """Mask phone for logging: +1234567890 → +1****7890"""
    if len(phone) <= 4:
        return "****"
    return phone[:3] + "****" + phone[-3:]


def validate_country_code(code: str) -> bool:
    """Validate ISO 3166-1 alpha-2 country code."""
    if not code or len(code) != 2:
        return False
    return code.isalpha()


def truncate_text(text: str, max_length: int = 200) -> str:
    """Safely truncate text with ellipsis."""
    if not text:
        return ""
    text = str(text)
    if len(text) <= max_length:
        return text
    return text[:max_length - 3] + "..."
