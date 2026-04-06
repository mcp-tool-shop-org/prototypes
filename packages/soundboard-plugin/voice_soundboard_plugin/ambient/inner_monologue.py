"""Inner monologue — ephemeral micro-utterance buffer with rate limiting.

Design principles:
    - Never persists content (volatile, in-memory only)
    - Rate-limited: one utterance per cooldown_ms window
    - Redacts sensitive patterns (paths, tokens, passwords, IPs)
    - Thread-safe via threading.Lock
    - All env vars default OFF (opt-in only)

Env vars:
    VOICE_SOUNDBOARD_AMBIENT_ENABLED    — enable the monologue system (default: false)
    VOICE_SOUNDBOARD_AMBIENT_AUTOSPEAK  — auto-synthesize accepted entries (default: false)
    VOICE_SOUNDBOARD_AMBIENT_TTL_MS     — entry time-to-live (default: 4000)
    VOICE_SOUNDBOARD_AMBIENT_COOLDOWN_MS — min gap between entries (default: 30000)
    VOICE_SOUNDBOARD_AMBIENT_WHILE_SPEAKING — behavior if speech active: drop|queue|replace
"""

from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass, field

from voice_soundboard_plugin.security.redact import (
    REDACT_PATTERNS,
    redact_sensitive,
)

MAX_MONOLOGUE_CHARS = 500
DEFAULT_TTL_MS = 4000
DEFAULT_COOLDOWN_MS = 60000


def _truthy_env(name: str, default: str = "0") -> bool:
    v = os.environ.get(name, default)
    return str(v).strip().lower() in ("1", "true", "yes", "y", "on")


def _int_env(name: str, default: int) -> int:
    v = os.environ.get(name, "").strip()
    if v.isdigit():
        return int(v)
    return default


@dataclass
class AmbientConfig:
    """Configuration for the ambient/monologue system."""

    enabled: bool = False
    autospeak: bool = False
    ttl_ms: int = DEFAULT_TTL_MS
    cooldown_ms: int = DEFAULT_COOLDOWN_MS
    while_speaking: str = "drop"  # "drop" | "queue" | "replace"

    @classmethod
    def from_env(cls) -> AmbientConfig:
        """Load config from environment variables."""
        ws = os.environ.get("VOICE_SOUNDBOARD_AMBIENT_WHILE_SPEAKING", "drop").strip().lower()
        if ws not in ("drop", "queue", "replace"):
            ws = "drop"
        return cls(
            enabled=_truthy_env("VOICE_SOUNDBOARD_AMBIENT_ENABLED"),
            autospeak=_truthy_env("VOICE_SOUNDBOARD_AMBIENT_AUTOSPEAK"),
            ttl_ms=_int_env("VOICE_SOUNDBOARD_AMBIENT_TTL_MS", DEFAULT_TTL_MS),
            cooldown_ms=_int_env("VOICE_SOUNDBOARD_AMBIENT_COOLDOWN_MS", DEFAULT_COOLDOWN_MS),
            while_speaking=ws,
        )


@dataclass
class MonologueEntry:
    """A single monologue utterance."""

    text: str
    category: str
    timestamp: float
    ttl_ms: int
    spoken: bool = False

    @property
    def expired(self) -> bool:
        """Check if entry has exceeded its TTL."""
        age_ms = (time.time() - self.timestamp) * 1000
        return age_ms > self.ttl_ms


class InnerMonologue:
    """Ephemeral micro-utterance buffer. Thread-safe. Never persists content.

    Usage:
        monologue = InnerMonologue(config)
        entry = monologue.submit("Hmm, interesting pattern here...")
        if entry:
            # Entry accepted — optionally synthesize
            ...
    """

    def __init__(self, config: AmbientConfig | None = None):
        self._config = config or AmbientConfig()
        self._lock = threading.Lock()
        self._buffer: list[MonologueEntry] = []
        self._last_accept_time: float = 0.0
        self._muted_until: float = 0.0

    @property
    def config(self) -> AmbientConfig:
        return self._config

    def submit(
        self,
        text: str,
        category: str = "general",
    ) -> MonologueEntry | None:
        """Submit a monologue utterance. Returns entry if accepted, None if rejected.

        Rejection reasons: disabled, cooldown active, empty text, too long.
        """
        if not self._config.enabled:
            return None

        if time.time() < self._muted_until:
            return None

        if not text or not text.strip():
            return None

        # Truncate
        if len(text) > MAX_MONOLOGUE_CHARS:
            text = text[:MAX_MONOLOGUE_CHARS]

        # Redact sensitive content
        text = redact_sensitive(text)

        with self._lock:
            now = time.time()

            # Rate limit: cooldown check
            elapsed_ms = (now - self._last_accept_time) * 1000
            if self._last_accept_time > 0 and elapsed_ms < self._config.cooldown_ms:
                return None

            # Purge expired entries
            self._buffer = [e for e in self._buffer if not e.expired]

            entry = MonologueEntry(
                text=text.strip(),
                category=category,
                timestamp=now,
                ttl_ms=self._config.ttl_ms,
            )
            self._buffer.append(entry)
            self._last_accept_time = now

        return entry

    def peek(self) -> MonologueEntry | None:
        """Get the most recent non-expired entry without removing it."""
        with self._lock:
            self._buffer = [e for e in self._buffer if not e.expired]
            if self._buffer:
                return self._buffer[-1]
        return None

    def drain(self) -> list[MonologueEntry]:
        """Remove and return all non-expired entries."""
        with self._lock:
            entries = [e for e in self._buffer if not e.expired]
            self._buffer.clear()
            return entries

    def clear(self) -> None:
        """Discard all entries."""
        with self._lock:
            self._buffer.clear()
