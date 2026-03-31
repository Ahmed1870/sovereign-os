"""
Sovereign OS - Shadow Cleaner (Privacy Governor)
Generates GDPR "Right to be Forgotten" requests and privacy cleanup automation.
"""
import asyncio
import aiohttp
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field
from app.core.config import settings
import structlog

logger = structlog.get_logger()


# Known data brokers and people-search sites with their DPA contacts
DATA_BROKERS = {
    "spokeo": {
        "name": "Spokeo",
        "opt_out_url": "https://www.spokeo.com/optout",
        "privacy_email": "privacy@spokeo.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "gdpr_applicable": False,
        "removal_time_days": 30,
    },
    "whitepages": {
        "name": "WhitePages",
        "opt_out_url": "https://www.whitepages.com/suppression_requests/new",
        "privacy_email": "support@whitepages.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 30,
    },
    "intelius": {
        "name": "Intelius",
        "opt_out_url": "https://www.intelius.com/opt-out",
        "privacy_email": "privacy@intelius.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 45,
    },
    "radaris": {
        "name": "Radaris",
        "opt_out_url": "https://radaris.com/control/privacy",
        "privacy_email": "privacy@radaris.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 30,
    },
    "mylife": {
        "name": "MyLife",
        "opt_out_url": "https://www.mylife.com/ccpa/index.pubview",
        "privacy_email": "privacy@mylife.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 45,
    },
    "peoplefinder": {
        "name": "PeopleFinder",
        "opt_out_url": "https://www.peoplefinders.com/manage",
        "privacy_email": "privacy@peoplefinders.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 30,
    },
    "peekyou": {
        "name": "PeekYou",
        "opt_out_url": "https://www.peekyou.com/about/contact/optout/",
        "privacy_email": "privacy@peekyou.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 30,
    },
    "been_verified": {
        "name": "BeenVerified",
        "opt_out_url": "https://www.beenverified.com/app/optout/search",
        "privacy_email": "support@beenverified.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 30,
    },
    "truthfinder": {
        "name": "TruthFinder",
        "opt_out_url": "https://www.truthfinder.com/opt-out/",
        "privacy_email": "support@truthfinder.com",
        "dpa_jurisdiction": "US",
        "ccpa_applicable": True,
        "removal_time_days": 45,
    },
}

# EU Data Protection Authorities
EU_DPAS = {
    "DE": {"name": "BfDI", "url": "https://www.bfdi.bund.de", "email": "poststelle@bfdi.bund.de"},
    "FR": {"name": "CNIL", "url": "https://www.cnil.fr", "email": "webmaster@cnil.fr"},
    "GB": {"name": "ICO", "url": "https://ico.org.uk", "email": "icocasework@ico.org.uk"},
    "IT": {"name": "Garante", "url": "https://www.garanteprivacy.it"},
    "ES": {"name": "AEPD", "url": "https://www.aepd.es"},
    "NL": {"name": "AP", "url": "https://www.autoriteitpersoonsgegevens.nl"},
    "default": {"name": "EDPB", "url": "https://edpb.europa.eu"},
}


