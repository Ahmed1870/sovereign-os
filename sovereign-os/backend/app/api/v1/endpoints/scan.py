"""Sovereign OS - Scan Endpoints (Identity Radar)"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import get_current_user
from app.core.database import get_supabase_client
from app.models.schemas import (
    UsernameScanRequest, EmailScanRequest, FullScanResponse,
    ScanResultItem, BreachResultItem, SecurityScore,
)
from app.services.osint_engine import (
    IdentityRadar, BreachChecker, SecurityScoreCalculator, RiskLevel,
)
from app.services.shadow_cleaner import NotificationAggregator
import structlog

logger = structlog.get_logger()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/username", response_model=list[ScanResultItem])
@limiter.limit("10/hour")
async def scan_username(
    request: Request,
    body: UsernameScanRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Scan username across platforms (Identity Radar).
    Rate limited: 10 scans/hour for free users.
    """
    try:
        async with IdentityRadar() as radar:
            results = await radar.scan_username(
                username=body.username,
                platforms=body.platforms,
            )
        
        # Store scan result
        _store_scan_result(current_user["user_id"], "username", body.username, results)
        
        return [
            ScanResultItem(
                platform=r.platform,
                found=r.found,
                profile_url=r.profile_url,
                risk_level=r.risk_level.value,
                details=r.details,
                error=r.error,
            )
            for r in results
        ]
    
    except Exception as e:
        logger.error("username_scan_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scan failed. Please try again later.",
        )


@router.post("/email", response_model=list[BreachResultItem])
@limiter.limit("5/hour")
async def scan_email_breaches(
    request: Request,
    body: EmailScanRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Check email against known data breaches.
    Uses HIBP k-anonymity protocol for privacy.
    """
    try:
        checker = BreachChecker()
        results = await checker.check_email_breaches(body.email)
        
        # Optionally check password
        pwned_count = 0
        if body.check_password:
            pwned_count = await checker.check_password_pwned(body.check_password)
        
        return [
            BreachResultItem(
                source=r.source,
                breach_date=r.breach_date,
                data_classes=r.data_classes,
                is_verified=r.is_verified,
                risk_level=r.risk_level.value,
                description=r.description,
            )
            for r in results
        ]
    
    except Exception as e:
        logger.error("email_scan_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Breach check failed. Please try again.",
        )


@router.post("/full", response_model=FullScanResponse)
@limiter.limit("3/hour")
async def full_identity_scan(
    request: Request,
    username_body: UsernameScanRequest,
    email: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Complete identity scan: platforms + breaches + score + AI summary.
    """
    scan_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    try:
        # Concurrent scans
        import asyncio
        
        async with IdentityRadar() as radar:
            checker = BreachChecker()
            
            platform_task = radar.scan_username(username_body.username)
            breach_task = checker.check_email_breaches(email)
            
            platform_results, breach_results = await asyncio.gather(
                platform_task, breach_task, return_exceptions=True
            )
        
        if isinstance(platform_results, Exception):
            platform_results = []
        if isinstance(breach_results, Exception):
            breach_results = []
        
        # Calculate score
        calculator = SecurityScoreCalculator()
        score_data = calculator.calculate(breach_results, platform_results)
        
        # Build alerts for AI summary
        alerts = []
        for b in breach_results:
            alerts.append({
                "type": "Data Breach",
                "description": f"Found in {b.source} breach ({', '.join(b.data_classes[:3])})",
                "risk_level": b.risk_level.value,
            })
        for p in platform_results:
            if p.found and p.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                alerts.append({
                    "type": "Platform Exposure",
                    "description": f"High-risk profile found on {p.platform}",
                    "risk_level": p.risk_level.value,
                })
        
        # AI summary
        aggregator = NotificationAggregator()
        ai_summary = await aggregator.summarize_security_alerts(alerts)
        
        # Recommendations
        recommendations = _generate_recommendations(score_data, breach_results, platform_results)
        
        return FullScanResponse(
            scan_id=scan_id,
            timestamp=timestamp,
            username_results=[
                ScanResultItem(
                    platform=r.platform,
                    found=r.found,
                    profile_url=r.profile_url,
                    risk_level=r.risk_level.value,
                    details=r.details,
                )
                for r in platform_results
            ],
            breach_results=[
                BreachResultItem(
                    source=r.source,
                    breach_date=r.breach_date,
                    data_classes=r.data_classes,
                    is_verified=r.is_verified,
                    risk_level=r.risk_level.value,
                    description=r.description,
                )
                for r in breach_results
            ],
            security_score=SecurityScore(**score_data),
            ai_summary=ai_summary,
            recommendations=recommendations,
        )
    
    except Exception as e:
        logger.error("full_scan_failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Full scan failed.",
        )


def _generate_recommendations(score_data: dict, breach_results, platform_results) -> list[str]:
    """Generate prioritized security recommendations."""
    recs = []
    
    if score_data["critical_issues"] > 0:
        recs.append("🔴 URGENT: Change passwords for all breached accounts immediately")
        recs.append("Enable app-based 2FA (Google Authenticator/Authy) on all critical accounts")
    
    if score_data["total_breaches"] > 0:
        recs.append("Use a password manager (Bitwarden - free) to generate unique passwords")
        recs.append("Request data deletion from breach sources using our Shadow Cleaner module")
    
    if score_data["platform_exposure"] > 5:
        recs.append("Review and delete unused social media accounts to reduce attack surface")
        recs.append("Audit privacy settings on active platforms - make profiles private")
    
    recs.append("Enable login alerts on Gmail, Facebook, and other critical accounts")
    recs.append("Consider a credit freeze if financial data was exposed")
    
    return recs[:6]  # Return top 6 recommendations


def _store_scan_result(user_id: str, scan_type: str, target: str, results):
    """Store scan results in Supabase (async fire-and-forget)."""
    try:
        supabase = get_supabase_client()
        supabase.table("scan_history").insert({
            "user_id": user_id,
            "scan_type": scan_type,
            "target_hash": str(hash(target)),  # Never store raw target
            "results_count": len(results) if results else 0,
        }).execute()
        
        # Increment scan counter
        supabase.rpc("increment_scan_count", {"p_user_id": user_id}).execute()
    except Exception as e:
        logger.warning("scan_storage_failed", error=str(e))
