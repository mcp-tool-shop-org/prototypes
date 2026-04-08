#!/usr/bin/env python3
"""
StressKit CLI - MCP Server Health & Security Testing.

Answers: "Is this MCP server safe enough to run—and predictable enough to depend on—under real workloads?"

stdout is JSON only in --json mode. stderr is for human diagnostics.
"""

import argparse
import json
import platform
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from target_loader import load_targets, TargetConfig, TargetLoader
    HAS_TARGET_LOADER = True
except ImportError:
    HAS_TARGET_LOADER = False

__version__ = "1.0.1"
SCHEMA_VERSION = "0.1"

# Profile versions
PROFILES = {
    "mcp-core": "0.1",
    "mcp-ops": "0.1",
    "mcp-secure": "0.1",
    "mcp-trust": "0.1",
}


# =============================================================================
# Finding Codes (frozen for v0.1)
# =============================================================================

class FindingCode:
    """Namespaced finding codes per profile."""
    # Core protocol - existing
    HANDSHAKE_FAILED = "MCP.CORE.HANDSHAKE_FAILED"
    HANDSHAKE_TIMEOUT = "MCP.CORE.HANDSHAKE_TIMEOUT"
    LIST_TOOLS_FAILED = "MCP.CORE.LIST_TOOLS_FAILED"
    INVALID_TOOL_SCHEMA = "MCP.CORE.INVALID_TOOL_SCHEMA"
    SCHEMA_VIOLATION = "MCP.CORE.SCHEMA_VIOLATION"

    # Core protocol - new (Phase 2)
    INVOKE_SMOKE_FAILED = "MCP.CORE.INVOKE_SMOKE_FAILED"
    TIMEOUT_BEHAVIOR_BAD = "MCP.CORE.TIMEOUT_BEHAVIOR_BAD"
    SCHEMA_REJECT_INVALID_FAILED = "MCP.CORE.SCHEMA_REJECT_INVALID_FAILED"
    RECONNECT_FAILED = "MCP.CORE.RECONNECT_FAILED"
    CAPABILITY_MISMATCH = "MCP.CORE.CAPABILITY_MISMATCH"
    INVALID_ERROR_FORMAT = "MCP.CORE.INVALID_ERROR_FORMAT"

    # Ops - existing
    BASELINE_LATENCY_HIGH = "MCP.OPS.BASELINE_LATENCY_HIGH"
    P99_TOO_HIGH = "MCP.OPS.P99_TOO_HIGH"
    MEMORY_EXCEEDED = "MCP.OPS.MEMORY_EXCEEDED"
    SOAK_CRASH = "MCP.OPS.SOAK_CRASH"

    # Ops - new (Phase 2)
    CONCURRENCY_RAMP_DEGRADES = "MCP.OPS.CONCURRENCY_RAMP_DEGRADES"
    CRASH_UNDER_LOAD = "MCP.OPS.CRASH_UNDER_LOAD"

    # Security
    AUTH_REQUIRED = "MCP.SEC.AUTH_REQUIRED"
    PATH_TRAVERSAL = "MCP.SEC.PATH_TRAVERSAL"
    SHELL_INJECTION = "MCP.SEC.SHELL_INJECTION"
    SECRET_IN_LOG = "MCP.SEC.SECRET_IN_LOG"

    # Trust
    UNPINNED_SOURCE = "MCP.TRUST.UNPINNED_SOURCE"
    COMMAND_HIDDEN = "MCP.TRUST.COMMAND_HIDDEN"

    # StressKit internal
    RUNNER_FAILED = "STRESSKIT.RUNNER_FAILED"
    CONFIG_INVALID = "STRESSKIT.CONFIG_INVALID"
    TARGET_UNREACHABLE = "STRESSKIT.TARGET_UNREACHABLE"
    NO_FIXTURE = "STRESSKIT.NO_FIXTURE"


