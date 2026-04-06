"""
Timeline analyzer for Witness events.

This module analyzes sequences of events to detect timeline anomalies
and produce audit flags. Timeline analysis is separate from cryptographic
verification - crypto failures are fatal, timeline flags are informational.

Flags (from IMPLEMENTATION_NOTES.md):
- CONTINUITY_BROKEN: Rotation is recovery mode, or continuity rotation not signed by old key
- TEMPORAL_ANOMALY_AFTER_ROTATION: Event signed by key K has occurred_at after K was rotated away
- KEY_REACTIVATION: A previously-rotated-away key appears as new_key_id in a later rotation
- ROTATION_ACTOR_TYPE_UNEXPECTED: action=witness.rotate_key but actor.type != "system"
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from witness.crypto import verify_event, generate_key_id
from witness.models import VerifyResult, VerifyStatus


# Flag constants (LOCKED - match expected_flags.json)
FLAG_CONTINUITY_BROKEN = "CONTINUITY_BROKEN"
FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION = "TEMPORAL_ANOMALY_AFTER_ROTATION"
FLAG_KEY_REACTIVATION = "KEY_REACTIVATION"
FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED = "ROTATION_ACTOR_TYPE_UNEXPECTED"


@dataclass
class KeyRotation:
    """Record of a key rotation event."""
    event_id: str
    occurred_at: str
    old_key_id: str
    new_key_id: str
    mode: str  # "continuity" or "recovery"
    signing_key_id: str  # The key that signed this rotation event
    actor_type: str


@dataclass
class TimelineState:
    """
    State accumulated during timeline analysis.

    Tracks key lifecycle to detect anomalies.
    """
    # Keys that have been rotated away (old_key_id in a rotation)
    retired_keys: Dict[str, str] = field(default_factory=dict)  # key_id -> timestamp when retired

    # Keys that have been introduced (new_key_id in a rotation)
    introduced_keys: Set[str] = field(default_factory=set)

    # All rotation events in order
    rotations: List[KeyRotation] = field(default_factory=list)


@dataclass
class TimelineAnalysis:
    """Result of analyzing a single event against timeline state."""
    event_id: str
    flags: List[str] = field(default_factory=list)
    crypto_result: Optional[VerifyResult] = None

    @property
    def status(self) -> VerifyStatus:
        """Determine overall status."""
        if self.crypto_result and not self.crypto_result.ok:
            return VerifyStatus.FAILED_CRYPTO
        if self.flags:
            return VerifyStatus.VERIFIED_WITH_FLAGS
        return VerifyStatus.VERIFIED

    @property
    def exit_code(self) -> int:
        """Exit code for CLI."""
        if self.status == VerifyStatus.VERIFIED:
            return 0
        elif self.status == VerifyStatus.VERIFIED_WITH_FLAGS:
            return 2
        else:
            return 3


def _get_signing_key_id(event: Dict[str, Any]) -> str:
    """Extract the signing key ID from an event."""
    import base64
    import hashlib

    signing = event.get("signing", {})
    public_key_b64 = signing.get("public_key", "")

    if not public_key_b64:
        return ""

    try:
        pub_bytes = base64.b64decode(public_key_b64)
        return hashlib.sha256(pub_bytes).hexdigest()
    except Exception:
        return ""


def _is_rotation_event(event: Dict[str, Any]) -> bool:
    """Check if an event is a key rotation."""
    return event.get("action") == "witness.rotate_key"


def _get_rotation_info(event: Dict[str, Any]) -> Optional[KeyRotation]:
    """Extract rotation information from an event."""
    if not _is_rotation_event(event):
        return None

    context = event.get("context", {})
    rotation = context.get("rotation", {})

    if not rotation:
        return None

    return KeyRotation(
        event_id=event.get("event_id", ""),
        occurred_at=event.get("occurred_at", ""),
        old_key_id=rotation.get("old_key_id", ""),
        new_key_id=rotation.get("new_key_id", ""),
        mode=rotation.get("mode", ""),
        signing_key_id=_get_signing_key_id(event),
        actor_type=event.get("actor", {}).get("type", ""),
    )


def analyze_event(
    event: Dict[str, Any],
    state: TimelineState,
    *,
    verify_crypto: bool = True,
) -> TimelineAnalysis:
    """
    Analyze a single event against the current timeline state.

    Args:
        event: The event to analyze
        state: Current timeline state (will be mutated)
        verify_crypto: Whether to also verify cryptographic integrity

    Returns:
        TimelineAnalysis with flags and crypto result
    """
    flags: List[str] = []
    crypto_result = None

    event_id = event.get("event_id", "unknown")
    occurred_at = event.get("occurred_at", "")
    signing_key_id = _get_signing_key_id(event)
    actor_type = event.get("actor", {}).get("type", "")

    # Cryptographic verification (optional but recommended)
    if verify_crypto:
        crypto_result = verify_event(event)
        if not crypto_result.ok:
            return TimelineAnalysis(
                event_id=event_id,
                flags=flags,
                crypto_result=crypto_result,
            )

    # Check if this is a rotation event
    if _is_rotation_event(event):
        rotation = _get_rotation_info(event)

        if rotation:
            # FLAG: ROTATION_ACTOR_TYPE_UNEXPECTED
            # action=witness.rotate_key but actor.type != "system"
            if actor_type != "system":
                flags.append(FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED)

            # FLAG: CONTINUITY_BROKEN
            # Recovery mode breaks continuity
            if rotation.mode == "recovery":
                flags.append(FLAG_CONTINUITY_BROKEN)
            # Continuity mode must be signed by old key
            elif rotation.mode == "continuity":
                if rotation.signing_key_id != rotation.old_key_id:
                    flags.append(FLAG_CONTINUITY_BROKEN)

            # FLAG: KEY_REACTIVATION
            # A key that was previously rotated away is being reintroduced
            if rotation.new_key_id in state.retired_keys:
                flags.append(FLAG_KEY_REACTIVATION)

            # Update state: track this rotation
            state.rotations.append(rotation)
            state.retired_keys[rotation.old_key_id] = rotation.occurred_at
            state.introduced_keys.add(rotation.new_key_id)

    else:
        # Non-rotation event: check for temporal anomalies

        # FLAG: TEMPORAL_ANOMALY_AFTER_ROTATION
        # Event signed by key K has occurred_at after K was rotated away
        if signing_key_id in state.retired_keys:
            retired_at = state.retired_keys[signing_key_id]
            if occurred_at > retired_at:
                flags.append(FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION)

    return TimelineAnalysis(
        event_id=event_id,
        flags=flags,
        crypto_result=crypto_result,
    )


def analyze_timeline(
    events: List[Dict[str, Any]],
    *,
    verify_crypto: bool = True,
) -> List[TimelineAnalysis]:
    """
    Analyze a sequence of events for timeline anomalies.

    Events should be in chronological order by occurred_at.

    Args:
        events: List of events to analyze
        verify_crypto: Whether to verify cryptographic integrity

    Returns:
        List of TimelineAnalysis results, one per event
    """
    state = TimelineState()
    results = []

    for event in events:
        analysis = analyze_event(event, state, verify_crypto=verify_crypto)
        results.append(analysis)

    return results


def analyze_single_event(
    event: Dict[str, Any],
    prior_events: Optional[List[Dict[str, Any]]] = None,
    *,
    verify_crypto: bool = True,
) -> TimelineAnalysis:
    """
    Analyze a single event with optional prior context.

    This is useful when you have one event but need timeline context
    from previous events to properly analyze it.

    Args:
        event: The event to analyze
        prior_events: Optional list of events that occurred before this one
        verify_crypto: Whether to verify cryptographic integrity

    Returns:
        TimelineAnalysis for the target event
    """
    state = TimelineState()

    # Build state from prior events (without collecting their results)
    if prior_events:
        for prior in prior_events:
            analyze_event(prior, state, verify_crypto=False)

    # Analyze the target event
    return analyze_event(event, state, verify_crypto=verify_crypto)
