"""Configuration for Dev Brain MCP Server."""

from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class DevBrainConfig:
    """Configuration for the Dev Brain server."""

    # Server identity
    server_name: str = "dev-brain"
    server_version: str = "1.0.0"

    # Context Engine connection
    # In MCP, servers don't directly call each other.
    # The host/client mediates. But for testing, we can mock.
    context_engine_available: bool = True

    # Analysis thresholds
    min_gap_support: float = 0.05  # Minimum support to consider a pattern
    min_confidence: float = 0.5   # Minimum confidence for suggestions
    max_suggestions: int = 20     # Maximum suggestions per request

    # Test generation
    default_test_framework: str = "pytest"
    test_style: str = "unit"  # unit, integration, e2e

    # Code analysis
    complexity_threshold: int = 10  # Cyclomatic complexity threshold
    duplication_threshold: float = 0.7  # Similarity threshold for duplication

    # UX analysis
    dropoff_threshold: float = 0.3  # 30% dropoff is significant


def load_config(config_path: Optional[Path] = None) -> DevBrainConfig:
    """
    Load configuration from file or environment.

    Args:
        config_path: Optional path to config file

    Returns:
        DevBrainConfig instance
    """
    # For now, return defaults
    # Could extend to load from YAML/JSON/env vars
    return DevBrainConfig()
