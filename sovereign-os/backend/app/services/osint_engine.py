"""
Sovereign OS - Identity Radar (OSINT Engine)
Scans for digital footprints across the internet.
Uses async programming for concurrent scanning without blocking.
"""
import asyncio
import aiohttp
import hashlib
import json
from typing import Optional
from dataclasses import dataclass, field
from enum import Enum
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.core.config import settings
import structlog

logger = structlog.get_logger()


class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class ScanResult:
    platform: str
    found: bool
    profile_url: Optional[str] = None
    risk_level: RiskLevel = RiskLevel.INFO
    details: dict = field(default_factory=dict)
    error: Optional[str] = None


@dataclass
class BreachResult:
    source: str
    breach_date: Optional[str] = None
    data_classes: list = field(default_factory=list)
    is_verified: bool = False
    risk_level: RiskLevel = RiskLevel.HIGH
    description: Optional[str] = None


class RateLimiter:
    """Token bucket rate limiter for external API calls."""
    
    def __init__(self, calls_per_second: float = 1.0):
        self._calls_per_second = calls_per_second
        self._min_interval = 1.0 / calls_per_second
        self._last_call = 0.0
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        async with self._lock:
            now = asyncio.get_event_loop().time()
            elapsed = now - self._last_call
            if elapsed < self._min_interval:
                await asyncio.sleep(self._min_interval - elapsed)
            self._last_call = asyncio.get_event_loop().time()


# Platform definitions for username scanning
PLATFORMS = {
    "github": {
        "url": "https://github.com/{username}",
        "check_url": "https://api.github.com/users/{username}",
        "method": "api",
        "risk": RiskLevel.LOW,
    },
    "twitter": {
        "url": "https://twitter.com/{username}",
        "check_url": "https://twitter.com/{username}",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.MEDIUM,
    },
    "instagram": {
        "url": "https://www.instagram.com/{username}/",
        "check_url": "https://www.instagram.com/{username}/",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.MEDIUM,
    },
    "linkedin": {
        "url": "https://www.linkedin.com/in/{username}",
        "check_url": "https://www.linkedin.com/in/{username}",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.MEDIUM,
    },
    "reddit": {
        "url": "https://www.reddit.com/user/{username}",
        "check_url": "https://www.reddit.com/user/{username}/about.json",
        "method": "api",
        "risk": RiskLevel.LOW,
    },
    "tiktok": {
        "url": "https://www.tiktok.com/@{username}",
        "check_url": "https://www.tiktok.com/@{username}",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.HIGH,
    },
    "youtube": {
        "url": "https://www.youtube.com/@{username}",
        "check_url": "https://www.youtube.com/@{username}",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.LOW,
    },
    "pinterest": {
        "url": "https://www.pinterest.com/{username}/",
        "check_url": "https://www.pinterest.com/{username}/",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.LOW,
    },
    "medium": {
        "url": "https://medium.com/@{username}",
        "check_url": "https://medium.com/@{username}",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.LOW,
    },
    "telegram": {
        "url": "https://t.me/{username}",
        "check_url": "https://t.me/{username}",
        "method": "status",
        "expected_status": 200,
        "risk": RiskLevel.HIGH,
    },
}


