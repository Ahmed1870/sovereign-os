"""
Sovereign OS - Supabase Database Client
Multi-tenant with RLS enforcement.
"""
from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings
import structlog

logger = structlog.get_logger()


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Get Supabase client (anon key - respects RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache(maxsize=1)
def get_supabase_admin() -> Client:
    """
    Get Supabase admin client (service role - bypasses RLS).
    USE WITH EXTREME CAUTION - only for admin operations.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_user_client(access_token: str) -> Client:
    """Get Supabase client authenticated as a specific user (enforces RLS)."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.auth.set_session(access_token, "")
    return client