class Severity:
    """Finding severity levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class Status:
    """Run/check status."""
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    ERROR = "ERROR"
    SKIP = "SKIP"


# =============================================================================
# Data Structures
# =============================================================================

@dataclass
class Target:
    """MCP server target configuration."""
    target_id: str
    transport_kind: str  # stdio, http_sse, http
    display_name: str
    server_name: str = "unknown"
    server_version: str | None = None
    command: str | None = None
    args: list[str] = field(default_factory=list)
    cwd: str | None = None
    url: str | None = None
    fixtures: Any = None  # Fixtures object from target_loader

    def to_dict(self) -> dict[str, Any]:
        transport: dict[str, Any] = {"kind": self.transport_kind}
        if self.command:
            transport["command"] = self.command
        if self.args:
            transport["args"] = self.args
        if self.cwd:
            transport["cwd"] = self.cwd
        if self.url:
            transport["url"] = self.url

        identity: dict[str, Any] = {"server_name": self.server_name}
        if self.server_version:
            identity["server_version"] = self.server_version

        return {
            "target_id": self.target_id,
            "display_name": self.display_name,
            "transport": transport,
            "identity": identity,
        }


@dataclass
class CheckResult:
    """Result of a single check."""
    check_id: str
    status: str
    timing_ms: int = 0
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "check_id": self.check_id,
            "status": self.status,
        }
        if self.timing_ms > 0:
            result["timing_ms"] = self.timing_ms
        if self.details:
            result["details"] = self.details
        return result


@dataclass
class Finding:
    """A discovered issue."""
    finding_id: str
    code: str
    title: str
    severity: str
    target_id: str
    run_id: str
    evidence_message: str  # Required by schema
    status: str = "OPEN"
    tool: dict[str, Any] | None = None
    observations: list[dict[str, Any]] | None = None
    repro: dict[str, Any] | None = None
    references: list[dict[str, str]] | None = None

    def to_dict(self) -> dict[str, Any]:
        evidence: dict[str, Any] = {"message": self.evidence_message}
        if self.observations:
            evidence["observations"] = self.observations

        result: dict[str, Any] = {
            "finding_id": self.finding_id,
            "code": self.code,
            "title": self.title,
            "severity": self.severity,
            "status": self.status,
            "target_id": self.target_id,
            "run_id": self.run_id,
            "evidence": evidence,
        }
        if self.tool:
            result["tool"] = self.tool
        if self.repro:
            result["repro"] = self.repro
        if self.references:
            result["references"] = self.references
        return result


@dataclass
class RunResult:
    """Result of a profile run against a target."""
    run_id: str
    target_id: str
    profile_id: str
    profile_version: str
    status: str
    check_results: list[CheckResult] = field(default_factory=list)
    parameters: dict[str, Any] = field(default_factory=dict)
    timing_ms: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "run_id": self.run_id,
            "target_id": self.target_id,
            "profile_id": self.profile_id,
            "profile_version": self.profile_version,
            "status": self.status,
            "parameters": self.parameters,
            "timing_ms": {"total": self.timing_ms},
            "check_results": [c.to_dict() for c in self.check_results],
        }


# =============================================================================
# Report Builder
# =============================================================================

def generate_run_id() -> str:
    """Generate a unique run ID (simplified ULID-like)."""
    import time
    import random
    ts = int(time.time() * 1000)
    rand = random.randint(0, 0xFFFFFFFF)
    return f"run-{ts:012x}-{rand:08x}"


def build_summary(
    runs: list[RunResult],
    findings: list[Finding],
) -> dict[str, Any]:
    """Build summary from runs and findings."""
    total_checks = sum(len(r.check_results) for r in runs)
    passed = sum(1 for r in runs for c in r.check_results if c.status == Status.PASS)
    failed = sum(1 for r in runs for c in r.check_results if c.status == Status.FAIL)
    skipped = sum(1 for r in runs for c in r.check_results if c.status == Status.SKIP)

    severity_counts = {
        "critical": sum(1 for f in findings if f.severity == Severity.CRITICAL),
        "high": sum(1 for f in findings if f.severity == Severity.HIGH),
        "medium": sum(1 for f in findings if f.severity == Severity.MEDIUM),
        "low": sum(1 for f in findings if f.severity == Severity.LOW),
        "info": sum(1 for f in findings if f.severity == Severity.INFO),
    }

    # Determine overall status
    if severity_counts["critical"] > 0 or severity_counts["high"] > 0:
        status = Status.FAIL
    elif severity_counts["medium"] > 0:
        status = Status.WARN
    elif any(r.status == Status.ERROR for r in runs):
        status = Status.ERROR
    else:
        status = Status.PASS

    # Calculate score (100 - weighted deductions)
    score = 100
    score -= severity_counts["critical"] * 25
    score -= severity_counts["high"] * 15
    score -= severity_counts["medium"] * 5
    score -= severity_counts["low"] * 1
    score = max(0, score)

    # Top failure codes
    code_counts: dict[str, int] = {}
    for f in findings:
        code_counts[f.code] = code_counts.get(f.code, 0) + 1
    top_codes = sorted(code_counts.keys(), key=lambda c: code_counts[c], reverse=True)[:5]

    return {
        "status": status,
        "score": score,
        "totals": {
            "runs": len(runs),
            "checks": total_checks,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
        },
        "severity_counts": severity_counts,
        "top_failure_codes": top_codes,
    }


def build_default_metrics() -> dict[str, Any]:
    """Build default empty metrics structure."""
    return {
        "latency_ms": {
            "overall": {"p50": 0, "p95": 0, "p99": 0, "max": 0},
        },
        "throughput_rps": {
            "overall_avg": 0,
            "overall_max": 0,
        },
        "reliability": {
            "requests": 0,
            "success": 0,
            "errors": 0,
            "timeouts": 0,
            "cancellations": 0,
            "reconnects": 0,
            "server_crashes": 0,
        },
    }


def build_report(
    run_id: str,
    targets: list[Target],
    profiles: list[str],
    runs: list[RunResult],
    findings: list[Finding],
    metrics: dict[str, Any] | None = None,
    artifacts: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Build the full StressKit report."""
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "stresskit_version": __version__,
        "run_id": run_id,
        "targets": [t.to_dict() for t in targets],
        "profiles": [{"profile_id": p, "version": PROFILES.get(p, "0.1")} for p in profiles],
        "summary": build_summary(runs, findings),
        "runs": [r.to_dict() for r in runs],
        "findings": [f.to_dict() for f in findings],
        "metrics": metrics or build_default_metrics(),
        "artifacts": artifacts or [],
    }