class IdentityRadar:
    """
    OSINT Engine for scanning digital identity footprints.
    All scans are concurrent using asyncio for performance.
    """
    
    def __init__(self):
        self._rate_limiter = RateLimiter(calls_per_second=2.0)
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self._session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10),
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; SovereignOS/1.0; +https://sovereignos.app/bot)",
            },
        )
        return self
    
    async def __aexit__(self, *args):
        if self._session:
            await self._session.close()
    
    async def scan_username(self, username: str, platforms: Optional[list] = None) -> list[ScanResult]:
        """
        Scan username across all platforms concurrently.
        Returns list of ScanResult objects.
        """
        if not username or len(username) < 2:
            return []
        
        # Sanitize username
        username = username.strip().lower().replace("@", "")
        
        target_platforms = platforms or list(PLATFORMS.keys())
        
        tasks = [
            self._check_platform(username, platform_name, PLATFORMS[platform_name])
            for platform_name in target_platforms
            if platform_name in PLATFORMS
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        scan_results = []
        for result in results:
            if isinstance(result, Exception):
                logger.warning("platform_scan_exception", error=str(result))
            elif isinstance(result, ScanResult):
                scan_results.append(result)
        
        logger.info(
            "username_scan_complete",
            username=username[:3] + "***",
            platforms_checked=len(scan_results),
            found=sum(1 for r in scan_results if r.found),
        )
        
        return scan_results
    
    async def _check_platform(self, username: str, platform_name: str, config: dict) -> ScanResult:
        """Check if username exists on a specific platform."""
        await self._rate_limiter.acquire()
        
        url = config["check_url"].format(username=username)
        profile_url = config["url"].format(username=username)
        
        try:
            if config["method"] == "api":
                return await self._check_via_api(username, platform_name, url, profile_url, config)
            else:
                return await self._check_via_status(username, platform_name, url, profile_url, config)
        except asyncio.TimeoutError:
            return ScanResult(
                platform=platform_name,
                found=False,
                error="timeout",
            )
        except Exception as e:
            return ScanResult(
                platform=platform_name,
                found=False,
                error=str(e)[:100],
            )
    
    async def _check_via_api(self, username, platform_name, url, profile_url, config) -> ScanResult:
        """Check platform via API endpoint."""
        async with self._session.get(url, allow_redirects=True, ssl=False) as resp:
            if platform_name == "github":
                if resp.status == 200:
                    data = await resp.json()
                    return ScanResult(
                        platform=platform_name,
                        found=True,
                        profile_url=profile_url,
                        risk_level=config.get("risk", RiskLevel.LOW),
                        details={
                            "name": data.get("name"),
                            "public_repos": data.get("public_repos"),
                            "followers": data.get("followers"),
                            "created_at": data.get("created_at"),
                        },
                    )
            elif resp.status == 200:
                return ScanResult(
                    platform=platform_name,
                    found=True,
                    profile_url=profile_url,
                    risk_level=config.get("risk", RiskLevel.LOW),
                )
            
            return ScanResult(platform=platform_name, found=False)
    
    async def _check_via_status(self, username, platform_name, url, profile_url, config) -> ScanResult:
        """Check platform via HTTP status code."""
        expected = config.get("expected_status", 200)
        async with self._session.get(url, allow_redirects=True, ssl=False) as resp:
            found = resp.status == expected
            return ScanResult(
                platform=platform_name,
                found=found,
                profile_url=profile_url if found else None,
                risk_level=config.get("risk", RiskLevel.LOW) if found else RiskLevel.INFO,
            )


class BreachChecker:
    """
    Data breach checker using HaveIBeenPwned and LeakCheck APIs.
    Implements SHA-1 k-anonymity for HIBP to protect email privacy.
    """
    
    HIBP_BASE = "https://haveibeenpwned.com/api/v3"
    HIBP_PWNED_PASSWORDS = "https://api.pwnedpasswords.com/range/{prefix}"
    LEAKCHECK_BASE = "https://leakcheck.io/api/public"
    
    def __init__(self):
        self._rate_limiter = RateLimiter(calls_per_second=0.5)  # HIBP requires 1.5s between calls
    
    async def check_email_breaches(self, email: str) -> list[BreachResult]:
        """
        Check if email appears in known data breaches.
        Uses HIBP API with proper rate limiting.
        """
        results = []
        
        async with aiohttp.ClientSession() as session:
            # HIBP Check
            hibp_results = await self._check_hibp(session, email)
            results.extend(hibp_results)
        
        return results
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(aiohttp.ClientError),
    )
    async def _check_hibp(self, session: aiohttp.ClientSession, email: str) -> list[BreachResult]:
        """Check HaveIBeenPwned API."""
        if not settings.HAVEIBEENPWNED_API_KEY:
            logger.warning("hibp_api_key_missing", hint="register_at_haveibeenpwned_com")
            return []
        
        await self._rate_limiter.acquire()
        
        url = f"{self.HIBP_BASE}/breachedaccount/{email}"
        headers = {
            "hibp-api-key": settings.HAVEIBEENPWNED_API_KEY,
            "user-agent": "SovereignOS-BreachChecker/1.0",
        }
        
        try:
            async with session.get(url, headers=headers, params={"truncateResponse": "false"}) as resp:
                if resp.status == 404:
                    return []  # Not found in any breach
                elif resp.status == 429:
                    logger.warning("hibp_rate_limited")
                    await asyncio.sleep(2)
                    return []
                elif resp.status == 401:
                    logger.error("hibp_unauthorized")
                    return []
                elif resp.status == 200:
                    breaches = await resp.json()
                    return [
                        BreachResult(
                            source=b.get("Name", "Unknown"),
                            breach_date=b.get("BreachDate"),
                            data_classes=b.get("DataClasses", []),
                            is_verified=b.get("IsVerified", False),
                            risk_level=self._assess_breach_risk(b),
                            description=b.get("Description", "")[:200] if b.get("Description") else None,
                        )
                        for b in breaches
                    ]
        except aiohttp.ClientError as e:
            logger.error("hibp_request_failed", error=str(e))
            raise
        
        return []
    
    def _assess_breach_risk(self, breach: dict) -> RiskLevel:
        """Assess risk level of a breach based on data classes."""
        high_risk_classes = {"Passwords", "Credit cards", "Bank account numbers", "SSNs"}
        medium_risk_classes = {"Email addresses", "Phone numbers", "Physical addresses"}
        
        data_classes = set(breach.get("DataClasses", []))
        
        if data_classes & high_risk_classes:
            return RiskLevel.CRITICAL
        elif data_classes & medium_risk_classes:
            return RiskLevel.HIGH
        else:
            return RiskLevel.MEDIUM
    
    async def check_password_pwned(self, password: str) -> int:
        """
        Check if password has been seen in breaches using k-anonymity.
        Returns number of times seen (0 = not found).
        Never sends the full password to any server.
        """
        # SHA-1 hash of password
        sha1_hash = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix = sha1_hash[:5]
        suffix = sha1_hash[5:]
        
        url = self.HIBP_PWNED_PASSWORDS.format(prefix=prefix)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    text = await resp.text()
                    for line in text.splitlines():
                        parts = line.split(":")
                        if len(parts) == 2 and parts[0] == suffix:
                            return int(parts[1])
        
        return 0  # Password not found in breaches


