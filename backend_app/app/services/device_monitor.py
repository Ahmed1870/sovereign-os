"""
Sovereign OS - SIM & Device Integrity Monitor
Detects SIM swap indicators, call forwarding, and active session anomalies.
"""
import asyncio
import aiohttp
from typing import Optional
from dataclasses import dataclass, field
from enum import Enum
from app.core.config import settings
import structlog

logger = structlog.get_logger()


class ThreatLevel(str, Enum):
    CRITICAL = "critical"
    SUSPICIOUS = "suspicious"
    NORMAL = "normal"
    UNKNOWN = "unknown"


@dataclass
class HLRResult:
    """HLR (Home Location Register) lookup result."""
    phone_number: str
    network: Optional[str] = None
    country: Optional[str] = None
    mcc: Optional[str] = None       # Mobile Country Code
    mnc: Optional[str] = None       # Mobile Network Code
    ported: Optional[bool] = None   # Number ported (SIM swap indicator!)
    roaming: Optional[bool] = None
    threat_level: ThreatLevel = ThreatLevel.UNKNOWN
    indicators: list = field(default_factory=list)
    error: Optional[str] = None


@dataclass
class CallForwardingInfo:
    """Call forwarding diagnostic information."""
    ussd_codes: dict = field(default_factory=dict)
    guidance: list = field(default_factory=list)
    indicators: list = field(default_factory=list)


@dataclass
class SessionInfo:
    """Active session information from OAuth providers."""
    provider: str
    sessions: list = field(default_factory=list)
    suspicious_sessions: list = field(default_factory=list)
    threat_level: ThreatLevel = ThreatLevel.NORMAL


# USSD codes for call forwarding detection by region
CALL_FORWARDING_USSD = {
    "universal": {
        "check_all_forwarding": "*#21#",
        "check_busy_forwarding": "*#67#",
        "check_no_answer_forwarding": "*#61#",
        "disable_all_forwarding": "##002#",
        "disable_unconditional": "##21#",
    },
    "vodafone": {
        "check_forwarding": "*#21#",
        "disable_all": "##002#",
    },
    "att": {
        "check_forwarding": "*#21#",
        "disable_all": "##002#",
    },
    "tmobile": {
        "check_forwarding": "*#21#",
        "disable_all": "##002#",
    },
}

SUSPICIOUS_COUNTRIES = {
    # Countries commonly associated with SIM swap fraud (for risk scoring only)
    "high_risk_indicators": ["NG", "GH", "KE"],  # Example - adjust per threat intelligence
}


class SIMIntegrityMonitor:
    """
    Monitors SIM card integrity for swap indicators.
    Uses free-tier HLR lookup APIs.
    """
    
    # Free HLR APIs (limited requests)
    ABSTRACT_HLR_URL = "https://phonevalidation.abstractapi.com/v1/"
    
    def __init__(self):
        self._rate_limiter = asyncio.Semaphore(2)  # Max 2 concurrent requests
    
    async def check_phone_number(self, phone_number: str) -> HLRResult:
        """
        Perform HLR lookup on phone number.
        Detects: number porting (SIM swap indicator), roaming anomalies.
        """
        # Normalize phone number
        phone_clean = "".join(c for c in phone_number if c.isdigit() or c == "+")
        
        if not phone_clean:
            return HLRResult(phone_number=phone_number, error="Invalid phone number format")
        
        result = HLRResult(phone_number=phone_clean)
        
        async with self._rate_limiter:
            if settings.ABSTRACT_API_KEY:
                result = await self._abstract_hlr_lookup(phone_clean)
            else:
                result.error = "No HLR API key configured. Add ABSTRACT_API_KEY to .env"
                result.guidance = self.get_manual_check_guidance()
                return result
        
        # Assess threat level
        result = self._assess_threat(result)
        return result
    
    async def _abstract_hlr_lookup(self, phone: str) -> HLRResult:
        """AbstractAPI phone validation (free tier: 250 req/month)."""
        result = HLRResult(phone_number=phone)
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    self.ABSTRACT_HLR_URL,
                    params={"api_key": settings.ABSTRACT_API_KEY, "phone": phone},
                    timeout=aiohttp.ClientTimeout(total=10),
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        result.network = data.get("carrier", {}).get("name")
                        result.country = data.get("country", {}).get("code")
                        
                        # Check for porting (key SIM swap indicator)
                        phone_type = data.get("type", "")
                        result.roaming = data.get("valid", False) and phone_type == "Roaming"
                        
                    elif resp.status == 429:
                        result.error = "HLR API rate limit exceeded"
                    else:
                        result.error = f"HLR API returned status {resp.status}"
        except Exception as e:
            result.error = str(e)[:100]
            logger.error("hlr_lookup_failed", error=str(e))
        
        return result
    
    def _assess_threat(self, result: HLRResult) -> HLRResult:
        """Assess SIM swap threat level from HLR data."""
        indicators = []
        
        if result.ported:
            indicators.append("Phone number has been ported - possible SIM swap")
            result.threat_level = ThreatLevel.SUSPICIOUS
        
        if result.roaming:
            indicators.append("Number appears to be roaming unexpectedly")
        
        if result.country in SUSPICIOUS_COUNTRIES.get("high_risk_indicators", []):
            indicators.append(f"Number registered in elevated-risk region ({result.country})")
        
        if not indicators:
            result.threat_level = ThreatLevel.NORMAL
        elif result.threat_level == ThreatLevel.UNKNOWN:
            result.threat_level = ThreatLevel.SUSPICIOUS if indicators else ThreatLevel.NORMAL
        
        result.indicators = indicators
        return result
    
    def get_call_forwarding_guidance(self, carrier: Optional[str] = None) -> CallForwardingInfo:
        """
        Provide USSD code guidance for checking call forwarding.
        This is guidance for the user to run on their own device.
        """
        codes = CALL_FORWARDING_USSD.get(
            carrier.lower() if carrier else "universal",
            CALL_FORWARDING_USSD["universal"]
        )
        
        guidance = [
            "📱 To check if your calls are being forwarded (possible SIM hijack):",
            f"1. Open your phone dialer and type: {codes.get('check_all_forwarding', '*#21#')}",
            "2. Press call - your carrier will show forwarding status",
            f"3. If forwarding is active and you didn't set it, dial: {codes.get('disable_all_forwarding', '##002#')}",
            "4. Contact your carrier immediately if you find unauthorized forwarding",
            "",
            "⚠️ Signs of SIM swap attack:",
            "   • Sudden loss of signal on your device",
            "   • Unable to make calls or send texts",
            "   • Unexpected account notifications",
            "   • Carrier sends porting confirmation you didn't request",
        ]
        
        indicators = [
            "Loss of mobile signal without explanation",
            "SMS 2FA codes stop arriving",
            "Carrier confirms SIM was recently transferred",
            "Calls from your number appear from unknown device",
        ]
        
        return CallForwardingInfo(
            ussd_codes=codes,
            guidance=guidance,
            indicators=indicators,
        )
    
    @staticmethod
    def get_manual_check_guidance() -> list:
        """Guidance for manual SIM integrity check (no API required)."""
        return [
            "Visit your carrier's account portal to check for recent SIM changes",
            "Enable SIM PIN lock on your device (Settings > Security > SIM Lock)",
            "Contact carrier to add 'Port Freeze' or 'SIM Lock' to your account",
            "Use app-based 2FA (TOTP) instead of SMS 2FA where possible",
        ]