# =============================================================================
# Commands
# =============================================================================

def cmd_version(args: argparse.Namespace) -> int:
    """Handle version command."""
    if args.json:
        print(json.dumps({
            "cli_version": __version__,
            "schema_version": SCHEMA_VERSION,
            "python_version": platform.python_version(),
            "platform": platform.system(),
            "profiles": PROFILES,
        }, indent=2))
    else:
        print(f"stresskit {__version__}")
        print(f"Schema version: {SCHEMA_VERSION}")
        print(f"Python: {platform.python_version()}")
        print(f"Platform: {platform.system()}")
        print(f"Profiles: {', '.join(PROFILES.keys())}")
    return 0


def cmd_profiles(args: argparse.Namespace) -> int:
    """Handle profiles command - list available profiles."""
    profiles_dir = Path(__file__).parent.parent.parent / "profiles"

    profile_data = []
    for profile_file in sorted(profiles_dir.glob("*.json")):
        try:
            with open(profile_file) as f:
                data = json.load(f)
                profile_data.append({
                    "profile_id": data.get("profile_id"),
                    "version": data.get("version"),
                    "title": data.get("title"),
                    "check_count": len(data.get("checks", [])),
                })
        except (json.JSONDecodeError, OSError):
            continue

    if args.json:
        print(json.dumps({"profiles": profile_data}, indent=2))
    else:
        print("Available profiles:\n")
        for p in profile_data:
            print(f"  {p['profile_id']} (v{p['version']})")
            print(f"    {p['title']}")
            print(f"    {p['check_count']} checks\n")

    return 0


