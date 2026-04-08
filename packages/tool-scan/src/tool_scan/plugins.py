"""
Rule Plugin System
==================

Extension point for custom security rules, compliance checks, and quality validators.

Plugins are Python modules or classes that implement one or more of:
- SecurityRulePlugin: Custom threat detection patterns
- ComplianceRulePlugin: Custom compliance checks
- QualityRulePlugin: Custom quality validators

Discovery:
- Entry points: ``tool_scan.plugins`` group
- Programmatic: ``PluginRegistry.register()``
- Directory: ``--plugin-dir`` CLI flag (loads .py files)

Usage:
    from tool_scan.plugins import PluginRegistry, SecurityRulePlugin

    class MyRule(SecurityRulePlugin):
        name = "my-org-rules"
        version = "1.0.0"

        def get_threat_patterns(self):
            return [
                ThreatPatternSpec(
                    pattern=r"internal\\.corp\\.com",
                    category=ThreatCategory.DATA_EXFILTRATION,
                    severity=ThreatSeverity.HIGH,
                    title="Internal domain in tool definition",
                    description="Tool references internal corporate domain",
                ),
            ]

    registry = PluginRegistry()
    registry.register(MyRule())
"""

from __future__ import annotations

import importlib
import importlib.util
import sys
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .compliance_checker import ComplianceLevel
from .security_scanner import ThreatCategory, ThreatSeverity


@dataclass
class ThreatPatternSpec:
    """Specification for a custom threat detection pattern.

    Attributes:
        pattern: Regex pattern string (will be compiled with re.IGNORECASE)
        category: Threat category
        severity: Threat severity level
        title: Short title for the threat
        description: Detailed description
        mitigation: Optional remediation guidance
        cwe_id: Optional CWE identifier
        owasp_id: Optional OWASP identifier
    """

    pattern: str
    category: ThreatCategory
    severity: ThreatSeverity
    title: str
    description: str
    mitigation: str | None = None
    cwe_id: str | None = None
    owasp_id: str | None = None


@dataclass
class ComplianceCheckSpec:
    """Specification for a custom compliance check.

    Attributes:
        id: Unique check identifier (e.g., "MYORG-001")
        name: Human-readable check name
        level: Compliance level (required/recommended/optional)
        check_fn: Function that takes a tool dict and returns (status, message, details)
        spec_reference: Optional link to spec or docs
    """

    id: str
    name: str
    level: ComplianceLevel
    check_fn: Any  # Callable[[dict[str, Any]], tuple[ComplianceStatus, str, str | None]]
    spec_reference: str | None = None


@dataclass
class QualityCheckSpec:
    """Specification for a custom quality check.

    Attributes:
        id: Unique check identifier
        name: Human-readable check name
        check_fn: Function that takes a tool dict and returns (score_deduction, message)
                   score_deduction is 0-100 (points to subtract)
        description: What this check validates
    """

    id: str
    name: str
    check_fn: Any  # Callable[[dict[str, Any]], tuple[float, str | None]]
    description: str = ""


class SecurityRulePlugin(ABC):
    """Base class for security rule plugins.

    Implement this to add custom threat detection patterns.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name (e.g., 'my-org-security-rules')."""
        ...

    @property
    @abstractmethod
    def version(self) -> str:
        """Plugin version string."""
        ...

    @abstractmethod
    def get_threat_patterns(self) -> list[ThreatPatternSpec]:
        """Return custom threat detection patterns."""
        ...

    @property
    def description(self) -> str:
        """Optional description of what this plugin checks."""
        return ""


class ComplianceRulePlugin(ABC):
    """Base class for compliance rule plugins.

    Implement this to add custom compliance checks.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name."""
        ...

    @property
    @abstractmethod
    def version(self) -> str:
        """Plugin version string."""
        ...

    @abstractmethod
    def get_compliance_checks(self) -> list[ComplianceCheckSpec]:
        """Return custom compliance checks."""
        ...

    @property
    def description(self) -> str:
        """Optional description."""
        return ""


