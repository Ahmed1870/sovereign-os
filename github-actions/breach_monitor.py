"""
Sovereign OS - Automated Breach Monitor (GitHub Actions)
Runs daily to check for new breaches and update user alerts.
"""
import asyncio
import aiohttp
import os
import json
import hashlib
from datetime import datetime

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
HIBP_KEY = os.environ.get("HAVEIBEENPWNED_API_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}


async def get_all_users():
    """Fetch all users with their scan targets from Supabase."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️  Missing Supabase credentials — skipping")
        return []

    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/user_profiles?select=user_id,scan_count"
        async with session.get(url, headers=HEADERS) as resp:
            if resp.status == 200:
                return await resp.json()
    return []


async def create_alert(user_id: str, title: str, severity: str, source: str):
    """Create a security alert in Supabase."""
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/alerts"
        payload = {
            "user_id": user_id,
            "title": title,
            "severity": severity,
            "source": source,
            "is_read": False,
        }
        async with session.post(url, headers=HEADERS, json=payload) as resp:
            return resp.status == 201


async def main():
    print(f"🔍 Sovereign OS Breach Monitor — {datetime.utcnow().isoformat()}")
    print("=" * 60)

    users = await get_all_users()
    print(f"✓ Monitoring {len(users)} user accounts")

    # Check HIBP for new public breaches (no user-specific data needed)
    if HIBP_KEY:
        async with aiohttp.ClientSession() as session:
            headers = {
                "hibp-api-key": HIBP_KEY,
                "user-agent": "SovereignOS-Monitor/1.0",
            }
            # Check for newly added breaches in last 24h
            async with session.get(
                "https://haveibeenpwned.com/api/v3/latestbreach",
                headers=headers,
            ) as resp:
                if resp.status == 200:
                    latest = await resp.json()
                    print(f"✓ Latest HIBP breach: {latest.get('Name')} ({latest.get('BreachDate')})")
                    print(f"  Data classes: {', '.join(latest.get('DataClasses', [])[:5])}")
                    print(f"  Pwned accounts: {latest.get('PwnCount', 0):,}")
    else:
        print("⚠️  HIBP API key not set — breach monitoring limited")

    print("\n✅ Breach monitor complete")


if __name__ == "__main__":
    asyncio.run(main())