def cmd_targets(args: argparse.Namespace) -> int:
    """Handle targets command - list configured targets."""
    if not HAS_TARGET_LOADER:
        print("Target loader not available", file=sys.stderr)
        return 1

    loader = load_targets()

    if not loader.targets:
        if args.json:
            print(json.dumps({"targets": [], "message": "No targets configured"}))
        else:
            print("No targets configured.")
            print("Create stresskit.targets.json to define targets.")
        return 0

    targets_data = []
    for t in loader.targets:
        target_info = {
            "name": t.name,
            "display_name": t.display_name,
            "transport": t.transport_kind,
            "fingerprint": t.fingerprint,
            "enabled": t.enabled,
            "tags": t.tags,
            "has_fixtures": {
                "invoke_smoke": t.fixtures.invoke_smoke is not None,
                "invoke_slow": t.fixtures.invoke_slow is not None,
                "invoke_error": t.fixtures.invoke_error is not None,
            },
        }
        if t.aliases:
            target_info["aliases"] = t.aliases
        if t.command:
            target_info["command"] = t.command
        if t.url:
            target_info["url"] = t.url
        targets_data.append(target_info)

    # Find duplicates
    duplicates = loader.find_duplicates()
    duplicates_data = []
    for canonical, aliases in duplicates:
        duplicates_data.append({
            "canonical": canonical.name,
            "aliases": [a.name for a in aliases],
            "fingerprint": canonical.fingerprint,
        })

    if args.json:
        result = {"targets": targets_data}
        if duplicates_data:
            result["duplicates"] = duplicates_data
        print(json.dumps(result, indent=2))
    else:
        print(f"Configured targets ({len(loader.targets)}):\n")
        for t in loader.targets:
            status = "enabled" if t.enabled else "disabled"
            fixtures = []
            if t.fixtures.invoke_smoke:
                fixtures.append("smoke")
            if t.fixtures.invoke_slow:
                fixtures.append("slow")
            if t.fixtures.invoke_error:
                fixtures.append("error")

            print(f"  {t.name} [{status}]")
            print(f"    {t.display_name}")
            print(f"    Transport: {t.transport_kind}")
            print(f"    Fingerprint: {t.fingerprint}")
            if t.aliases:
                print(f"    Aliases: {', '.join(t.aliases)}")
            if fixtures:
                print(f"    Fixtures: {', '.join(fixtures)}")
            if t.tags:
                print(f"    Tags: {', '.join(t.tags)}")
            print()

        if duplicates:
            print("Potential duplicates detected:")
            for canonical, aliases in duplicates:
                alias_names = ", ".join(a.name for a in aliases)
                print(f"  {canonical.name} <- {alias_names}")
            print()

    return 0


def _resolve_targets(args: argparse.Namespace) -> list[Target]:
    """Resolve targets from args (--target, --all, or positional command)."""
    targets = []

    if getattr(args, "all", False) and HAS_TARGET_LOADER:
        # Load all enabled targets from config
        loader = load_targets()
        tag_filter = getattr(args, "tags", None)

        for idx, tc in enumerate(loader.get_enabled()):
            # Filter by tags if specified
            if tag_filter:
                if not any(tag in tc.tags for tag in tag_filter):
                    continue

            targets.append(Target(
                target_id=f"target-{idx}",
                transport_kind=tc.transport_kind,
                display_name=tc.display_name,
                server_name=tc.name,
                command=tc.command,
                args=tc.args,
                cwd=tc.cwd,
                url=tc.url,
                fixtures=tc.fixtures,
            ))

    elif getattr(args, "target_name", None) and HAS_TARGET_LOADER:
        # Load specific target from config
        loader = load_targets()
        tc = loader.get(args.target_name)
        if tc:
            targets.append(Target(
                target_id="target-0",
                transport_kind=tc.transport_kind,
                display_name=tc.display_name,
                server_name=tc.name,
                command=tc.command,
                args=tc.args,
                cwd=tc.cwd,
                url=tc.url,
                fixtures=tc.fixtures,
            ))

    elif getattr(args, "target_command", None):
        # Ad-hoc command from positional args
        targets.append(Target(
            target_id="target-0",
            transport_kind="stdio",
            display_name=args.target_command,
            server_name=args.target_command,
            command=args.target_command,
            args=args.target_args or [],
        ))

    return targets