class QualityRulePlugin(ABC):
    """Base class for quality rule plugins.

    Implement this to add custom quality validators.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        """Plugin name."""
        ...

    @property
    @abstractmethod
    def version(self) -> str:
        """Plugin version string."""
        ...

    @abstractmethod
    def get_quality_checks(self) -> list[QualityCheckSpec]:
        """Return custom quality checks."""
        ...

    @property
    def description(self) -> str:
        """Optional description."""
        return ""


@dataclass
class PluginInfo:
    """Metadata about a loaded plugin."""

    name: str
    version: str
    plugin_type: str  # "security", "compliance", "quality"
    description: str
    source: str  # "entrypoint", "register", "directory"


class PluginRegistry:
    """Central registry for rule plugins.

    Discovers and manages security, compliance, and quality plugins.

    Usage:
        registry = PluginRegistry()

        # Programmatic registration
        registry.register(MySecurityPlugin())

        # Load from directory
        registry.load_directory("/path/to/plugins/")

        # Load from entry points (pip-installed packages)
        registry.discover_entry_points()

        # Get all patterns/checks
        patterns = registry.get_all_threat_patterns()
        checks = registry.get_all_compliance_checks()
    """

    def __init__(self) -> None:
        self._security_plugins: list[SecurityRulePlugin] = []
        self._compliance_plugins: list[ComplianceRulePlugin] = []
        self._quality_plugins: list[QualityRulePlugin] = []
        self._plugin_info: list[PluginInfo] = []

    def register(
        self,
        plugin: SecurityRulePlugin | ComplianceRulePlugin | QualityRulePlugin,
        source: str = "register",
    ) -> None:
        """Register a plugin instance.

        Args:
            plugin: Plugin instance to register
            source: How the plugin was discovered
        """
        if isinstance(plugin, SecurityRulePlugin):
            self._security_plugins.append(plugin)
            self._plugin_info.append(
                PluginInfo(
                    name=plugin.name,
                    version=plugin.version,
                    plugin_type="security",
                    description=plugin.description,
                    source=source,
                )
            )
        elif isinstance(plugin, ComplianceRulePlugin):
            self._compliance_plugins.append(plugin)
            self._plugin_info.append(
                PluginInfo(
                    name=plugin.name,
                    version=plugin.version,
                    plugin_type="compliance",
                    description=plugin.description,
                    source=source,
                )
            )
        elif isinstance(plugin, QualityRulePlugin):
            self._quality_plugins.append(plugin)
            self._plugin_info.append(
                PluginInfo(
                    name=plugin.name,
                    version=plugin.version,
                    plugin_type="quality",
                    description=plugin.description,
                    source=source,
                )
            )
        else:
            raise TypeError(
                f"Plugin must be SecurityRulePlugin, ComplianceRulePlugin, or QualityRulePlugin, "
                f"got {type(plugin).__name__}"
            )

    def discover_entry_points(self, group: str = "tool_scan.plugins") -> int:
        """Discover plugins via setuptools entry points.

        Args:
            group: Entry point group name

        Returns:
            Number of plugins loaded
        """
        loaded = 0
        try:
            from importlib.metadata import entry_points

            eps: Any
            if sys.version_info >= (3, 12):
                eps = entry_points(group=group)
            else:
                all_eps = entry_points()
                eps = all_eps.get(group, [])

            for ep in eps:
                try:
                    plugin_cls = ep.load()
                    plugin = plugin_cls()
                    self.register(plugin, source="entrypoint")
                    loaded += 1
                except Exception:
                    pass  # Skip broken plugins silently
        except Exception:
            pass  # No entry points available

        return loaded

    def load_directory(self, directory: str | Path) -> int:
        """Load plugin modules from a directory.

        Each .py file in the directory is loaded as a module. The module must
        define one or more plugin classes that are instances of the base plugin
        classes.

        Args:
            directory: Path to plugin directory

        Returns:
            Number of plugins loaded
        """
        dir_path = Path(directory)
        if not dir_path.is_dir():
            return 0

        loaded = 0
        for py_file in sorted(dir_path.glob("*.py")):
            if py_file.name.startswith("_"):
                continue

            try:
                module_name = f"tool_scan_plugin_{py_file.stem}"
                spec = importlib.util.spec_from_file_location(module_name, py_file)
                if spec is None or spec.loader is None:
                    continue

                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)

                # Find plugin classes in the module
                for attr_name in dir(module):
                    attr = getattr(module, attr_name)
                    if (
                        isinstance(attr, type)
                        and attr not in (SecurityRulePlugin, ComplianceRulePlugin, QualityRulePlugin)
                        and issubclass(
                            attr,
                            (SecurityRulePlugin, ComplianceRulePlugin, QualityRulePlugin),
                        )
                    ):
                        try:
                            instance = attr()
                            self.register(instance, source="directory")
                            loaded += 1
                        except Exception:
                            pass  # Skip broken plugins
            except Exception:
                pass  # Skip broken files

        return loaded

    def get_all_threat_patterns(self) -> list[ThreatPatternSpec]:
        """Get all custom threat patterns from registered security plugins."""
        patterns: list[ThreatPatternSpec] = []
        for plugin in self._security_plugins:
            patterns.extend(plugin.get_threat_patterns())
        return patterns

    def get_all_compliance_checks(self) -> list[ComplianceCheckSpec]:
        """Get all custom compliance checks from registered plugins."""
        checks: list[ComplianceCheckSpec] = []
        for plugin in self._compliance_plugins:
            checks.extend(plugin.get_compliance_checks())
        return checks

    def get_all_quality_checks(self) -> list[QualityCheckSpec]:
        """Get all custom quality checks from registered plugins."""
        checks: list[QualityCheckSpec] = []
        for plugin in self._quality_plugins:
            checks.extend(plugin.get_quality_checks())
        return checks

    @property
    def plugins(self) -> list[PluginInfo]:
        """List all registered plugins."""
        return list(self._plugin_info)

    @property
    def security_plugins(self) -> list[SecurityRulePlugin]:
        """List registered security plugins."""
        return list(self._security_plugins)

    @property
    def compliance_plugins(self) -> list[ComplianceRulePlugin]:
        """List registered compliance plugins."""
        return list(self._compliance_plugins)

    @property
    def quality_plugins(self) -> list[QualityRulePlugin]:
        """List registered quality plugins."""
        return list(self._quality_plugins)

    def clear(self) -> None:
        """Remove all registered plugins."""
        self._security_plugins.clear()
        self._compliance_plugins.clear()
        self._quality_plugins.clear()
        self._plugin_info.clear()
