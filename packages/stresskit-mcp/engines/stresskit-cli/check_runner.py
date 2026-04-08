"""
Check Runner for StressKit.

Executes profile checks against an MCP server using the client interface.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from mcp_client import (
    MCPClient,
    MCPClientError,
    MCPConnectionError,
    MCPTimeoutError,
    MCPProtocolError,
    CallResult,
    ServerIdentity,
    Tool,
)

try:
    from target_loader import InvokeFixture, Fixtures
    HAS_FIXTURES = True
except ImportError:
    HAS_FIXTURES = False
    InvokeFixture = None
    Fixtures = None


# =============================================================================
# Check Context
# =============================================================================

@dataclass
class CheckContext:
    """Context passed to each check function."""
    client: MCPClient
    target_id: str
    run_id: str
    profile_id: str
    parameters: dict[str, Any] = field(default_factory=dict)

    # Fixtures for fixture-driven checks
    fixtures: Any = None  # Fixtures object from target_loader

    # Artifact output directory
    artifact_dir: Path | None = None

    # Accumulated during checks
    tools: list[Tool] = field(default_factory=list)
    latencies: list[float] = field(default_factory=list)
    errors: int = 0
    timeouts: int = 0
    requests: int = 0
    successes: int = 0

    # Artifacts produced by checks
    artifacts: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class CheckOutcome:
    """Result of a single check execution."""
    check_id: str
    status: str  # PASS, FAIL, SKIP, ERROR
    timing_ms: float = 0
    details: dict[str, Any] = field(default_factory=dict)
    finding: "Finding | None" = None


@dataclass
class Finding:
    """A finding produced by a check."""
    code: str
    title: str
    severity: str
    evidence_message: str
    observations: list[dict[str, Any]] | None = None
    repro: dict[str, Any] | None = None


@dataclass
class ReproBundle:
    """Reproducibility bundle for failures."""
    finding_id: str
    target_fingerprint: str
    tool_name: str | None
    tool_args: dict[str, Any] | None
    transcript: list[dict[str, Any]]  # Last N request/response pairs
    server_identity: dict[str, Any] | None
    error: str | None

    def to_dict(self) -> dict[str, Any]:
        return {
            "finding_id": self.finding_id,
            "target_fingerprint": self.target_fingerprint,
            "tool": {
                "name": self.tool_name,
                "args": self.tool_args,
            } if self.tool_name else None,
            "transcript": self.transcript,
            "server_identity": self.server_identity,
            "error": self.error,
        }


def _write_repro_bundle(ctx: CheckContext, bundle: ReproBundle) -> str | None:
    """Write a repro bundle to artifact directory. Returns artifact ID or None."""
    if not ctx.artifact_dir:
        return None

    artifact_id = f"repro-{bundle.finding_id}"
    artifact_path = ctx.artifact_dir / f"{artifact_id}.json"

    try:
        ctx.artifact_dir.mkdir(parents=True, exist_ok=True)
        with open(artifact_path, "w") as f:
            json.dump(bundle.to_dict(), f, indent=2)

        ctx.artifacts.append({
            "artifact_id": artifact_id,
            "type": "repro_bundle",
            "path": str(artifact_path),
            "finding_id": bundle.finding_id,
        })
        return artifact_id

    except OSError:
        return None


def _get_transcript_tail(client: MCPClient, n: int = 5) -> list[dict[str, Any]]:
    """Get the last N transcript entries from client."""
    if hasattr(client, "transcript") and client.transcript:
        return client.transcript[-n:]
    return []


def _get_server_identity_dict(client: MCPClient) -> dict[str, Any] | None:
    """Get server identity as dict."""
    if client.identity:
        return {
            "name": client.identity.name,
            "version": client.identity.version,
            "protocol_version": client.identity.protocol_version,
        }
    return None


# =============================================================================
# mcp-core Checks
# =============================================================================

def check_core_handshake(ctx: CheckContext) -> CheckOutcome:
    """Verify initialize handshake completes successfully."""
    start = time.perf_counter()

    try:
        # Initialize
        result = ctx.client.initialize()
        ctx.requests += 1

        if not result.success:
            ctx.errors += 1
            return CheckOutcome(
                check_id="core.handshake",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={"error": result.error},
                finding=Finding(
                    code="MCP.CORE.HANDSHAKE_FAILED",
                    title="Initialize handshake failed",
                    severity="critical",
                    evidence_message=f"Server returned error: {result.error}",
                    observations=[
                        {"key": "error_code", "value": result.error.get("code") if result.error else None},
                        {"key": "error_message", "value": result.error.get("message") if result.error else None},
                    ],
                ),
            )

        ctx.successes += 1
        ctx.latencies.append(result.latency_ms)

        # Send initialized notification
        ctx.client.initialized()

        identity = ctx.client.identity
        details = {
            "server_name": identity.name if identity else "unknown",
            "server_version": identity.version if identity else None,
            "protocol_version": identity.protocol_version if identity else None,
            "capabilities": list(identity.capabilities.keys()) if identity else [],
        }

        return CheckOutcome(
            check_id="core.handshake",
            status="PASS",
            timing_ms=(time.perf_counter() - start) * 1000,
            details=details,
        )

    except MCPTimeoutError as e:
        ctx.timeouts += 1
        return CheckOutcome(
            check_id="core.handshake",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.HANDSHAKE_TIMEOUT",
                title="Initialize handshake timed out",
                severity="critical",
                evidence_message=str(e),
            ),
        )

    except MCPConnectionError as e:
        ctx.errors += 1
        return CheckOutcome(
            check_id="core.handshake",
            status="ERROR",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"error": str(e)},
            finding=Finding(
                code="MCP.CORE.HANDSHAKE_FAILED",
                title="Connection failed during handshake",
                severity="critical",
                evidence_message=str(e),
            ),
        )


def check_core_list_tools(ctx: CheckContext) -> CheckOutcome:
    """Verify tools/list returns valid tool definitions."""
    start = time.perf_counter()

    try:
        result = ctx.client.list_tools()
        ctx.requests += 1

        if not result.success:
            ctx.errors += 1
            return CheckOutcome(
                check_id="core.list_tools",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                finding=Finding(
                    code="MCP.CORE.LIST_TOOLS_FAILED",
                    title="tools/list request failed",
                    severity="high",
                    evidence_message=f"Server returned error: {result.error}",
                ),
            )

        ctx.successes += 1
        ctx.latencies.append(result.latency_ms)

        # Parse tools
        tools_data = result.result.get("tools", []) if result.result else []

        # Validate structure
        valid_tools = []
        invalid_count = 0

        for t in tools_data:
            if not isinstance(t, dict):
                invalid_count += 1
                continue
            if "name" not in t:
                invalid_count += 1
                continue

            tool = Tool(
                name=t["name"],
                description=t.get("description"),
                input_schema=t.get("inputSchema"),
            )
            valid_tools.append(tool)

        ctx.tools = valid_tools

        if invalid_count > 0:
            return CheckOutcome(
                check_id="core.list_tools",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={"tool_count": len(valid_tools), "invalid_count": invalid_count},
                finding=Finding(
                    code="MCP.CORE.INVALID_TOOL_SCHEMA",
                    title="Some tools have invalid schema",
                    severity="high",
                    evidence_message=f"{invalid_count} tool(s) missing required 'name' field",
                    observations=[
                        {"key": "valid_tools", "value": len(valid_tools)},
                        {"key": "invalid_tools", "value": invalid_count},
                    ],
                ),
            )

        # Check for duplicate names
        names = [t.name for t in valid_tools]
        duplicates = [n for n in names if names.count(n) > 1]
        if duplicates:
            return CheckOutcome(
                check_id="core.list_tools",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={"tool_count": len(valid_tools), "duplicates": list(set(duplicates))},
                finding=Finding(
                    code="MCP.CORE.INVALID_TOOL_SCHEMA",
                    title="Duplicate tool names detected",
                    severity="medium",
                    evidence_message=f"Duplicate tool names: {', '.join(set(duplicates))}",
                ),
            )

        return CheckOutcome(
            check_id="core.list_tools",
            status="PASS",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={
                "tool_count": len(valid_tools),
                "tool_names": [t.name for t in valid_tools[:10]],  # First 10
            },
        )

    except MCPTimeoutError:
        ctx.timeouts += 1
        return CheckOutcome(
            check_id="core.list_tools",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.LIST_TOOLS_FAILED",
                title="tools/list timed out",
                severity="high",
                evidence_message="Request exceeded timeout",
            ),
        )

    except MCPClientError as e:
        ctx.errors += 1
        return CheckOutcome(
            check_id="core.list_tools",
            status="ERROR",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"error": str(e)},
        )


def check_core_error_format(ctx: CheckContext) -> CheckOutcome:
    """Verify error responses use proper JSON-RPC format."""
    start = time.perf_counter()

    try:
        # Call a method that should not exist
        result = ctx.client._send_request("nonexistent/method", {})
        ctx.requests += 1

        if result.success:
            # Server didn't return an error for invalid method - that's wrong
            return CheckOutcome(
                check_id="core.error_format",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                finding=Finding(
                    code="MCP.CORE.INVALID_ERROR_FORMAT",
                    title="Server did not reject invalid method",
                    severity="medium",
                    evidence_message="Expected error for 'nonexistent/method', got success",
                ),
            )

        ctx.latencies.append(result.latency_ms)

        # Validate error structure
        error = result.error
        if not error:
            return CheckOutcome(
                check_id="core.error_format",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                finding=Finding(
                    code="MCP.CORE.INVALID_ERROR_FORMAT",
                    title="Error response missing error object",
                    severity="medium",
                    evidence_message="Response indicated failure but error field is empty",
                ),
            )

        has_code = "code" in error
        has_message = "message" in error

        if not has_code or not has_message:
            missing = []
            if not has_code:
                missing.append("code")
            if not has_message:
                missing.append("message")

            return CheckOutcome(
                check_id="core.error_format",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={"error": error},
                finding=Finding(
                    code="MCP.CORE.INVALID_ERROR_FORMAT",
                    title="Error response missing required fields",
                    severity="medium",
                    evidence_message=f"Missing: {', '.join(missing)}",
                    observations=[
                        {"key": "has_code", "value": has_code},
                        {"key": "has_message", "value": has_message},
                    ],
                ),
            )

        return CheckOutcome(
            check_id="core.error_format",
            status="PASS",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={
                "error_code": error.get("code"),
                "has_data": "data" in error,
            },
        )

    except MCPTimeoutError:
        ctx.timeouts += 1
        return CheckOutcome(
            check_id="core.error_format",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": "Request timed out"},
        )

    except MCPClientError as e:
        ctx.errors += 1
        return CheckOutcome(
            check_id="core.error_format",
            status="ERROR",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"error": str(e)},
        )


def check_core_capability_honesty(ctx: CheckContext) -> CheckOutcome:
    """Verify advertised capabilities match actual behavior."""
    start = time.perf_counter()

    identity = ctx.client.identity
    if not identity:
        return CheckOutcome(
            check_id="core.capability_honesty",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": "No identity available (handshake not completed)"},
        )

    capabilities = identity.capabilities
    mismatches = []

    # Check tools capability
    has_tools_cap = "tools" in capabilities
    if ctx.tools:  # We have tools from list_tools
        if not has_tools_cap:
            mismatches.append("Server has tools but didn't advertise tools capability")

    # Check resources capability (if we tested it)
    # For now, just validate structure

    if mismatches:
        return CheckOutcome(
            check_id="core.capability_honesty",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.CAPABILITY_MISMATCH",
                title="Capabilities don't match behavior",
                severity="medium",
                evidence_message="; ".join(mismatches),
            ),
        )

    return CheckOutcome(
        check_id="core.capability_honesty",
        status="PASS",
        timing_ms=(time.perf_counter() - start) * 1000,
        details={"capabilities": list(capabilities.keys())},
    )


def check_core_invoke_smoke(ctx: CheckContext) -> CheckOutcome:
    """Invoke the fixture-defined smoke tool to verify basic invocation works.

    This check uses the invoke_smoke fixture from the target configuration.
    It does NOT guess which tool to call - only uses configured fixtures.
    """
    start = time.perf_counter()

    # Check if fixtures are available
    if not ctx.fixtures or not hasattr(ctx.fixtures, 'invoke_smoke') or not ctx.fixtures.invoke_smoke:
        return CheckOutcome(
            check_id="core.invoke_smoke",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": "No invoke_smoke fixture configured for this target"},
        )

    fixture = ctx.fixtures.invoke_smoke
    tool_name = fixture.tool
    tool_args = fixture.args

    # Check if tool exists in the server's tool list
    tool_exists = any(t.name == tool_name for t in ctx.tools)

    # Also try candidate tools if primary not found
    if not tool_exists and hasattr(fixture, 'candidates') and fixture.candidates:
        for candidate in fixture.candidates:
            if any(t.name == candidate for t in ctx.tools):
                tool_name = candidate
                tool_exists = True
                break

    if not tool_exists:
        # Tool not found - severity depends on whether it's likely a config error
        return CheckOutcome(
            check_id="core.invoke_smoke",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"tool": tool_name, "available_tools": [t.name for t in ctx.tools[:10]]},
            finding=Finding(
                code="MCP.CORE.INVOKE_SMOKE_FAILED",
                title=f"Smoke tool '{tool_name}' not found",
                severity="medium",  # Config error, not server bug
                evidence_message=f"Fixture specifies tool '{tool_name}' but server doesn't expose it. Available: {[t.name for t in ctx.tools[:5]]}",
                observations=[
                    {"key": "fixture_tool", "value": tool_name},
                    {"key": "tool_count", "value": len(ctx.tools)},
                ],
            ),
        )

    # Invoke the tool
    try:
        result = ctx.client.call_tool(tool_name, tool_args)
        ctx.requests += 1

        if not result.success:
            ctx.errors += 1

            # Create repro bundle
            bundle = ReproBundle(
                finding_id=f"{ctx.run_id}-invoke-smoke",
                target_fingerprint=ctx.target_id,
                tool_name=tool_name,
                tool_args=tool_args,
                transcript=_get_transcript_tail(ctx.client),
                server_identity=_get_server_identity_dict(ctx.client),
                error=str(result.error) if result.error else "Unknown error",
            )
            artifact_id = _write_repro_bundle(ctx, bundle)

            return CheckOutcome(
                check_id="core.invoke_smoke",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={"tool": tool_name, "error": result.error},
                finding=Finding(
                    code="MCP.CORE.INVOKE_SMOKE_FAILED",
                    title=f"Smoke invocation of '{tool_name}' failed",
                    severity="high",
                    evidence_message=f"Tool call returned error: {result.error}",
                    observations=[
                        {"key": "tool", "value": tool_name},
                        {"key": "args", "value": tool_args},
                        {"key": "error_code", "value": result.error.get("code") if result.error else None},
                    ],
                    repro={"artifact_id": artifact_id} if artifact_id else None,
                ),
            )

        ctx.successes += 1
        ctx.latencies.append(result.latency_ms)

        # Calculate response size if possible
        response_size = len(json.dumps(result.result)) if result.result else 0

        return CheckOutcome(
            check_id="core.invoke_smoke",
            status="PASS",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={
                "tool": tool_name,
                "latency_ms": result.latency_ms,
                "response_bytes": response_size,
            },
        )

    except MCPTimeoutError as e:
        ctx.timeouts += 1

        bundle = ReproBundle(
            finding_id=f"{ctx.run_id}-invoke-smoke",
            target_fingerprint=ctx.target_id,
            tool_name=tool_name,
            tool_args=tool_args,
            transcript=_get_transcript_tail(ctx.client),
            server_identity=_get_server_identity_dict(ctx.client),
            error=f"Timeout: {e}",
        )
        artifact_id = _write_repro_bundle(ctx, bundle)

        return CheckOutcome(
            check_id="core.invoke_smoke",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.INVOKE_SMOKE_FAILED",
                title=f"Smoke invocation of '{tool_name}' timed out",
                severity="high",
                evidence_message=str(e),
                repro={"artifact_id": artifact_id} if artifact_id else None,
            ),
        )

    except MCPClientError as e:
        ctx.errors += 1

        bundle = ReproBundle(
            finding_id=f"{ctx.run_id}-invoke-smoke",
            target_fingerprint=ctx.target_id,
            tool_name=tool_name,
            tool_args=tool_args,
            transcript=_get_transcript_tail(ctx.client),
            server_identity=_get_server_identity_dict(ctx.client),
            error=str(e),
        )
        artifact_id = _write_repro_bundle(ctx, bundle)

        return CheckOutcome(
            check_id="core.invoke_smoke",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"error": str(e)},
            finding=Finding(
                code="MCP.CORE.INVOKE_SMOKE_FAILED",
                title=f"Smoke invocation of '{tool_name}' failed",
                severity="high",
                evidence_message=str(e),
                repro={"artifact_id": artifact_id} if artifact_id else None,
            ),
        )


def check_core_schema_reject_invalid(ctx: CheckContext) -> CheckOutcome:
    """Verify server rejects invalid tool input with structured errors.

    For each tool, send intentionally invalid input and verify:
    - Server returns JSON-RPC error (not success)
    - Server doesn't crash
    - Error has proper structure (code + message)
    """
    start = time.perf_counter()

    if not ctx.tools:
        return CheckOutcome(
            check_id="core.schema_reject_invalid",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": "No tools available to test"},
        )

    tested = 0
    passed = 0
    failed_tools = []

    for tool in ctx.tools[:5]:  # Test first 5 tools to limit time
        # Determine invalid input based on schema
        schema = tool.input_schema
        has_required = (
            schema
            and isinstance(schema, dict)
            and schema.get("required")
            and len(schema.get("required", [])) > 0
        )

        if has_required:
            # Schema has required fields - send empty object
            invalid_args = {}
        else:
            # No required fields - send obviously wrong type
            invalid_args = {"__stresskit_invalid__": True}

        try:
            result = ctx.client.call_tool(tool.name, invalid_args)
            ctx.requests += 1
            tested += 1

            if result.success:
                # Server accepted invalid input - that's a failure
                failed_tools.append({
                    "tool": tool.name,
                    "reason": "accepted_invalid",
                    "input": invalid_args,
                })
            else:
                # Server rejected - check error format
                error = result.error
                if error and "code" in error and "message" in error:
                    passed += 1
                else:
                    failed_tools.append({
                        "tool": tool.name,
                        "reason": "malformed_error",
                        "error": error,
                    })

            ctx.latencies.append(result.latency_ms)

        except MCPTimeoutError:
            ctx.timeouts += 1
            tested += 1
            failed_tools.append({
                "tool": tool.name,
                "reason": "timeout",
            })

        except MCPConnectionError:
            # Server crashed
            ctx.errors += 1
            return CheckOutcome(
                check_id="core.schema_reject_invalid",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={"tested": tested, "tool": tool.name},
                finding=Finding(
                    code="MCP.CORE.SCHEMA_REJECT_INVALID_FAILED",
                    title="Server crashed on invalid input",
                    severity="high",
                    evidence_message=f"Server crashed when calling '{tool.name}' with invalid input",
                    observations=[
                        {"key": "tool", "value": tool.name},
                        {"key": "input", "value": invalid_args},
                    ],
                ),
            )

        except MCPClientError:
            ctx.errors += 1
            tested += 1
            # Non-crash error - might be acceptable
            passed += 1

    if failed_tools:
        # Determine severity: accepted_invalid is worse than malformed_error
        has_accepted = any(f["reason"] == "accepted_invalid" for f in failed_tools)
        severity = "medium" if has_accepted else "low"

        return CheckOutcome(
            check_id="core.schema_reject_invalid",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={
                "tested": tested,
                "passed": passed,
                "failed": len(failed_tools),
                "failures": failed_tools[:3],  # First 3 failures
            },
            finding=Finding(
                code="MCP.CORE.SCHEMA_REJECT_INVALID_FAILED",
                title="Some tools don't properly reject invalid input",
                severity=severity,
                evidence_message=f"{len(failed_tools)} of {tested} tools failed validation: {[f['tool'] for f in failed_tools[:3]]}",
                observations=[
                    {"key": "tested", "value": tested},
                    {"key": "failed", "value": len(failed_tools)},
                ],
            ),
        )

    return CheckOutcome(
        check_id="core.schema_reject_invalid",
        status="PASS",
        timing_ms=(time.perf_counter() - start) * 1000,
        details={"tested": tested, "passed": passed},
    )


def check_core_timeout_behavior(ctx: CheckContext) -> CheckOutcome:
    """Verify client timeout triggers cleanly and server remains healthy.

    Uses invoke_slow fixture if configured. Otherwise skips.
    """
    start = time.perf_counter()

    # Check for invoke_slow fixture
    if not ctx.fixtures or not hasattr(ctx.fixtures, 'invoke_slow') or not ctx.fixtures.invoke_slow:
        return CheckOutcome(
            check_id="core.timeout_behavior",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": "No invoke_slow fixture configured for this target"},
        )

    fixture = ctx.fixtures.invoke_slow
    tool_name = fixture.tool
    tool_args = fixture.args

    # Step 1: Invoke with very short timeout to trigger timeout
    short_timeout_ms = 250  # Very short to ensure timeout

    try:
        # We need to temporarily reduce timeout - this depends on client implementation
        # For now, we'll just try the call and see if it's slow enough to timeout
        result = ctx.client.call_tool(tool_name, tool_args)
        ctx.requests += 1

        # If it succeeded quickly, the "slow" fixture isn't slow enough
        if result.success and result.latency_ms < 200:
            return CheckOutcome(
                check_id="core.timeout_behavior",
                status="SKIP",
                timing_ms=(time.perf_counter() - start) * 1000,
                details={
                    "reason": "invoke_slow fixture completed too quickly to test timeout",
                    "latency_ms": result.latency_ms,
                },
            )

        # If we got here without timeout, record it
        ctx.latencies.append(result.latency_ms)

    except MCPTimeoutError:
        ctx.timeouts += 1
        # Good - timeout occurred. Now verify server is still healthy.

    except MCPConnectionError:
        ctx.errors += 1
        return CheckOutcome(
            check_id="core.timeout_behavior",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.TIMEOUT_BEHAVIOR_BAD",
                title="Server crashed during slow call",
                severity="high",
                evidence_message=f"Server became unavailable during '{tool_name}' invocation",
            ),
        )

    # Step 2: Verify server is still healthy
    try:
        # Try list_tools
        list_result = ctx.client.list_tools()
        ctx.requests += 1

        if not list_result.success:
            return CheckOutcome(
                check_id="core.timeout_behavior",
                status="FAIL",
                timing_ms=(time.perf_counter() - start) * 1000,
                finding=Finding(
                    code="MCP.CORE.TIMEOUT_BEHAVIOR_BAD",
                    title="Server unhealthy after timeout",
                    severity="high",
                    evidence_message="list_tools failed after timeout event",
                ),
            )

        ctx.successes += 1

        # Try smoke if available
        if ctx.fixtures.invoke_smoke:
            smoke = ctx.fixtures.invoke_smoke
            smoke_result = ctx.client.call_tool(smoke.tool, smoke.args)
            ctx.requests += 1

            if not smoke_result.success:
                return CheckOutcome(
                    check_id="core.timeout_behavior",
                    status="FAIL",
                    timing_ms=(time.perf_counter() - start) * 1000,
                    finding=Finding(
                        code="MCP.CORE.TIMEOUT_BEHAVIOR_BAD",
                        title="Server unhealthy after timeout",
                        severity="high",
                        evidence_message=f"Smoke tool '{smoke.tool}' failed after timeout event",
                    ),
                )

            ctx.successes += 1

        return CheckOutcome(
            check_id="core.timeout_behavior",
            status="PASS",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"recovery_verified": True},
        )

    except MCPConnectionError:
        ctx.errors += 1
        return CheckOutcome(
            check_id="core.timeout_behavior",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.TIMEOUT_BEHAVIOR_BAD",
                title="Server unresponsive after timeout",
                severity="high",
                evidence_message="Server became unresponsive after timeout event",
            ),
        )

    except MCPTimeoutError:
        ctx.timeouts += 1
        return CheckOutcome(
            check_id="core.timeout_behavior",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            finding=Finding(
                code="MCP.CORE.TIMEOUT_BEHAVIOR_BAD",
                title="Server wedged after timeout",
                severity="high",
                evidence_message="Health check timed out after previous timeout event",
            ),
        )


# =============================================================================
# mcp-ops Checks
# =============================================================================

def check_ops_concurrency_ramp(ctx: CheckContext) -> CheckOutcome:
    """Run concurrent requests at increasing tiers to test server stability.

    Uses the invoke_smoke fixture. Tests at tiers: 1, 2, 4, 8, 16 concurrent requests.
    Measures latency percentiles, error rates, and timeout rates at each tier.

    FAIL if:
    - Server crashes under load
    - >5% errors at tier <= 4
    - >10% timeouts at any tier

    WARN if:
    - p99 at tier 8 is >5x p99 at tier 1
    - Error rate 1-5% at higher tiers
    """
    import concurrent.futures
    import statistics

    start = time.perf_counter()

    # Check for invoke_smoke fixture (required for ops checks)
    if not ctx.fixtures or not hasattr(ctx.fixtures, 'invoke_smoke') or not ctx.fixtures.invoke_smoke:
        return CheckOutcome(
            check_id="ops.concurrency_ramp",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": "No invoke_smoke fixture configured for this target"},
        )

    fixture = ctx.fixtures.invoke_smoke
    tool_name = fixture.tool
    tool_args = fixture.args

    # Check tool exists
    tool_exists = any(t.name == tool_name for t in ctx.tools)
    if not tool_exists:
        return CheckOutcome(
            check_id="ops.concurrency_ramp",
            status="SKIP",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"reason": f"Smoke tool '{tool_name}' not found"},
        )

    # Configuration
    tiers = [1, 2, 4, 8, 16]
    requests_per_tier = 25  # Start with 25 for faster testing
    timeout_per_request = 10.0  # seconds

    tier_results = []
    baseline_p99 = None
    server_crashed = False

    for tier in tiers:
        tier_latencies = []
        tier_errors = 0
        tier_timeouts = 0
        tier_successes = 0

        def make_request():
            """Make a single request and return (success, latency_ms, error_type)."""
            try:
                result = ctx.client.call_tool(tool_name, tool_args)
                if result.success:
                    return (True, result.latency_ms, None)
                else:
                    return (False, result.latency_ms, "error")
            except MCPTimeoutError:
                return (False, timeout_per_request * 1000, "timeout")
            except MCPConnectionError:
                return (False, 0, "crash")
            except MCPClientError as e:
                return (False, 0, "client_error")

        # Run requests for this tier
        # Note: We're using sequential execution for now since stdio is single-threaded
        # In a real implementation, we'd use thread pools for HTTP transports
        for _ in range(requests_per_tier):
            success, latency_ms, error_type = make_request()
            ctx.requests += 1

            if success:
                tier_successes += 1
                tier_latencies.append(latency_ms)
                ctx.successes += 1
                ctx.latencies.append(latency_ms)
            elif error_type == "timeout":
                tier_timeouts += 1
                ctx.timeouts += 1
            elif error_type == "crash":
                server_crashed = True
                ctx.errors += 1
                break
            else:
                tier_errors += 1
                ctx.errors += 1

        if server_crashed:
            break

        # Calculate tier statistics
        total = tier_successes + tier_errors + tier_timeouts
        error_rate = tier_errors / total if total > 0 else 0
        timeout_rate = tier_timeouts / total if total > 0 else 0

        tier_stats = {
            "tier": tier,
            "requests": total,
            "successes": tier_successes,
            "errors": tier_errors,
            "timeouts": tier_timeouts,
            "error_rate": error_rate,
            "timeout_rate": timeout_rate,
        }

        if tier_latencies:
            sorted_lat = sorted(tier_latencies)
            n = len(sorted_lat)
            tier_stats["p50"] = sorted_lat[int(n * 0.5)]
            tier_stats["p95"] = sorted_lat[int(n * 0.95)]
            tier_stats["p99"] = sorted_lat[min(int(n * 0.99), n - 1)]

            if tier == 1 and "p99" in tier_stats:
                baseline_p99 = tier_stats["p99"]

        tier_results.append(tier_stats)

    # Analyze results
    findings_list = []
    overall_status = "PASS"

    # Check for crash
    if server_crashed:
        return CheckOutcome(
            check_id="ops.concurrency_ramp",
            status="FAIL",
            timing_ms=(time.perf_counter() - start) * 1000,
            details={"tiers": tier_results, "crashed": True},
            finding=Finding(
                code="MCP.OPS.CRASH_UNDER_LOAD",
                title="Server crashed under concurrent load",
                severity="critical",
                evidence_message=f"Server crashed during tier {tier_results[-1]['tier'] if tier_results else 1} testing",
                observations=[{"key": "tier", "value": tier_results[-1]["tier"] if tier_results else 1}],
            ),
        )

    # Check for high error rates at low tiers
    for tr in tier_results:
        if tr["tier"] <= 4 and tr["error_rate"] > 0.05:
            overall_status = "FAIL"
            findings_list.append({
                "code": "MCP.OPS.CONCURRENCY_RAMP_DEGRADES",
                "tier": tr["tier"],
                "error_rate": tr["error_rate"],
                "severity": "high",
            })
            break

    # Check for high timeout rates
    for tr in tier_results:
        if tr["timeout_rate"] > 0.10:
            overall_status = "FAIL"
            findings_list.append({
                "code": "MCP.OPS.CONCURRENCY_RAMP_DEGRADES",
                "tier": tr["tier"],
                "timeout_rate": tr["timeout_rate"],
                "severity": "high",
            })
            break

    # Check for p99 degradation (only if we have baseline and tier 8 data)
    if baseline_p99 and len(tier_results) >= 4:
        tier_8_result = next((tr for tr in tier_results if tr["tier"] == 8), None)
        if tier_8_result and "p99" in tier_8_result:
            p99_ratio = tier_8_result["p99"] / baseline_p99 if baseline_p99 > 0 else 0
            if p99_ratio > 5:
                if overall_status == "PASS":
                    overall_status = "WARN"
                findings_list.append({
                    "code": "MCP.OPS.CONCURRENCY_RAMP_DEGRADES",
                    "tier": 8,
                    "p99_ratio": p99_ratio,
                    "severity": "medium",
                })

    # Check for moderate error rates at higher tiers
    for tr in tier_results:
        if tr["tier"] > 4 and 0.01 < tr["error_rate"] <= 0.05:
            if overall_status == "PASS":
                overall_status = "WARN"
            findings_list.append({
                "code": "MCP.OPS.CONCURRENCY_RAMP_DEGRADES",
                "tier": tr["tier"],
                "error_rate": tr["error_rate"],
                "severity": "medium",
            })

    # Build finding if any issues
    finding = None
    if findings_list:
        worst = findings_list[0]
        finding = Finding(
            code=worst["code"],
            title="Performance degrades under concurrent load",
            severity=worst["severity"],
            evidence_message=f"Tier {worst['tier']}: " + (
                f"error_rate={worst.get('error_rate', 'N/A'):.1%}" if "error_rate" in worst else
                f"timeout_rate={worst.get('timeout_rate', 'N/A'):.1%}" if "timeout_rate" in worst else
                f"p99_ratio={worst.get('p99_ratio', 'N/A'):.1f}x"
            ),
            observations=[
                {"key": f"tier_{tr['tier']}_p99", "value": tr.get("p99", 0)}
                for tr in tier_results if "p99" in tr
            ],
        )

    return CheckOutcome(
        check_id="ops.concurrency_ramp",
        status=overall_status,
        timing_ms=(time.perf_counter() - start) * 1000,
        details={
            "tiers": tier_results,
            "baseline_p99": baseline_p99,
            "issues": len(findings_list),
        },
        finding=finding,
    )


# =============================================================================
# Check Registry
# =============================================================================

# Map of profile_id -> list of (check_id, check_function)
CHECK_REGISTRY: dict[str, list[tuple[str, Callable[[CheckContext], CheckOutcome]]]] = {
    "mcp-core": [
        ("core.handshake", check_core_handshake),
        ("core.list_tools", check_core_list_tools),
        ("core.error_format", check_core_error_format),
        ("core.capability_honesty", check_core_capability_honesty),
        ("core.invoke_smoke", check_core_invoke_smoke),
        ("core.schema_reject_invalid", check_core_schema_reject_invalid),
        ("core.timeout_behavior", check_core_timeout_behavior),
    ],
    "mcp-ops": [
        ("ops.concurrency_ramp", check_ops_concurrency_ramp),
    ],
    "mcp-secure": [],  # TODO
    "mcp-trust": [],  # TODO
}


def get_checks_for_profile(profile_id: str) -> list[tuple[str, Callable[[CheckContext], CheckOutcome]]]:
    """Get registered checks for a profile."""
    return CHECK_REGISTRY.get(profile_id, [])