@dataclass
class GDPRRequest:
    """Generated GDPR/CCPA deletion request."""
    broker_name: str
    broker_id: str
    email_subject: str
    email_body: str
    opt_out_url: str
    privacy_email: str
    estimated_removal_days: int
    legal_basis: str
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class ShadowCleaner:
    """
    Privacy Governor - Generates automated deletion requests.
    Implements GDPR Article 17 (Right to Erasure) & CCPA.
    """
    
    def generate_gdpr_requests(
        self,
        full_name: str,
        email: str,
        user_location: Optional[str] = None,
        brokers: Optional[list] = None,
    ) -> list[GDPRRequest]:
        """
        Generate GDPR/CCPA deletion requests for data brokers.
        
        Returns list of email drafts ready to send.
        """
        target_brokers = brokers or list(DATA_BROKERS.keys())
        requests = []
        
        is_eu = self._is_eu_resident(user_location)
        
        for broker_id in target_brokers:
            if broker_id not in DATA_BROKERS:
                continue
            
            broker = DATA_BROKERS[broker_id]
            legal_basis = "GDPR Article 17 (Right to Erasure)" if is_eu else "CCPA Section 1798.105"
            
            subject, body = self._generate_email(
                full_name=full_name,
                email=email,
                broker=broker,
                legal_basis=legal_basis,
                is_eu=is_eu,
            )
            
            requests.append(GDPRRequest(
                broker_name=broker["name"],
                broker_id=broker_id,
                email_subject=subject,
                email_body=body,
                opt_out_url=broker.get("opt_out_url", ""),
                privacy_email=broker.get("privacy_email", ""),
                estimated_removal_days=broker.get("removal_time_days", 30),
                legal_basis=legal_basis,
            ))
        
        logger.info(
            "gdpr_requests_generated",
            count=len(requests),
            is_eu=is_eu,
        )
        
        return requests
    
    def _generate_email(
        self,
        full_name: str,
        email: str,
        broker: dict,
        legal_basis: str,
        is_eu: bool,
    ) -> tuple[str, str]:
        """Generate formal deletion request email."""
        
        subject = f"Data Deletion Request Under {legal_basis.split('(')[0].strip()} - {full_name}"
        
        if is_eu:
            body = f"""Dear Data Protection Officer,

I am writing to exercise my right to erasure under the General Data Protection Regulation (GDPR), Article 17.

**Subject of Request:** Immediate deletion of all personal data

**Data Subject Information:**
- Full Name: {full_name}
- Email Address: {email}
- Date of Request: {datetime.utcnow().strftime("%B %d, %Y")}

**Legal Basis for Request:**
Under GDPR Article 17(1), I have the right to have my personal data erased without undue delay. I hereby request that {broker['name']} ("the Controller") immediately delete all personal data you hold relating to me, including but not limited to:

- Full name and aliases
- Email addresses
- Phone numbers
- Physical addresses (current and historical)
- Social media profiles
- Financial information
- Any other personal identifiers

**Grounds for Erasure:**
I am invoking this right under Article 17(1)(d) as the data has been unlawfully processed and/or Article 17(1)(c) as I object to the processing under Article 21 GDPR.

**Required Actions:**
1. Confirm receipt of this request within 72 hours
2. Complete the erasure within 30 days (as required by Article 12(3))
3. Confirm in writing when deletion is complete
4. Cease any onward transfer of my data to third parties immediately

If you require identity verification, I am willing to provide a government-issued ID with sensitive details redacted. Under GDPR, you may not require excessive information for identity verification.

Failure to comply with this request may result in a complaint to the relevant Supervisory Authority and potential legal action.

Yours sincerely,
{full_name}
{email}

Note: This request is being sent pursuant to the General Data Protection Regulation (EU) 2016/679."""

        else:
            body = f"""Dear Privacy Team,

I am writing to submit a data deletion request under the California Consumer Privacy Act (CCPA), specifically pursuant to California Civil Code Section 1798.105.

**Consumer Information:**
- Full Name: {full_name}
- Email Address: {email}
- Request Date: {datetime.utcnow().strftime("%B %d, %Y")}

**Request:**
I request that {broker['name']} delete all personal information you have collected about me, including:

- Name and aliases
- Contact information (email, phone, address)
- Identifiers and profile information
- Inferences drawn from personal information
- Any other personal information as defined under CCPA

Under the CCPA (Cal. Civ. Code § 1798.105), you are required to:
1. Delete my personal information from your records
2. Direct your service providers to delete my personal information
3. Respond to this request within 45 days

Please confirm receipt of this request and provide written confirmation of deletion.

If you maintain an online opt-out portal, please also process my opt-out at: {broker.get('opt_out_url', 'your opt-out portal')}

Sincerely,
{full_name}
{email}"""

        return subject, body
    
    def _is_eu_resident(self, location: Optional[str]) -> bool:
        """Determine if user is EU resident based on location code."""
        if not location:
            return False  # Default to CCPA if unknown
        
        eu_countries = {
            "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
            "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
            "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB",  # GB post-Brexit still uses similar laws
        }
        return location.upper() in eu_countries
    
    def get_all_brokers(self) -> list[dict]:
        """Return list of all known data brokers with opt-out URLs."""
        return [
            {
                "id": broker_id,
                **{k: v for k, v in broker.items() if k != "privacy_email"},  # Exclude email from list
            }
            for broker_id, broker in DATA_BROKERS.items()
        ]


class NotificationAggregator:
    """
    Summarizes security alerts using a lightweight LLM API.
    Uses OpenRouter (free tier) for LLM access.
    """
    
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    FREE_MODEL = "mistralai/mistral-7b-instruct:free"  # Free on OpenRouter
    
    async def summarize_security_alerts(self, alerts: list[dict]) -> str:
        """
        Use LLM to summarize security alerts in plain language.
        Falls back to template-based summary if LLM unavailable.
        """
        if not alerts:
            return "✅ No security alerts detected. Your digital identity appears clean."
        
        if not settings.OPENROUTER_API_KEY:
            return self._template_summary(alerts)
        
        try:
            return await self._llm_summary(alerts)
        except Exception as e:
            logger.warning("llm_summary_failed", error=str(e), fallback="template")
            return self._template_summary(alerts)
    
    async def _llm_summary(self, alerts: list[dict]) -> str:
        """Generate LLM-powered summary via OpenRouter."""
        alerts_text = "\n".join([
            f"- {a.get('type', 'Alert')}: {a.get('description', 'Unknown issue')} (Risk: {a.get('risk_level', 'Unknown')})"
            for a in alerts[:10]  # Limit to 10 alerts to save tokens
        ])
        
        prompt = f"""You are a cybersecurity expert explaining risks to a non-technical user.

Summarize these security alerts in 3-4 clear, actionable sentences. Be direct about risks but not alarmist. Focus on what the user should do FIRST.

Security Alerts Found:
{alerts_text}

Write a concise summary (max 150 words) with:
1. Overall risk assessment (one sentence)
2. Most urgent action to take (one sentence)  
3. Secondary recommendations (one or two sentences)

Use plain language. No technical jargon."""

        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://sovereignos.app",
                },
                json={
                    "model": self.FREE_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
                timeout=aiohttp.ClientTimeout(total=15),
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"OpenRouter returned {resp.status}")
    
    def _template_summary(self, alerts: list[dict]) -> str:
        """Fallback template-based summary without LLM."""
        critical = [a for a in alerts if a.get("risk_level") in ["critical", "high"]]
        medium = [a for a in alerts if a.get("risk_level") in ["medium"]]
        
        lines = [f"⚠️ Security Alert Summary - {len(alerts)} issues found\n"]
        
        if critical:
            lines.append(f"🔴 URGENT ({len(critical)} critical issues):")
            for a in critical[:3]:
                lines.append(f"  • {a.get('description', 'Critical issue detected')}")
        
        if medium:
            lines.append(f"\n🟡 ATTENTION ({len(medium)} medium issues):")
            for a in medium[:3]:
                lines.append(f"  • {a.get('description', 'Issue detected')}")
        
        lines.append("\n📋 Recommended Actions:")
        lines.append("  1. Change passwords for breached accounts immediately")
        lines.append("  2. Enable 2FA on all critical accounts")
        lines.append("  3. Review and revoke unauthorized app permissions")
        lines.append("  4. Submit data deletion requests for exposed data")
        
        return "\n".join(lines)
