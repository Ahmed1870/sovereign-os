"""
Sovereign OS - Structured Logging
Privacy-aware: sensitive fields are automatically redacted.
"""
import structlog
import logging
import sys
from typing import Any, MutableMapping

SENSITIVE_FIELDS = frozenset({
    "password", "token", "secret", "key", "email",
    "phone", "ssn", "credit_card", "api_key", "access_token",
})


def redact_sensitive(logger, method, event_dict: MutableMapping[str, Any]):
    """Structlog processor: redact sensitive fields before logging."""
    for field in SENSITIVE_FIELDS:
        if field in event_dict:
            value = str(event_dict[field])
            if len(value) > 4:
                event_dict[field] = value[:2] + "****" + value[-2:]
            else:
                event_dict[field] = "****"
    return event_dict


def setup_logging():
    """Configure structlog with JSON output for production."""
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        redact_sensitive,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(),
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)
