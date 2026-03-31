"""Sovereign OS - API v1 Router"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, scan, privacy, device, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(scan.router, prefix="/scan", tags=["Identity Radar"])
api_router.include_router(device.router, prefix="/device", tags=["Device Monitor"])
api_router.include_router(privacy.router, prefix="/privacy", tags=["Shadow Cleaner"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