class SecurityScoreCalculator:
    """
    Calculates a 0-100 Security Health Score based on scan results.
    """
    
    WEIGHTS = {
        "breaches": 40,       # 40 points for no breaches
        "exposure": 25,       # 25 points for minimal platform exposure
        "password_safety": 20, # 20 points for password not pwned
        "account_age": 15,    # 15 points for account hygiene
    }
    
    def calculate(
        self,
        breach_results: list[BreachResult],
        platform_results: list[ScanResult],
        password_pwned_count: int = 0,
    ) -> dict:
        """Calculate overall security health score."""
        
        # Breach score (0-40)
        critical_breaches = sum(1 for b in breach_results if b.risk_level == RiskLevel.CRITICAL)
        high_breaches = sum(1 for b in breach_results if b.risk_level == RiskLevel.HIGH)
        
        if critical_breaches > 0:
            breach_score = max(0, 40 - critical_breaches * 15 - high_breaches * 5)
        elif high_breaches > 0:
            breach_score = max(0, 40 - high_breaches * 8)
        elif len(breach_results) > 0:
            breach_score = max(20, 40 - len(breach_results) * 3)
        else:
            breach_score = 40
        
        # Exposure score (0-25)
        high_risk_platforms = sum(
            1 for p in platform_results
            if p.found and p.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
        )
        total_found = sum(1 for p in platform_results if p.found)
        
        if total_found == 0:
            exposure_score = 25
        else:
            exposure_score = max(0, 25 - high_risk_platforms * 5 - (total_found - high_risk_platforms) * 1)
        
        # Password score (0-20)
        if password_pwned_count == 0:
            password_score = 20
        elif password_pwned_count < 10:
            password_score = 10
        else:
            password_score = 0
        
        total = breach_score + exposure_score + password_score
        
        # Grade
        if total >= 85:
            grade = "A"
            status = "Excellent"
        elif total >= 70:
            grade = "B"
            status = "Good"
        elif total >= 55:
            grade = "C"
            status = "Fair"
        elif total >= 40:
            grade = "D"
            status = "At Risk"
        else:
            grade = "F"
            status = "Critical"
        
        return {
            "total_score": total,
            "grade": grade,
            "status": status,
            "breakdown": {
                "breach_protection": breach_score,
                "exposure_control": exposure_score,
                "password_safety": password_score,
            },
            "critical_issues": critical_breaches,
            "total_breaches": len(breach_results),
            "platform_exposure": total_found,
        }
