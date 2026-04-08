"""
Target loader and fingerprinting for StressKit.

Loads targets from stresskit.targets.json and provides:
- Fingerprinting for deduplication
- Alias detection
- Fixture resolution
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class InvokeFixture:
    """A fixture for invoking a tool during checks."""
    tool: str
    args: dict[str, Any]
    candidates: list[str] = field(default_factory=list)
    expected_error: bool = False

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "InvokeFixture":
        return cls(
            tool=data["tool"],
            args=data.get("args", {}),
            candidates=data.get("candidates", []),
            expected_error=data.get("expected_error", False),
        )


@dataclass
class Fixtures:
    """Collection of invoke fixtures for a target."""
    invoke_smoke: InvokeFixture | None = None
    invoke_slow: InvokeFixture | None = None
    invoke_error: InvokeFixture | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any] | None) -> "Fixtures":
        if not data:
            return cls()
        return cls(
            invoke_smoke=InvokeFixture.from_dict(data["invoke_smoke"]) if "invoke_smoke" in data else None,
            invoke_slow=InvokeFixture.from_dict(data["invoke_slow"]) if "invoke_slow" in data else None,
            invoke_error=InvokeFixture.from_dict(data["invoke_error"]) if "invoke_error" in data else None,
        )


@dataclass
class TargetConfig:
    """Configuration for an MCP server target."""
    name: str
    display_name: str
    transport_kind: str
    command: str | None = None
    args: list[str] = field(default_factory=list)
    url: str | None = None
    cwd: str | None = None
    env: dict[str, str] = field(default_factory=dict)
    aliases: list[str] = field(default_factory=list)
    fixtures: Fixtures = field(default_factory=Fixtures)
    tags: list[str] = field(default_factory=list)
    enabled: bool = True
    timeout_ms: int = 30000

    # Computed
    fingerprint: str = ""

    def __post_init__(self):
        if not self.fingerprint:
            self.fingerprint = self._compute_fingerprint()

    def _compute_fingerprint(self) -> str:
        """Compute a stable fingerprint for deduplication.

        Fingerprint is based on:
        - transport kind
        - normalized command (resolved to absolute path)
        - normalized args (trimmed, sorted for comparison)
        - cwd (if set)
        - env keys (sorted, not values - same keys = same behavior category)
        - url (for http transports)
        """
        parts = [self.transport_kind]

        if self.transport_kind == "stdio":
            # Resolve command to absolute path if possible
            resolved_cmd = self._resolve_command(self.command) if self.command else ""
            parts.append(resolved_cmd)
            # Normalize args: strip whitespace, join
            parts.append("|".join(a.strip() for a in self.args))
            if self.cwd:
                parts.append(os.path.normpath(self.cwd))
            # Include env keys (sorted) - prevents collisions when same command has different env
            if self.env:
                parts.append("|".join(sorted(self.env.keys())))
        else:
            # HTTP transports use URL
            parts.append(self.url or "")

        # Create hash
        fingerprint_str = "\x00".join(parts)
        return hashlib.sha256(fingerprint_str.encode()).hexdigest()[:16]

    def _resolve_command(self, command: str) -> str:
        """Resolve command to absolute path if it exists."""
        if not command:
            return ""

        # If already absolute, normalize it
        if os.path.isabs(command):
            return os.path.normpath(command)

        # Try to find in PATH
        resolved = shutil.which(command)
        if resolved:
            return os.path.normpath(resolved)

        # Return as-is if not found
        return command

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TargetConfig":
        transport = data.get("transport", {})
        return cls(
            name=data["name"],
            display_name=data["display_name"],
            transport_kind=transport.get("kind", "stdio"),
            command=transport.get("command"),
            args=transport.get("args", []),
            url=transport.get("url"),
            cwd=data.get("cwd"),
            env=data.get("env", {}),
            aliases=data.get("aliases", []),
            fixtures=Fixtures.from_dict(data.get("fixtures")),
            tags=data.get("tags", []),
            enabled=data.get("enabled", True),
            timeout_ms=data.get("timeout_ms", 30000),
        )


class TargetLoader:
    """Loads and manages target configurations."""

    def __init__(self, config_path: Path | None = None):
        self.config_path = config_path
        self._targets: list[TargetConfig] = []
        self._by_name: dict[str, TargetConfig] = {}
        self._by_fingerprint: dict[str, list[TargetConfig]] = {}

    def load(self) -> None:
        """Load targets from config file."""
        if not self.config_path or not self.config_path.exists():
            return

        with open(self.config_path) as f:
            data = json.load(f)

        for target_data in data.get("targets", []):
            target = TargetConfig.from_dict(target_data)
            self._targets.append(target)
            self._by_name[target.name] = target

            # Index by fingerprint for deduplication
            if target.fingerprint not in self._by_fingerprint:
                self._by_fingerprint[target.fingerprint] = []
            self._by_fingerprint[target.fingerprint].append(target)

            # Also index aliases
            for alias in target.aliases:
                if alias not in self._by_name:
                    self._by_name[alias] = target

    @property
    def targets(self) -> list[TargetConfig]:
        """Get all loaded targets."""
        return self._targets

    def get(self, name: str) -> TargetConfig | None:
        """Get target by name or alias."""
        return self._by_name.get(name)

    def get_enabled(self) -> list[TargetConfig]:
        """Get all enabled targets."""
        return [t for t in self._targets if t.enabled]

    def get_by_tag(self, tag: str) -> list[TargetConfig]:
        """Get targets with a specific tag."""
        return [t for t in self._targets if tag in t.tags]

    def get_with_fixture(self, fixture_name: str) -> list[TargetConfig]:
        """Get targets that have a specific fixture defined."""
        result = []
        for target in self._targets:
            if fixture_name == "invoke_smoke" and target.fixtures.invoke_smoke:
                result.append(target)
            elif fixture_name == "invoke_slow" and target.fixtures.invoke_slow:
                result.append(target)
            elif fixture_name == "invoke_error" and target.fixtures.invoke_error:
                result.append(target)
        return result

    def find_duplicates(self) -> list[tuple[TargetConfig, list[TargetConfig]]]:
        """Find targets with matching fingerprints (potential duplicates).

        Returns list of (canonical_target, [alias_targets])
        """
        duplicates = []
        for fingerprint, targets in self._by_fingerprint.items():
            if len(targets) > 1:
                # First one is canonical, rest are duplicates
                duplicates.append((targets[0], targets[1:]))
        return duplicates

    def get_canonical(self, target: TargetConfig) -> TargetConfig:
        """Get the canonical target for a given target (first with same fingerprint)."""
        matches = self._by_fingerprint.get(target.fingerprint, [target])
        return matches[0]

    def is_alias_of(self, target: TargetConfig, other: TargetConfig) -> bool:
        """Check if target is an alias of other (same fingerprint, different name)."""
        return (
            target.fingerprint == other.fingerprint
            and target.name != other.name
        )


def find_targets_config() -> Path | None:
    """Find stresskit.targets.json in standard locations."""
    # Check current directory first
    cwd = Path.cwd()
    if (cwd / "stresskit.targets.json").exists():
        return cwd / "stresskit.targets.json"

    # Check parent directories up to root
    for parent in cwd.parents:
        if (parent / "stresskit.targets.json").exists():
            return parent / "stresskit.targets.json"
        # Stop at common project root indicators
        if (parent / ".git").exists() or (parent / "pyproject.toml").exists():
            break

    # Check stresskit package directory
    package_dir = Path(__file__).parent.parent.parent
    if (package_dir / "stresskit.targets.json").exists():
        return package_dir / "stresskit.targets.json"

    return None


def load_targets(config_path: Path | None = None) -> TargetLoader:
    """Load targets from config file, auto-discovering if not specified."""
    if config_path is None:
        config_path = find_targets_config()

    loader = TargetLoader(config_path)
    if config_path:
        loader.load()
    return loader
