"""
Sovereign OS - Authentication & Authorization
JWT + Supabase Auth integration.
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from app.core.config import settings
from app.core.database import get_supabase_client
import structlog

logger = structlog.get_logger()
security = HTTPBearer()


class AuthError(Exception):
    pass


def create_access_token(user_id: str, email: str) -> str:
    """Create JWT access token."""
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "sovereign-os",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if payload.get("sub") is None:
            raise AuthError("Token missing subject")
        return payload
    except JWTError as e:
        raise AuthError(f"Invalid token: {e}") from e


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency: extract and validate current user from JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id:
            raise credentials_exception
        
        return {
            "user_id": user_id,
            "email": email,
            "token": credentials.credentials,
        }
    except AuthError:
        logger.warning("auth_failed", hint="invalid_or_expired_token")
        raise credentials_exception


async def get_current_pro_user(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Dependency that requires Pro subscription."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("user_profiles").select("subscription_tier").eq(
            "user_id", current_user["user_id"]
        ).single().execute()
        
        if not result.data or result.data.get("subscription_tier") not in ["pro", "enterprise"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This feature requires a Pro subscription.",
            )
    except Exception as e:
        logger.error("subscription_check_failed", error=str(e))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not verify subscription")
    
    return current_user
