"""
Data models for Witness events.

These models define the structure of witness events and verification results.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class VerifyStatus(Enum):
    """Verification result status."""
    VERIFIED = "VERIFIED"
    VERIFIED_WITH_FLAGS = "VERIFIED_WITH_FLAGS"
    FAILED_CRYPTO = "FAILED_CRYPTO"


@dataclass
class VerifyResult:
    """Result of verifying a witness event."""
    status: VerifyStatus
    flags: List[str] = field(default_factory=list)
    error: Optional[str] = None

    @property
    def exit_code(self) -> int:
        """
        Exit code for CLI usage.

        Returns:
            0 for VERIFIED
            2 for VERIFIED_WITH_FLAGS
            3 for FAILED_CRYPTO
        """
        if self.status == VerifyStatus.VERIFIED:
            return 0
        elif self.status == VerifyStatus.VERIFIED_WITH_FLAGS:
            return 2
        else:
            return 3

    @property
    def ok(self) -> bool:
        """True if cryptographically valid (may still have flags)."""
        return self.status in (VerifyStatus.VERIFIED, VerifyStatus.VERIFIED_WITH_FLAGS)


@dataclass
class Artifact:
    """An input or output artifact reference."""
    artifact_id: str
    media_type: str
    digest: str
    size_bytes: int
    locator: Optional[str] = None


@dataclass
class Actor:
    """The actor who performed the action."""
    type: str  # "human", "system", "agent"
    id: str  # key_id (sha256 of public key)


@dataclass
class Signing:
    """Signing information for an event."""
    algorithm: str  # "ed25519"
    public_key: str  # base64-encoded
    signature: str  # base64-encoded


@dataclass
class Integrity:
    """Integrity information for an event."""
    event_digest: str  # "sha256:<hex>"


@dataclass
class Links:
    """Event linkage information."""
    parent_event_ids: List[str] = field(default_factory=list)
    related_event_ids: List[str] = field(default_factory=list)


@dataclass
class Rotation:
    """Key rotation context."""
    old_key_id: str
    new_key_id: str
    reason: str  # "scheduled", "suspected_compromise", "device_migration", "policy", "other"
    mode: str  # "continuity" or "recovery"
    note: Optional[str] = None


@dataclass
class WitnessEvent:
    """
    A witness event record.

    This is the core data structure representing a recorded action.
    """
    schema_version: str
    event_id: str
    occurred_at: str  # ISO 8601
    actor: Actor
    intent: str
    action: str
    inputs: List[Artifact]
    outputs: List[Artifact]
    context: Dict[str, Any]
    links: Links
    signing: Signing
    integrity: Optional[Integrity] = None
    claims: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> WitnessEvent:
        """Create a WitnessEvent from a dictionary."""
        return cls(
            schema_version=data["schema_version"],
            event_id=data["event_id"],
            occurred_at=data["occurred_at"],
            actor=Actor(**data["actor"]),
            intent=data["intent"],
            action=data["action"],
            inputs=[Artifact(**a) for a in data.get("inputs", [])],
            outputs=[Artifact(**a) for a in data.get("outputs", [])],
            context=data.get("context", {}),
            links=Links(**data.get("links", {})),
            signing=Signing(**data["signing"]),
            integrity=Integrity(**data["integrity"]) if data.get("integrity") else None,
            claims=data.get("claims"),
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to a dictionary for serialization."""
        result: Dict[str, Any] = {
            "schema_version": self.schema_version,
            "event_id": self.event_id,
            "occurred_at": self.occurred_at,
            "actor": {"type": self.actor.type, "id": self.actor.id},
            "intent": self.intent,
            "action": self.action,
            "inputs": [
                {k: v for k, v in vars(a).items() if v is not None}
                for a in self.inputs
            ],
            "outputs": [
                {k: v for k, v in vars(a).items() if v is not None}
                for a in self.outputs
            ],
            "context": self.context,
            "links": {
                "parent_event_ids": self.links.parent_event_ids,
                "related_event_ids": self.links.related_event_ids,
            },
            "signing": {
                "algorithm": self.signing.algorithm,
                "public_key": self.signing.public_key,
                "signature": self.signing.signature,
            },
        }
        if self.integrity:
            result["integrity"] = {"event_digest": self.integrity.event_digest}
        if self.claims:
            result["claims"] = self.claims
        return result