def cmd_check(args: argparse.Namespace) -> int:
    """Handle check command - run profiles against a target."""
    run_id = generate_run_id()
    timeout_ms = args.timeout * 1000 if hasattr(args, 'timeout') else 30000

    # Resolve targets
    targets_to_run = _resolve_targets(args)

    if not targets_to_run:
        print("No targets specified. Use one of:", file=sys.stderr)
        print("  stresskit check <command> [args...]", file=sys.stderr)
        print("  stresskit check --target <name>", file=sys.stderr)
        print("  stresskit check --all", file=sys.stderr)
        return 1

    # Determine profiles to run
    profiles_to_run = args.profiles or ["mcp-core"]

    runs: list[RunResult] = []
    findings: list[Finding] = []
    all_latencies: list[float] = []
    total_requests = 0
    total_successes = 0
    total_errors = 0
    total_timeouts = 0

    # Try to import check runner (may not be available in all contexts)
    dry_run = getattr(args, 'dry_run', False)
    use_real_checks = False

    if not dry_run:
        try:
            from mcp_client import create_client, MCPClientError
            from check_runner import CheckContext, get_checks_for_profile
            use_real_checks = True
        except ImportError:
            pass

    # Run profiles against each target
    for target in targets_to_run:
        for profile_id in profiles_to_run:
            if profile_id not in PROFILES:
                findings.append(Finding(
                    finding_id=f"f-{len(findings):05d}",
                    code=FindingCode.CONFIG_INVALID,
                    title=f"Unknown profile: {profile_id}",
                    severity=Severity.HIGH,
                    target_id=target.target_id,
                    run_id=run_id,
                    evidence_message=f"Profile '{profile_id}' is not recognized. Valid profiles: {', '.join(PROFILES.keys())}",
                ))
                continue

            profile_run_id = f"{run_id}-{target.target_id}-{profile_id}"
            check_results: list[CheckResult] = []
            run_status = Status.PASS

            if use_real_checks:
                # Get checks for this profile
                checks = get_checks_for_profile(profile_id)

                if not checks:
                    # No checks implemented yet for this profile
                    check_results.append(CheckResult(
                        check_id=f"{profile_id.replace('mcp-', '')}.placeholder",
                        status=Status.SKIP,
                        details={"message": "No checks implemented for this profile yet"},
                    ))
                else:
                    # Create client and run checks
                    client = None
                    try:
                        client = create_client(
                            transport=target.transport_kind,
                            command=target.command,
                            args=target.args,
                            cwd=target.cwd,
                            url=target.url,
                            timeout_ms=timeout_ms,
                        )
                        client.connect()

                        # Create check context
                        ctx = CheckContext(
                            client=client,
                            target_id=target.target_id,
                            run_id=profile_run_id,
                            profile_id=profile_id,
                            parameters={"timeout_ms": timeout_ms},
                            fixtures=target.fixtures,
                        )

                        # Run each check
                        for check_id, check_fn in checks:
                            try:
                                outcome = check_fn(ctx)

                                check_results.append(CheckResult(
                                    check_id=outcome.check_id,
                                    status=outcome.status,
                                    timing_ms=int(outcome.timing_ms),
                                    details=outcome.details,
                                ))

                                # Convert finding if present
                                if outcome.finding:
                                    findings.append(Finding(
                                        finding_id=f"f-{len(findings):05d}",
                                        code=outcome.finding.code,
                                        title=outcome.finding.title,
                                        severity=outcome.finding.severity,
                                        target_id=target.target_id,
                                        run_id=profile_run_id,
                                        evidence_message=outcome.finding.evidence_message,
                                        observations=outcome.finding.observations,
                                        repro=outcome.finding.repro,
                                    ))

                                # Update run status
                                if outcome.status == "FAIL":
                                    run_status = Status.FAIL
                                elif outcome.status == "ERROR" and run_status != Status.FAIL:
                                    run_status = Status.ERROR

                            except Exception as e:
                                check_results.append(CheckResult(
                                    check_id=check_id,
                                    status=Status.ERROR,
                                    details={"error": str(e)},
                                ))
                                run_status = Status.ERROR

                        # Update target identity if we got it
                        if client.identity:
                            target.server_name = client.identity.name
                            target.server_version = client.identity.version

                        # Collect metrics from context
                        all_latencies.extend(ctx.latencies)
                        total_requests += ctx.requests
                        total_successes += ctx.successes
                        total_errors += ctx.errors
                        total_timeouts += ctx.timeouts

                    except MCPClientError as e:
                        check_results.append(CheckResult(
                            check_id="core.connect",
                            status=Status.ERROR,
                            details={"error": str(e)},
                        ))
                        run_status = Status.ERROR
                        findings.append(Finding(
                            finding_id=f"f-{len(findings):05d}",
                            code=FindingCode.TARGET_UNREACHABLE,
                            title="Failed to connect to target",
                            severity=Severity.CRITICAL,
                            target_id=target.target_id,
                            run_id=profile_run_id,
                            evidence_message=str(e),
                        ))

                    finally:
                        if client:
                            try:
                                client.close()
                            except Exception:
                                pass
            else:
                # Fallback: placeholder checks
                check_results.append(CheckResult(
                    check_id=f"{profile_id.replace('mcp-', '')}.placeholder",
                    status=Status.SKIP,
                    details={"message": "Check runner not available"},
                ))

            run = RunResult(
                run_id=profile_run_id,
                target_id=target.target_id,
                profile_id=profile_id,
                profile_version=PROFILES[profile_id],
                status=run_status,
                parameters={"timeout_ms": timeout_ms},
                check_results=check_results,
            )
            runs.append(run)

    # Build metrics from collected data
    metrics = build_default_metrics()
    if all_latencies:
        sorted_lat = sorted(all_latencies)
        n = len(sorted_lat)
        metrics["latency_ms"]["overall"] = {
            "p50": sorted_lat[int(n * 0.5)] if n > 0 else 0,
            "p95": sorted_lat[int(n * 0.95)] if n > 0 else 0,
            "p99": sorted_lat[int(n * 0.99)] if n > 0 else 0,
            "max": sorted_lat[-1] if n > 0 else 0,
        }
    metrics["reliability"] = {
        "requests": total_requests,
        "success": total_successes,
        "errors": total_errors,
        "timeouts": total_timeouts,
        "cancellations": 0,
        "reconnects": 0,
        "server_crashes": 0,
    }

    # Build report
    report = build_report(
        run_id=run_id,
        targets=targets_to_run,
        profiles=profiles_to_run,
        runs=runs,
        findings=findings,
        metrics=metrics,
    )

    summary = report["summary"]

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        target_names = ", ".join(t.display_name for t in targets_to_run)
        print(f"StressKit Report: {run_id}")
        print(f"Targets ({len(targets_to_run)}): {target_names}")
        print(f"Profiles: {', '.join(profiles_to_run)}")
        print(f"\nStatus: {summary['status']}")
        print(f"Score: {summary['score']}/100")
        print(f"Checks: {summary['totals']['passed']} passed, {summary['totals']['failed']} failed, {summary['totals']['skipped']} skipped")

        if findings:
            print(f"\nFindings ({len(findings)}):")
            for f in findings[:10]:
                print(f"  [{f.severity.upper()}] {f.code}: {f.title}")

    # Exit code based on status
    if summary["status"] == Status.PASS:
        return 0
    elif summary["status"] == Status.WARN:
        return 1
    elif summary["status"] == Status.FAIL:
        return 2
    else:
        return 3


