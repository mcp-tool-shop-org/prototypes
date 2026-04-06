"""Tests for inner monologue (ambient) — ephemeral micro-utterances."""

from __future__ import annotations

import time

import pytest

from voice_soundboard_plugin.ambient import AmbientConfig, InnerMonologue, MonologueEntry
from voice_soundboard_plugin.ambient.inner_monologue import (
    DEFAULT_COOLDOWN_MS,
    DEFAULT_TTL_MS,
    MAX_MONOLOGUE_CHARS,
    redact_sensitive,
)


@pytest.fixture
def ambient_config():
    """Enabled config with short cooldown for testing."""
    return AmbientConfig(
        enabled=True,
        autospeak=False,
        ttl_ms=2000,
        cooldown_ms=50,  # short for tests
        while_speaking="drop",
    )


@pytest.fixture
def monologue(ambient_config):
    return InnerMonologue(ambient_config)


class TestAmbientConfig:
    def test_defaults(self):
        config = AmbientConfig()
        assert config.enabled is False
        assert config.autospeak is False
        assert config.ttl_ms == DEFAULT_TTL_MS
        assert config.cooldown_ms == DEFAULT_COOLDOWN_MS
        assert config.while_speaking == "drop"

    def test_from_env_disabled(self, monkeypatch):
        monkeypatch.delenv("VOICE_SOUNDBOARD_AMBIENT_ENABLED", raising=False)
        config = AmbientConfig.from_env()
        assert config.enabled is False

    def test_from_env_enabled(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_AMBIENT_ENABLED", "1")
        monkeypatch.setenv("VOICE_SOUNDBOARD_AMBIENT_AUTOSPEAK", "true")
        monkeypatch.setenv("VOICE_SOUNDBOARD_AMBIENT_TTL_MS", "5000")
        config = AmbientConfig.from_env()
        assert config.enabled is True
        assert config.autospeak is True
        assert config.ttl_ms == 5000

    def test_from_env_invalid_while_speaking(self, monkeypatch):
        monkeypatch.setenv("VOICE_SOUNDBOARD_AMBIENT_WHILE_SPEAKING", "invalid")
        config = AmbientConfig.from_env()
        assert config.while_speaking == "drop"


class TestInnerMonologue:
    def test_submit_when_enabled(self, monologue):
        entry = monologue.submit("Test thought")
        assert entry is not None
        assert entry.text == "Test thought"
        assert entry.category == "general"

    def test_submit_when_disabled(self):
        config = AmbientConfig(enabled=False)
        monologue = InnerMonologue(config)
        entry = monologue.submit("Test thought")
        assert entry is None

    def test_submit_empty_text(self, monologue):
        assert monologue.submit("") is None
        assert monologue.submit("   ") is None

    def test_submit_with_category(self, monologue):
        entry = monologue.submit("Debug info", category="debug")
        assert entry.category == "debug"

    def test_rate_limiting(self, ambient_config):
        """Second submit within cooldown is rejected."""
        config = AmbientConfig(enabled=True, cooldown_ms=10000)
        monologue = InnerMonologue(config)
        entry1 = monologue.submit("First thought")
        assert entry1 is not None
        entry2 = monologue.submit("Second thought")
        assert entry2 is None  # rate-limited

    def test_cooldown_expires(self, monologue):
        """After cooldown, submit succeeds again."""
        entry1 = monologue.submit("First")
        assert entry1 is not None
        time.sleep(0.06)  # cooldown is 50ms in fixture
        entry2 = monologue.submit("Second")
        assert entry2 is not None

    def test_truncation(self, monologue):
        long_text = "x" * (MAX_MONOLOGUE_CHARS + 100)
        entry = monologue.submit(long_text)
        assert entry is not None
        assert len(entry.text) <= MAX_MONOLOGUE_CHARS

    def test_peek(self, monologue):
        monologue.submit("Peeked thought")
        entry = monologue.peek()
        assert entry is not None
        assert entry.text == "Peeked thought"
        # Peek doesn't remove
        assert monologue.peek() is not None

    def test_drain(self, monologue):
        monologue.submit("First thought")
        time.sleep(0.06)
        monologue.submit("Second thought")
        entries = monologue.drain()
        assert len(entries) == 2
        # Buffer is now empty
        assert monologue.peek() is None

    def test_clear(self, monologue):
        monologue.submit("To be cleared")
        monologue.clear()
        assert monologue.peek() is None

    def test_ttl_expiry(self):
        """Entries expire after TTL."""
        config = AmbientConfig(enabled=True, ttl_ms=50, cooldown_ms=0)
        monologue = InnerMonologue(config)
        entry = monologue.submit("Short-lived")
        assert entry is not None
        time.sleep(0.06)
        assert monologue.peek() is None  # expired


class TestRedaction:
    def test_windows_path(self):
        result = redact_sensitive(r"Found at C:\Users\admin\secret.txt")
        assert "[PATH]" in result
        assert "admin" not in result

    def test_unix_path(self):
        result = redact_sensitive("File at /home/user/project/config.yaml")
        assert "[PATH]" in result
        assert "user" not in result

    def test_api_token_sk(self):
        result = redact_sensitive("Found sk-abcdefghij1234567890abcdef in logs")
        assert "[TOKEN]" in result
        assert "sk-" not in result

    def test_api_token_ghp(self):
        result = redact_sensitive("Found ghp_abcdefghij1234567890abcdef in logs")
        assert "[TOKEN]" in result

    def test_password_assignment(self):
        result = redact_sensitive("password=mysecretpass123")
        assert "[REDACTED]" in result
        assert "mysecretpass123" not in result

    def test_ip_address(self):
        result = redact_sensitive("Server at 192.168.1.100")
        assert "[IP]" in result
        assert "192.168" not in result

    def test_plain_text_unchanged(self):
        text = "This is normal text with no secrets"
        assert redact_sensitive(text) == text

    def test_multiple_patterns(self):
        text = r"key=abc123 at C:\Users\test with 10.0.0.1"
        result = redact_sensitive(text)
        assert "[REDACTED]" in result
        assert "[PATH]" in result
        assert "[IP]" in result
