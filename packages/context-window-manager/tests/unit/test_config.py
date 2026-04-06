"""
Unit tests for configuration module.

Tests settings loading, validation, and environment variable handling.
"""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest

from context_window_manager.config import (
    LogLevel,
    ResourceLimits,
    SecurityConfig,
    Settings,
    StorageConfig,
    VLLMConfig,
    get_settings,
    load_settings,
    reset_settings,
)


class TestLogLevel:
    """Tests for LogLevel enum."""

    def test_all_levels_defined(self):
        """Should have all standard log levels."""
        assert LogLevel.DEBUG.value == "DEBUG"
        assert LogLevel.INFO.value == "INFO"
        assert LogLevel.WARNING.value == "WARNING"
        assert LogLevel.ERROR.value == "ERROR"
        assert LogLevel.CRITICAL.value == "CRITICAL"


class TestVLLMConfig:
    """Tests for VLLMConfig."""

    def test_default_values(self):
        """Should have sensible defaults."""
        config = VLLMConfig()

        assert config.url == "http://localhost:8000"
        assert config.timeout == 60.0
        assert config.max_connections == 10
        assert config.verify_ssl is True
        assert config.api_key is None

    def test_custom_values(self):
        """Should accept custom values."""
        config = VLLMConfig(
            url="http://vllm.example.com:9000",
            timeout=30.0,
            max_connections=20,
            verify_ssl=False,
            api_key="secret-key",
        )

        assert config.url == "http://vllm.example.com:9000"
        assert config.timeout == 30.0
        assert config.max_connections == 20
        assert config.verify_ssl is False
        assert config.api_key == "secret-key"

    def test_invalid_timeout_too_low(self):
        """Should reject timeout below minimum."""
        with pytest.raises(ValueError):
            VLLMConfig(timeout=0.0)

    def test_invalid_max_connections_zero(self):
        """Should reject zero max connections."""
        with pytest.raises(ValueError):
            VLLMConfig(max_connections=0)


class TestStorageConfig:
    """Tests for StorageConfig."""

    def test_default_values(self):
        """Should have sensible defaults."""
        config = StorageConfig()

        assert config.enable_cpu is True
        assert config.cpu_max_gb == 8.0
        assert config.enable_disk is True
        assert config.disk_max_gb == 50.0
        assert config.compression is True

    def test_path_expansion(self):
        """Should expand ~ in paths."""
        config = StorageConfig(disk_path="~/test/path")
        assert "~" not in str(config.disk_path)
        assert config.disk_path.is_absolute()


class TestSecurityConfig:
    """Tests for SecurityConfig."""

    def test_default_values(self):
        """Should have sensible defaults."""
        config = SecurityConfig()

        assert config.encryption_at_rest is False
        assert config.require_tls is True
        assert config.enable_cache_salt is True
        assert config.audit_log_retention_days == 90


class TestResourceLimits:
    """Tests for ResourceLimits."""

    def test_default_values(self):
        """Should have sensible defaults."""
        config = ResourceLimits()

        assert config.max_context_tokens == 128_000
        assert config.max_sessions == 100
        assert config.max_windows == 1000
        assert config.max_storage_gb == 100.0
        assert config.rate_limit_per_minute == 60


class TestSettings:
    """Tests for Settings (main config)."""

    def test_default_creation(self):
        """Should create with default sub-configs."""
        settings = Settings()

        assert isinstance(settings.vllm, VLLMConfig)
        assert isinstance(settings.storage, StorageConfig)
        assert isinstance(settings.security, SecurityConfig)
        assert isinstance(settings.limits, ResourceLimits)

    def test_nested_access(self):
        """Should allow nested attribute access."""
        settings = Settings()

        assert settings.vllm.url == "http://localhost:8000"
        assert settings.storage.enable_cpu is True
        assert settings.log_level == "INFO"

    def test_db_path_expansion(self):
        """Should expand ~ in db_path."""
        settings = Settings()
        assert "~" not in str(settings.db_path)


class TestLoadSettings:
    """Tests for load_settings function."""

    def test_load_defaults(self):
        """Should load default settings."""
        settings = load_settings()

        assert isinstance(settings, Settings)
        assert settings.vllm.url == "http://localhost:8000"

    def test_load_from_env_vllm_url(self):
        """Should load vLLM URL from environment."""
        with patch.dict(os.environ, {"CWM_VLLM_URL": "http://custom:8000"}):
            settings = load_settings()
            assert settings.vllm.url == "http://custom:8000"

    def test_load_from_env_log_level(self):
        """Should load log level from environment."""
        with patch.dict(os.environ, {"CWM_LOG_LEVEL": "DEBUG"}):
            settings = load_settings()
            assert settings.log_level == "DEBUG"


class TestGetSettings:
    """Tests for get_settings singleton."""

    def teardown_method(self):
        """Reset settings after each test."""
        reset_settings()

    def test_returns_settings(self):
        """Should return Settings instance."""
        settings = get_settings()
        assert isinstance(settings, Settings)

    def test_singleton_behavior(self):
        """Should return same instance on multiple calls."""
        s1 = get_settings()
        s2 = get_settings()
        assert s1 is s2

    def test_reset_clears_singleton(self):
        """Should clear singleton on reset."""
        s1 = get_settings()
        reset_settings()
        s2 = get_settings()
        assert s1 is not s2
