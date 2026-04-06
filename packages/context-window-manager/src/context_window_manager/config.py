"""
Configuration management for Context Window Manager.

Supports:
- Environment variables
- Configuration files (YAML/TOML)
- Pydantic validation
- Runtime updates for allowed fields
"""

from enum import Enum
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LogLevel(str, Enum):
    """Log level options."""

    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class StorageConfig(BaseSettings):
    """Storage tier configuration."""

    model_config = SettingsConfigDict(env_prefix="CWM_STORAGE_")

    # CPU tier
    enable_cpu: bool = Field(default=True, description="Enable CPU memory storage tier")
    cpu_max_gb: float = Field(
        default=8.0, description="Maximum CPU memory for KV cache (GB)"
    )

    # Disk tier
    enable_disk: bool = Field(default=True, description="Enable disk storage tier")
    disk_path: Path = Field(
        default=Path.home() / ".cwm" / "storage",
        description="Path for disk storage",
    )
    disk_max_gb: float = Field(default=50.0, description="Maximum disk storage (GB)")
    compression: bool = Field(
        default=True, description="Enable compression for disk storage"
    )

    # Redis tier (optional)
    redis_url: str | None = Field(
        default=None, description="Redis URL for distributed storage"
    )
    redis_prefix: str = Field(default="cwm:", description="Redis key prefix")

    @field_validator("disk_path", mode="before")
    @classmethod
    def expand_path(cls, v: str | Path) -> Path:
        """Expand user home directory in paths."""
        return Path(v).expanduser()


class VLLMConfig(BaseSettings):
    """vLLM client configuration."""

    model_config = SettingsConfigDict(env_prefix="CWM_VLLM_")

    url: str = Field(default="http://localhost:8000", description="vLLM server URL")
    timeout: float = Field(
        default=60.0, ge=0.1, description="Request timeout in seconds"
    )
    max_connections: int = Field(
        default=10, ge=1, description="Maximum concurrent connections"
    )
    verify_ssl: bool = Field(default=True, description="Verify SSL certificates")
    api_key: str | None = Field(default=None, description="API key if required")


class SecurityConfig(BaseSettings):
    """Security configuration."""

    model_config = SettingsConfigDict(env_prefix="CWM_SECURITY_")

    encryption_at_rest: bool = Field(
        default=False, description="Encrypt stored KV blocks"
    )
    encryption_key_file: Path | None = Field(
        default=None, description="Path to encryption key"
    )
    require_tls: bool = Field(
        default=True, description="Require TLS for remote connections"
    )
    enable_cache_salt: bool = Field(
        default=True, description="Enable session isolation via cache_salt"
    )
    audit_log_path: Path | None = Field(default=None, description="Path for audit logs")
    audit_log_retention_days: int = Field(
        default=90, description="Audit log retention period"
    )


class ResourceLimits(BaseSettings):
    """Resource limit configuration."""

    model_config = SettingsConfigDict(env_prefix="CWM_LIMITS_")

    max_context_tokens: int = Field(
        default=128_000, description="Maximum context size in tokens"
    )
    max_sessions: int = Field(default=100, description="Maximum concurrent sessions")
    max_windows: int = Field(default=1000, description="Maximum stored windows")
    max_storage_gb: float = Field(
        default=100.0, description="Maximum total storage (GB)"
    )
    rate_limit_per_minute: int = Field(
        default=60, description="Rate limit for operations"
    )


class Settings(BaseSettings):
    """Main application settings."""

    model_config = SettingsConfigDict(
        env_prefix="CWM_",
        env_nested_delimiter="__",
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # Database
    db_path: Path = Field(
        default=Path.home() / ".cwm" / "cwm.db",
        description="SQLite database path",
    )

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Logging level",
    )
    log_format: Literal["json", "console"] = Field(
        default="console",
        description="Log output format",
    )

    # Sub-configurations
    storage: StorageConfig = Field(default_factory=StorageConfig)
    vllm: VLLMConfig = Field(default_factory=VLLMConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    limits: ResourceLimits = Field(default_factory=ResourceLimits)

    @field_validator("db_path", mode="before")
    @classmethod
    def expand_db_path(cls, v: str | Path) -> Path:
        """Expand user home directory in paths."""
        return Path(v).expanduser()

    def ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.storage.disk_path.mkdir(parents=True, exist_ok=True)


# Alias for convenience
Config = Settings


def load_settings() -> Settings:
    """Load settings from environment and config files."""
    return Settings()


# Global settings instance (lazy loaded)
_settings: Settings | None = None


def get_settings() -> Settings:
    """Get the global settings instance (creates on first call)."""
    global _settings
    if _settings is None:
        _settings = load_settings()
    return _settings


def reset_settings() -> None:
    """Reset global settings (useful for testing)."""
    global _settings
    _settings = None
