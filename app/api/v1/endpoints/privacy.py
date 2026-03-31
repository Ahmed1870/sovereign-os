"""Sovereign OS - Privacy / Shadow Cleaner Endpoints"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.auth import get_current_user
from app.models.schemas import GDPRRequestParams, GDPRRequestItem
from app.services.shadow_cleaner import ShadowCleaner, NotificationAggregator
import structlog

logger = structlog.get_logger()
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/gdpr-requests", response_model=list[GDPRRequestItem])
@limiter.limit("10/hour")
async def generate_gdpr_requests(
    request: Request,
    body: GDPRRequestParams,
    current_user: dict = Depends(get_current_user),
):
    """
    Generate GDPR/CCPA data deletion request emails for data brokers.
    Returns ready-to-send email drafts.
    """
    cleaner = ShadowCleaner()
    requests = cleaner.generate_gdpr_requests(
        full_name=body.full_name,
        email=body.email,
        user_location=body.location_code,
        brokers=body.broker_ids,
    )
    
    return [
        GDPRRequestItem(
            broker_name=r.broker_name,
            broker_id=r.broker_id,
            email_subject=r.email_subject,
            email_body=r.email_body,
            opt_out_url=r.opt_out_url,
            privacy_email=r.privacy_email,
            estimated_removal_days=r.estimated_removal_days,
            legal_basis=r.legal_basis,
            generated_at=r.generated_at,
        )
        for r in requests
    ]


@router.get("/brokers")
async def list_data_brokers(current_user: dict = Depends(get_current_user)):
    """List all known data brokers with opt-out information."""
    cleaner = ShadowCleaner()
    return {"brokers": cleaner.get_all_brokers(), "total": len(cleaner.get_all_brokers())}


@router.post("/summarize-alerts")
async def summarize_alerts(
    alerts: list[dict],
    current_user: dict = Depends(get_current_user),
):
    """Use AI to summarize security alerts in plain language."""
    if len(alerts) > 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 alerts per summary request",
        )
    
    aggregator = NotificationAggregator()
    summary = await aggregator.summarize_security_alerts(alerts)
    return {"summary": summary}
