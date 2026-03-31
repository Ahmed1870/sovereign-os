"""Sovereign OS - Authentication Endpoints"""
from fastapi import APIRouter, HTTPException, status, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import RegisterRequest, LoginRequest, AuthResponse
from app.core.config import settings
from app.core.auth import create_access_token
from app.core.database import get_supabase_client
import structlog

logger = structlog.get_logger()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, body: RegisterRequest):
    """Register a new user account."""
    supabase = get_supabase_client()
    
    try:
        # Create auth user in Supabase
        auth_response = supabase.auth.sign_up({
            "email": body.email,
            "password": body.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed. Email may already be in use.",
            )
        
        user_id = auth_response.user.id
        
        # Create user profile
        supabase.table("user_profiles").insert({
            "user_id": user_id,
            "full_name": body.full_name,
            "subscription_tier": "free",
            "scan_count": 0,
        }).execute()
        
        token = create_access_token(user_id=user_id, email=body.email)
        
        logger.info("user_registered", user_id=user_id[:8] + "***")
        
        return AuthResponse(
            access_token=token,
            user_id=user_id,
            email=body.email,
            subscription_tier="free",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("registration_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again.",
        )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest):
    """Login with email and password."""
    supabase = get_supabase_client()
    
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })
        
        if not auth_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )
        
        user_id = auth_response.user.id
        
        # Get subscription tier
        profile = supabase.table("user_profiles").select("subscription_tier").eq(
            "user_id", user_id
        ).single().execute()
        
        tier = profile.data.get("subscription_tier", "free") if profile.data else "free"
        
        token = create_access_token(user_id=user_id, email=body.email)
        
        logger.info("user_logged_in", user_id=user_id[:8] + "***")
        
        return AuthResponse(
            access_token=token,
            user_id=user_id,
            email=body.email,
            subscription_tier=tier,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )


@router.post("/logout")
async def logout():
    """Logout (client should discard JWT)."""
    return {"message": "Logged out successfully. Please discard your access token."}
