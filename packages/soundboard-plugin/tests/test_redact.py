"""Tests for shared redaction utility."""

from __future__ import annotations

from voice_soundboard_plugin.security.redact import redact_sensitive


class TestRedactSensitive:
    """Sensitive pattern replacement."""

    def test_windows_path(self):
        result = redact_sensitive(r"Found at C:\Users\admin\secret.txt")
        assert "[PATH]" in result
        assert "admin" not in result

    def test_unix_path(self):
        result = redact_sensitive("File at /home/user/project/config.yaml")
        assert "[PATH]" in result
        assert "user" not in result

    def test_sk_token(self):
        result = redact_sensitive("Found sk-abcdefghij1234567890abcdef in logs")
        assert "[TOKEN]" in result
        assert "sk-" not in result

    def test_ghp_token(self):
        result = redact_sensitive("Found ghp_abcdefghij1234567890abcdef in logs")
        assert "[TOKEN]" in result
        assert "ghp_" not in result

    def test_password_key_value(self):
        result = redact_sensitive("password=mysecretpass123")
        assert "[REDACTED]" in result
        assert "mysecretpass123" not in result

    def test_ip_address(self):
        result = redact_sensitive("Server at 192.168.1.100")
        assert "[IP]" in result
        assert "192.168.1.100" not in result

    def test_plain_text_unchanged(self):
        text = "Hello, this is a normal sentence about coding."
        assert redact_sensitive(text) == text

    def test_multiple_patterns(self):
        text = r"Error at C:\Users\dev\app.py, server 10.0.0.1, token=abc123"
        result = redact_sensitive(text)
        assert "[PATH]" in result
        assert "[IP]" in result
        assert "[REDACTED]" in result
