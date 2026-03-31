"""Sovereign OS - Device & SIM Monitor Endpoints"""
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import get_current_user
from app.models.schemas import PhoneCheckRequest, HLRResultResponse
from app.services.device_monitor import SIMIntegrityMonitor, ActiveSessionAnalyzer
import structlog

logger = structlog.get_logger()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/sim-check", response_model=HLRResultResponse)
@limiter.limit("5/hour")
async def check_sim_integrity(
    request: Request,
    body: PhoneCheckRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Check SIM card integrity via HLR lookup.
    Detects porting (SIM swap indicator) and roaming anomalies.
    """
    monitor = SIMIntegrityMonitor()
    result = await monitor.check_phone_number(body.phone_number)
    
    # Add USSD guidance
    ussd_guidance = monitor.get_call_forwarding_guidance(result.network)
    
    return HLRResultResponse(
        phone_number=result.phone_number,
        network=result.network,
        country=result.country,
        ported=result.ported,
        roaming=result.roaming,
        threat_level=result.threat_level.value,
        indicators=result.indicators,
        ussd_guidance={
            "codes": ussd_guidance.ussd_codes,
            "instructions": ussd_guidance.guidance,
            "warning_signs": ussd_guidance.indicators,
        },
        error=result.error,
    )


@router.get("/call-forwarding-guide")
async def call_forwarding_guide(
    carrier: str = None,
    current_user: dict = Depends(get_current_user),
):
    """Get USSD codes and guidance for checking call forwarding."""
    monitor = SIMIntegrityMonitor()
    guidance = monitor.get_call_forwarding_guidance(carrier)
    
    return {
        "ussd_codes": guidance.ussd_codes,
        "step_by_step": guidance.guidance,
        "warning_indicators": guidance.indicators,
        "note": "Run these codes directly from your phone's dialer app.",
    }


@router.get("/session-guide")
async def active_session_guide(current_user: dict = Depends(get_current_user)):
    """
    Get direct links and instructions for checking active sessions
    on Google, Meta, Apple, and Microsoft.
    No OAuth required - direct user to provider portals.
    """
    analyzer = ActiveSessionAnalyzer()
    return {
        "providers": analyzer.get_session_check_guidance(),
        "priority": ["google", "meta", "apple", "microsoft"],
        "tip": "Review active sessions monthly and remove any unrecognized devices immediately.",
    }
