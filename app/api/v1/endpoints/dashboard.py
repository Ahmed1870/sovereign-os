"""Sovereign OS - Dashboard Endpoints"""
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user
from app.core.database import get_supabase_client
from app.models.schemas import DashboardStats, UserProfile
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get user dashboard statistics and security overview."""
    supabase = get_supabase_client()
    user_id = current_user["user_id"]
    
    try:
        # Get profile
        profile = supabase.table("user_profiles").select(
            "scan_count, last_scan_at, security_score, deletion_requests_sent"
        ).eq("user_id", user_id).single().execute()
        
        if not profile.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        
        data = profile.data
        score = data.get("security_score", 0) or 0
        
        # Calculate grade
        if score >= 85: grade, status_text = "A", "Excellent"
        elif score >= 70: grade, status_text = "B", "Good"
        elif score >= 55: grade, status_text = "C", "Fair"
        elif score >= 40: grade, status_text = "D", "At Risk"
        else: grade, status_text = "F", "Critical"
        
        # Get recent alerts
        alerts_result = supabase.table("alerts").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).limit(5).execute()
        
        alerts = alerts_result.data or []
        
        return DashboardStats(
            security_score=score,
            grade=grade,
            status=status_text,
            total_scans=data.get("scan_count", 0),
            breaches_found=data.get("breaches_found", 0) or 0,
            platforms_exposed=data.get("platforms_exposed", 0) or 0,
            deletion_requests_sent=data.get("deletion_requests_sent", 0) or 0,
            last_scan_at=data.get("last_scan_at"),
            alerts=alerts,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("dashboard_stats_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard stats.",
        )


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("user_profiles").select("*").eq(
            "user_id", current_user["user_id"]
        ).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        return UserProfile(
            user_id=current_user["user_id"],
            email=current_user["email"],
            **{k: v for k, v in result.data.items() if k in UserProfile.__fields__},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_profile_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load profile.")