def cmd_validate(args: argparse.Namespace) -> int:
    """Handle validate command - validate a report file against schema."""
    try:
        with open(args.report_file) as f:
            report = json.load(f)
    except json.JSONDecodeError as e:
        print(f"Invalid JSON: {e}", file=sys.stderr)
        return 1
    except OSError as e:
        print(f"Cannot read file: {e}", file=sys.stderr)
        return 1

    # Basic validation (full JSON Schema validation TBD)
    required_fields = ["schema_version", "generated_at", "stresskit_version", "run_id",
                       "targets", "profiles", "summary", "runs", "findings"]

    missing = [f for f in required_fields if f not in report]
    if missing:
        print(f"Missing required fields: {', '.join(missing)}", file=sys.stderr)
        return 1

    if report.get("schema_version") != SCHEMA_VERSION:
        print(f"Schema version mismatch: expected {SCHEMA_VERSION}, got {report.get('schema_version')}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps({"valid": True, "schema_version": SCHEMA_VERSION}, indent=2))
    else:
        print(f"Valid StressKit report (schema v{SCHEMA_VERSION})")
        print(f"Run ID: {report['run_id']}")
        print(f"Status: {report['summary']['status']}")

    return 0


# =============================================================================
# CLI Entry Point
# =============================================================================

def create_parser() -> argparse.ArgumentParser:
    """Create argument parser."""
    parser = argparse.ArgumentParser(
        prog="stresskit",
        description="StressKit - MCP Server Health & Security Testing",
    )
    subparsers = parser.add_subparsers(dest="subcommand", help="Available commands")

    # version command
    version_parser = subparsers.add_parser("version", help="Show version information")
    version_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # profiles command
    profiles_parser = subparsers.add_parser("profiles", help="List available profiles")
    profiles_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # targets command
    targets_parser = subparsers.add_parser("targets", help="List configured targets")
    targets_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # check command
    check_parser = subparsers.add_parser("check", help="Run checks against an MCP server")

    # Target specification - mutually exclusive: positional command OR --target OR --all
    target_group = check_parser.add_mutually_exclusive_group()
    target_group.add_argument(
        "--target", "-t",
        dest="target_name",
        help="Target name from stresskit.targets.json",
    )
    target_group.add_argument(
        "--all",
        action="store_true",
        help="Run against all enabled targets in stresskit.targets.json",
    )

    # Positional args for ad-hoc command (still supported)
    check_parser.add_argument("target_command", nargs="?", help="Command to spawn MCP server")
    check_parser.add_argument("target_args", nargs="*", help="Arguments for the command")

    check_parser.add_argument("--json", action="store_true", help="Output as JSON")
    check_parser.add_argument(
        "--profile", "-p",
        dest="profiles",
        action="append",
        choices=list(PROFILES.keys()),
        help="Profile(s) to run (can specify multiple)",
    )
    check_parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Timeout in seconds (default: 30)",
    )
    check_parser.add_argument(
        "--output", "-o",
        help="Output report to file",
    )
    check_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't actually connect to server; produce placeholder report",
    )
    check_parser.add_argument(
        "--tag",
        action="append",
        dest="tags",
        help="Only run targets with this tag (requires --all)",
    )

    # validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a report file")
    validate_parser.add_argument("report_file", help="Path to report JSON file")
    validate_parser.add_argument("--json", action="store_true", help="Output as JSON")

    return parser


def main() -> int:
    """Main entry point."""
    parser = create_parser()
    args = parser.parse_args()

    if args.subcommand is None:
        parser.print_help()
        return 1

    if args.subcommand == "version":
        return cmd_version(args)
    elif args.subcommand == "profiles":
        return cmd_profiles(args)
    elif args.subcommand == "targets":
        return cmd_targets(args)
    elif args.subcommand == "check":
        return cmd_check(args)
    elif args.subcommand == "validate":
        return cmd_validate(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