class ActiveSessionAnalyzer:
    """
    Analyzes active sessions from Google and Meta via OAuth.
    Identifies suspicious sessions (unknown devices, unusual locations).
    """
    
    GOOGLE_TOKENINFO = "https://www.googleapis.com/oauth2/v3/tokeninfo"
    
    async def analyze_google_sessions(self, google_access_token: str) -> SessionInfo:
        """
        Analyze Google account active sessions.
        Requires user-provided Google OAuth token.
        """
        session_info = SessionInfo(provider="Google")
        
        try:
            async with aiohttp.ClientSession() as session:
                # Verify token and get basic info
                async with session.get(
                    self.GOOGLE_TOKENINFO,
                    params={"access_token": google_access_token},
                ) as resp:
                    if resp.status != 200:
                        session_info.threat_level = ThreatLevel.UNKNOWN
                        return session_info
                    
                    token_data = await resp.json()
                    
                    # Check token properties
                    scope = token_data.get("scope", "")
                    suspicious = []
                    
                    # Flag if overly permissive scopes
                    dangerous_scopes = [
                        "https://mail.google.com",
                        "https://www.googleapis.com/auth/drive",
                        "https://www.googleapis.com/auth/contacts",
                    ]
                    
                    for ds in dangerous_scopes:
                        if ds in scope:
                            suspicious.append(f"Broad access granted to: {ds.split('/')[-1]}")
                    
                    session_info.sessions = [{
                        "email": token_data.get("email"),
                        "scope": scope,
                        "expires_in": token_data.get("exp"),
                    }]
                    
                    session_info.suspicious_sessions = suspicious
                    session_info.threat_level = (
                        ThreatLevel.SUSPICIOUS if suspicious else ThreatLevel.NORMAL
                    )
        
        except Exception as e:
            logger.error("google_session_analysis_failed", error=str(e))
            session_info.threat_level = ThreatLevel.UNKNOWN
        
        return session_info
    
    def get_session_check_guidance(self) -> dict:
        """
        Provide direct links and instructions for checking active sessions.
        No OAuth required - user visits these URLs directly.
        """
        return {
            "google": {
                "sessions_url": "https://myaccount.google.com/device-activity",
                "security_checkup": "https://myaccount.google.com/security-checkup",
                "connected_apps": "https://myaccount.google.com/permissions",
                "instructions": [
                    "Visit Google Account > Security > Your devices",
                    "Review all active sessions and sign out unknown devices",
                    "Check 'Third-party apps with account access'",
                    "Enable Google Advanced Protection if high risk",
                ],
            },
            "meta": {
                "sessions_url": "https://www.facebook.com/settings?tab=security",
                "active_sessions": "https://accountscenter.instagram.com/password_and_security/",
                "connected_apps": "https://www.facebook.com/settings?tab=applications",
                "instructions": [
                    "Visit Meta Account Center > Password and Security > Where you're logged in",
                    "Log out of all sessions except your current device",
                    "Review apps connected to your Facebook/Instagram",
                    "Enable login alerts for unrecognized logins",
                ],
            },
            "apple": {
                "sessions_url": "https://appleid.apple.com/account/manage",
                "instructions": [
                    "Visit appleid.apple.com > Devices",
                    "Remove any devices you don't recognize",
                    "Enable two-factor authentication if not already active",
                ],
            },
            "microsoft": {
                "sessions_url": "https://account.microsoft.com/devices",
                "instructions": [
                    "Visit account.microsoft.com > Devices",
                    "Review sign-in activity for suspicious logins",
                ],
            },
        }
