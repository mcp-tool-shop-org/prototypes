"""
Witness: Local-first, append-only event journal for human-AI work.

Cryptographically verifiable proof trails using canonical JSON,
SHA-256 digests, and Ed25519 signatures.
"""

__version__ = "0.1.0"

from witness.canon import canonical_json, canonical_bytes
from witness.crypto import (
    compute_event_digest,
    sign_event,
    verify_event,
    normalize_for_signing,
)
from witness.models import WitnessEvent, VerifyResult, VerifyStatus
from witness.storage import WitnessStore
from witness.timeline import (
    analyze_event,
    analyze_timeline,
    analyze_single_event,
    TimelineState,
    TimelineAnalysis,
)
from witness.testify import testify, TestimonyResult

__all__ = [
    "__version__",
    # Canonical JSON
    "canonical_json",
    "canonical_bytes",
    # Crypto
    "compute_event_digest",
    "sign_event",
    "verify_event",
    "normalize_for_signing",
    # Models
    "WitnessEvent",
    "VerifyResult",
    "VerifyStatus",
    # Storage
    "WitnessStore",
    # Timeline
    "analyze_event",
    "analyze_timeline",
    "analyze_single_event",
    "TimelineState",
    "TimelineAnalysis",
    # Testify
    "testify",
    "TestimonyResult",
]
