"""Integradio diagnostic health checker.

Verifies runtime dependencies, Ollama connectivity, embedding model
availability, and optional extras. Returns structured results suitable
for programmatic consumption or human-readable output.

Usage:
    from integradio.diagnose import diagnose
    report = diagnose()
    print(report)          # human-readable
    print(report.to_dict())  # JSON-serializable dict
"""

from __future__ import annotations

import importlib
import sys
from dataclasses import dataclass, field
from typing import Any

from . import __version__


@dataclass
class CheckResult:
    """Single diagnostic check result."""

    name: str
    status: str  # "ok", "warn", "fail"
    detail: str

    def to_dict(self) -> dict[str, str]:
        return {"name": self.name, "status": self.status, "detail": self.detail}


@dataclass
class DiagnoseReport:
    """Full diagnostic report."""

    version: str
    python: str
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return all(c.status != "fail" for c in self.checks)

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "python": self.python,
            "ok": self.ok,
            "checks": [c.to_dict() for c in self.checks],
        }

    def __str__(self) -> str:
        icons = {"ok": "+", "warn": "!", "fail": "x"}
        lines = [
            f"integradio {self.version} on Python {self.python}",
            "",
        ]
        for c in self.checks:
            icon = icons.get(c.status, "?")
            lines.append(f"  [{icon}] {c.name}: {c.detail}")
        lines.append("")
        lines.append(f"Overall: {'PASS' if self.ok else 'FAIL'}")
        return "\n".join(lines)


def _check_core_deps() -> list[CheckResult]:
    """Check that core dependencies are importable."""
    results = []
    for mod_name, pkg_name in [
        ("gradio", "gradio"),
        ("numpy", "numpy"),
        ("httpx", "httpx"),
        ("pandas", "pandas"),
    ]:
        try:
            mod = importlib.import_module(mod_name)
            ver = getattr(mod, "__version__", "unknown")
            results.append(CheckResult(pkg_name, "ok", f"v{ver}"))
        except ImportError:
            results.append(CheckResult(pkg_name, "fail", "not installed"))
    return results


def _check_optional_deps() -> list[CheckResult]:
    """Check optional extras."""
    results = []
    optionals = [
        ("hnswlib", "hnswlib (hnsw extra)"),
        ("fastapi", "fastapi (api extra)"),
        ("uvicorn", "uvicorn (api extra)"),
    ]
    for mod_name, label in optionals:
        try:
            mod = importlib.import_module(mod_name)
            ver = getattr(mod, "__version__", "installed")
            results.append(CheckResult(label, "ok", f"v{ver}"))
        except ImportError:
            results.append(CheckResult(label, "warn", "not installed (optional)"))
    return results


def _check_ollama() -> CheckResult:
    """Check Ollama connectivity and embedding model availability."""
    try:
        import httpx

        resp = httpx.get("http://127.0.0.1:11434/api/tags", timeout=5.0)
        if resp.status_code != 200:
            return CheckResult("ollama", "warn", f"HTTP {resp.status_code}")
        data = resp.json()
        models = [m.get("name", "") for m in data.get("models", [])]
        embed_models = [m for m in models if "embed" in m.lower()]
        if embed_models:
            return CheckResult("ollama", "ok", f"running, embed models: {', '.join(embed_models)}")
        return CheckResult(
            "ollama", "warn", f"running but no embedding models found ({len(models)} models loaded)"
        )
    except ImportError:
        return CheckResult("ollama", "fail", "httpx not available")
    except Exception:
        return CheckResult("ollama", "warn", "not reachable at 127.0.0.1:11434")


def diagnose() -> DiagnoseReport:
    """Run all diagnostic checks and return a structured report."""
    report = DiagnoseReport(
        version=__version__,
        python=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
    )
    report.checks.extend(_check_core_deps())
    report.checks.extend(_check_optional_deps())
    report.checks.append(_check_ollama())
    return report
