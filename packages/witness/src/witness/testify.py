"""
Testimony report generator for Witness.

Generates readable reports that answer:
- Who acted (which keys)
- What happened (actions + observations)
- What artifacts were involved
- What's provably continuous vs recovered
- What anomalies exist (flags)
- With citations (event_id + digest) for independent verification

This is presentation, not a new cryptographic layer.

Phase 2A adds:
- Stable JSON schema (testimony.schema.v0.1.json)
- Deterministic output with --generated-at override
- Markdown CITE lines for grep-able verification
- --emit-artifact for testimony as artifact
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from witness import __version__
from witness.canon import canonical_json, canonical_bytes
from witness.crypto import verify_event
from witness.models import VerifyStatus
from witness.storage import WitnessStore
from witness.timeline import (
    analyze_timeline,
    FLAG_CONTINUITY_BROKEN,
    FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION,
    FLAG_KEY_REACTIVATION,
    FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED,
)


# Flag explanations (factual, no moral language)
FLAG_EXPLANATIONS = {
    FLAG_CONTINUITY_BROKEN: (
        "Rotation event signed by new key; continuity from prior key is not provable."
    ),
    FLAG_TEMPORAL_ANOMALY_AFTER_ROTATION: (
        "Event timestamp occurs after key was rotated away; may be import/backdating."
    ),
    FLAG_KEY_REACTIVATION: (
        "A previously rotated-away key was reintroduced as a new key."
    ),
    FLAG_ROTATION_ACTOR_TYPE_UNEXPECTED: (
        "Rotation event actor.type was not 'system'."
    ),
}


@dataclass
class KeyInfo:
    """Information about a signing key."""
    key_id: str
    first_seen: str  # occurred_at
    last_seen: str  # occurred_at
    event_count: int = 0
    rotations_out: int = 0  # Times rotated away
    rotations_in: int = 0  # Times rotated in
    rotated_away_at: Optional[str] = None
    rotated_in_at: Optional[str] = None
    rotation_mode_out: Optional[str] = None  # continuity/recovery when rotated away
    rotation_mode_in: Optional[str] = None  # continuity/recovery when rotated in
    reactivated: bool = False
    continuity_broken: bool = False


@dataclass
class EventReport:
    """Report data for a single event."""
    event_id: str
    occurred_at: str
    action: str
    intent: str
    actor_type: str
    actor_id: str
    signing_key_id: str
    event_digest: str
    tool: Optional[str] = None
    tool_version: Optional[str] = None
    observation: Optional[Dict[str, str]] = None
    inputs: List[Dict[str, Any]] = field(default_factory=list)
    outputs: List[Dict[str, Any]] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    crypto_status: str = "VERIFIED"
    crypto_error: Optional[str] = None
    signature_ok: bool = True
    flags: List[str] = field(default_factory=list)
    file_flags: List[str] = field(default_factory=list)
    raw_event: Optional[Dict[str, Any]] = None
    raw_event_bytes: Optional[bytes] = None  # Exact bytes as stored


@dataclass
class FlagSummary:
    """Summary of a flag type."""
    flag: str
    count: int
    event_ids: List[str]
    explanation: str


@dataclass
class TestimonyResult:
    """Result of generating a testimony report."""
    text: str
    exit_code: int
    event_count: int
    verified_count: int
    flagged_count: int
    failed_count: int
    flags_summary: List[FlagSummary]
    format: str


@dataclass
class ManifestArtifact:
    """An artifact in the testimony manifest."""
    path: str
    digest: str
    size_bytes: int


def _get_signing_key_id(event: Dict[str, Any]) -> str:
    """Extract signing key ID from event."""
    import base64

    signing = event.get("signing", {})
    pub_b64 = signing.get("public_key", "")
    if not pub_b64:
        return ""
    try:
        pub_bytes = base64.b64decode(pub_b64)
        return hashlib.sha256(pub_bytes).hexdigest()
    except Exception:
        return ""


def _check_file(locator: str, expected_digest: str) -> Optional[str]:
    """
    Check if a file matches its expected digest.

    Returns None if OK, or a flag string if there's an issue.
    """
    path = Path(locator)
    if not path.exists():
        return "MISSING_FILE"

    try:
        actual = hashlib.sha256(path.read_bytes()).hexdigest()
        expected = expected_digest.replace("sha256:", "")
        if actual != expected:
            return "DIGEST_MISMATCH_FILE"
    except Exception:
        return "FILE_READ_ERROR"

    return None


def build_testimony(
    store: WitnessStore,
    *,
    since: Optional[str] = None,
    until: Optional[str] = None,
    event_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    check_files: bool = False,
    include_events: bool = False,
    include_artifacts: bool = True,
) -> tuple[List[EventReport], Dict[str, KeyInfo], List[FlagSummary], int]:
    """
    Build testimony data from store.

    Returns:
        (event_reports, key_info, flags_summary, exit_code)
    """
    # Collect events and their raw JSON strings
    events = []
    event_json_strings = []  # Exact strings as stored
    for stored in store.iter_events(since=since, until=until, actor_id=actor_id):
        if event_id and stored.event_id != event_id:
            continue
        events.append(stored.event)
        event_json_strings.append(stored.event_json)

    if not events:
        return [], {}, [], 0

    # Run timeline analysis
    analyses = analyze_timeline(events, verify_crypto=True)

    # Build reports and key info
    reports: List[EventReport] = []
    keys: Dict[str, KeyInfo] = {}
    all_flags: Dict[str, List[str]] = {}  # flag -> [event_ids]

    crypto_failed = False

    for event, analysis, event_json_str in zip(events, analyses, event_json_strings):
        signing_key_id = _get_signing_key_id(event)
        context = event.get("context", {})
        obs = context.get("observation")
        integrity = event.get("integrity", {})

        # Determine crypto status
        if analysis.crypto_result and not analysis.crypto_result.ok:
            crypto_status = "FAILED_CRYPTO"
            crypto_error = analysis.crypto_result.error
            signature_ok = False
            crypto_failed = True
        else:
            crypto_status = "VERIFIED"
            crypto_error = None
            signature_ok = True

        # Check files if requested
        file_flags = []
        if check_files:
            for artifact in event.get("inputs", []) + event.get("outputs", []):
                locator = artifact.get("locator")
                digest = artifact.get("digest")
                if locator and digest:
                    flag = _check_file(locator, digest)
                    if flag:
                        file_flags.append(flag)

        report = EventReport(
            event_id=event["event_id"],
            occurred_at=event["occurred_at"],
            action=event["action"],
            intent=event.get("intent", ""),
            actor_type=event.get("actor", {}).get("type", ""),
            actor_id=event.get("actor", {}).get("id", ""),
            signing_key_id=signing_key_id,
            event_digest=integrity.get("event_digest", ""),
            tool=context.get("tool"),
            tool_version=context.get("tool_version"),
            observation=obs if obs else None,
            context=context,
            inputs=event.get("inputs", []) if include_artifacts else [],
            outputs=event.get("outputs", []) if include_artifacts else [],
            crypto_status=crypto_status,
            crypto_error=crypto_error,
            signature_ok=signature_ok,
            flags=analysis.flags,
            file_flags=file_flags,
            raw_event=event if include_events else None,
            raw_event_bytes=event_json_str.encode("utf-8") if include_events else None,
        )
        reports.append(report)

        # Track flags
        for flag in analysis.flags + file_flags:
            if flag not in all_flags:
                all_flags[flag] = []
            all_flags[flag].append(event["event_id"])

        # Build key info
        if signing_key_id:
            if signing_key_id not in keys:
                keys[signing_key_id] = KeyInfo(
                    key_id=signing_key_id,
                    first_seen=event["occurred_at"],
                    last_seen=event["occurred_at"],
                )
            ki = keys[signing_key_id]
            ki.last_seen = max(ki.last_seen, event["occurred_at"])
            ki.first_seen = min(ki.first_seen, event["occurred_at"])
            ki.event_count += 1

            # Track rotation info
            if event["action"] == "witness.rotate_key":
                rotation = context.get("rotation", {})
                old_key = rotation.get("old_key_id", "")
                new_key = rotation.get("new_key_id", "")
                mode = rotation.get("mode", "")

                if old_key and old_key in keys:
                    keys[old_key].rotated_away_at = event["occurred_at"]
                    keys[old_key].rotation_mode_out = mode
                    keys[old_key].rotations_out += 1

                if new_key:
                    if new_key not in keys:
                        keys[new_key] = KeyInfo(
                            key_id=new_key,
                            first_seen=event["occurred_at"],
                            last_seen=event["occurred_at"],
                        )
                    keys[new_key].rotated_in_at = event["occurred_at"]
                    keys[new_key].rotation_mode_in = mode
                    keys[new_key].rotations_in += 1

            # Track flags on keys
            if FLAG_KEY_REACTIVATION in analysis.flags:
                ki.reactivated = True
            if FLAG_CONTINUITY_BROKEN in analysis.flags:
                ki.continuity_broken = True

    # Build flags summary
    flags_summary = []
    for flag, event_ids in sorted(all_flags.items()):
        flags_summary.append(FlagSummary(
            flag=flag,
            count=len(event_ids),
            event_ids=event_ids,
            explanation=FLAG_EXPLANATIONS.get(flag, "Unknown flag."),
        ))

    # Determine exit code
    if crypto_failed:
        exit_code = 3
    elif all_flags:
        exit_code = 2
    else:
        exit_code = 0

    return reports, keys, flags_summary, exit_code


def render_markdown(
    reports: List[EventReport],
    keys: Dict[str, KeyInfo],
    flags_summary: List[FlagSummary],
    *,
    db_path: Optional[str] = None,
    filters: Optional[Dict[str, str]] = None,
    include_events: bool = False,
    generated_at: Optional[str] = None,
) -> str:
    """Render testimony as Markdown with stable headings and CITE lines."""
    lines = []

    # Use provided timestamp or generate now
    timestamp = generated_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Header
    lines.append("# Witness Testimony")
    lines.append("")

    # Scope
    lines.append("## Scope")
    lines.append("")
    lines.append(f"- **Generated:** {timestamp}")
    lines.append(f"- **Witness Version:** {__version__}")
    if db_path:
        lines.append(f"- **Store:** `{db_path}`")
    if filters:
        for k, v in filters.items():
            if v:
                lines.append(f"- **{k}:** {v}")
    lines.append("")

    # Summary
    verified = sum(1 for r in reports if r.crypto_status == "VERIFIED" and not r.flags)
    flagged = sum(1 for r in reports if r.crypto_status == "VERIFIED" and r.flags)
    failed = sum(1 for r in reports if r.crypto_status == "FAILED_CRYPTO")
    total_flags = sum(len(r.flags) + len(r.file_flags) for r in reports)

    lines.append("## Summary")
    lines.append("")
    lines.append(f"- **Total Events:** {len(reports)}")
    lines.append(f"- **Crypto Verified:** {verified + flagged}")
    lines.append(f"- **Crypto Failed:** {failed}")
    lines.append(f"- **With Flags:** {flagged}")
    lines.append(f"- **Total Flags:** {total_flags}")
    lines.append("")

    # Key Summary
    if keys:
        lines.append("## Key Summary")
        lines.append("")
        lines.append("| Key ID | First Seen | Last Seen | Events | Rot Out | Rot In | Status |")
        lines.append("|--------|------------|-----------|--------|---------|--------|--------|")

        for key_id, ki in sorted(keys.items(), key=lambda x: x[1].first_seen):
            status_parts = []
            if ki.reactivated:
                status_parts.append("**REACTIVATED**")
            if ki.continuity_broken:
                status_parts.append("**CONTINUITY BROKEN**")
            status = ", ".join(status_parts) if status_parts else "OK"

            lines.append(
                f"| `{key_id[:16]}...` | {ki.first_seen} | {ki.last_seen} | "
                f"{ki.event_count} | {ki.rotations_out} | {ki.rotations_in} | {status} |"
            )
        lines.append("")

    # Timeline
    lines.append("## Timeline")
    lines.append("")

    for report in reports:
        lines.append(f"### {report.occurred_at}")
        lines.append("")
        lines.append(f"**Action:** `{report.action}`")
        lines.append(f"**Intent:** {report.intent}")
        lines.append(f"**Actor:** {report.actor_type}:`{report.actor_id}`")
        lines.append(f"**Signing Key:** `{report.signing_key_id[:16]}...`")

        if report.tool:
            version = f" v{report.tool_version}" if report.tool_version else ""
            lines.append(f"**Tool:** {report.tool}{version}")

        if report.observation:
            obs_statement = report.observation.get("statement", "")
            lines.append(f"**Observation:** {obs_statement}")

        # Artifacts
        if report.inputs:
            lines.append("")
            lines.append("**Inputs:**")
            for a in report.inputs:
                loc = f" @ `{a.get('locator')}`" if a.get("locator") else ""
                lines.append(f"- `{a.get('artifact_id')}`: {a.get('digest', 'N/A')}{loc}")

        if report.outputs:
            lines.append("")
            lines.append("**Outputs:**")
            for a in report.outputs:
                loc = f" @ `{a.get('locator')}`" if a.get("locator") else ""
                lines.append(f"- `{a.get('artifact_id')}`: {a.get('digest', 'N/A')}{loc}")

        # Verification
        lines.append("")
        if report.crypto_status == "VERIFIED":
            lines.append("**Crypto:** VERIFIED")
        else:
            lines.append(f"**Crypto:** **FAILED** ({report.crypto_error})")

        if report.flags:
            lines.append(f"**Flags:** {', '.join(report.flags)}")
        if report.file_flags:
            lines.append(f"**File Flags:** {', '.join(report.file_flags)}")

        # Raw event
        if include_events and report.raw_event:
            lines.append("")
            lines.append("<details>")
            lines.append("<summary>Event JSON</summary>")
            lines.append("")
            lines.append("```json")
            lines.append(canonical_json(report.raw_event))
            lines.append("```")
            lines.append("</details>")

        # Citation (stable, grep-able)
        lines.append("")
        lines.append(f"CITE: {report.event_id} {report.event_digest}")
        lines.append("")
        lines.append("---")
        lines.append("")

    # Findings
    if flags_summary:
        lines.append("## Findings")
        lines.append("")
        lines.append("| Flag | Count | Explanation |")
        lines.append("|------|-------|-------------|")

        for fs in flags_summary:
            lines.append(f"| `{fs.flag}` | {fs.count} | {fs.explanation} |")

        lines.append("")

        for fs in flags_summary:
            lines.append(f"### {fs.flag}")
            lines.append("")
            lines.append(f"**Explanation:** {fs.explanation}")
            lines.append("")
            lines.append("**Impacted Events:**")
            for eid in fs.event_ids:
                lines.append(f"- `{eid}`")
            lines.append("")

    # Citations (all in one place for easy extraction)
    lines.append("## Citations")
    lines.append("")
    lines.append("```")
    for report in reports:
        lines.append(f"CITE: {report.event_id} {report.event_digest}")
    lines.append("```")
    lines.append("")

    # Appendix: Raw Events (when include_events is set)
    if include_events:
        has_raw_events = any(r.raw_event_bytes for r in reports)
        if has_raw_events:
            lines.append("## Appendix: Raw Events (Exact Store JSON)")
            lines.append("")
            for report in reports:
                if report.raw_event_bytes:
                    lines.append(f"### Event {report.event_id}")
                    lines.append("")
                    lines.append("```json")
                    # Verbatim JSON as stored - no formatting changes
                    lines.append(report.raw_event_bytes.decode("utf-8"))
                    lines.append("```")
                    lines.append("")

    # Footer
    lines.append("---")
    lines.append("")
    lines.append("*This testimony was generated by Witness. "
                 "Each event can be independently verified using its event_id and digest.*")

    return "\n".join(lines)


def render_text(
    reports: List[EventReport],
    keys: Dict[str, KeyInfo],
    flags_summary: List[FlagSummary],
    *,
    db_path: Optional[str] = None,
    filters: Optional[Dict[str, str]] = None,
    generated_at: Optional[str] = None,
) -> str:
    """Render testimony as plain text."""
    lines = []

    timestamp = generated_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    lines.append("=" * 60)
    lines.append("WITNESS TESTIMONY REPORT")
    lines.append("=" * 60)
    lines.append("")
    lines.append(f"Generated: {timestamp}")
    lines.append(f"Witness Version: {__version__}")
    if db_path:
        lines.append(f"Store: {db_path}")
    lines.append("")

    # Summary
    verified = sum(1 for r in reports if r.crypto_status == "VERIFIED" and not r.flags)
    flagged = sum(1 for r in reports if r.crypto_status == "VERIFIED" and r.flags)
    failed = sum(1 for r in reports if r.crypto_status == "FAILED_CRYPTO")

    lines.append(f"Events: {len(reports)} total, {verified} clean, {flagged} flagged, {failed} failed")
    lines.append("")

    # Events
    lines.append("-" * 60)
    lines.append("TIMELINE")
    lines.append("-" * 60)

    for report in reports:
        lines.append("")
        lines.append(f"[{report.occurred_at}] {report.action}")
        lines.append(f"  Intent: {report.intent}")
        lines.append(f"  Actor: {report.actor_type}:{report.actor_id}")
        lines.append(f"  Key: {report.signing_key_id[:16]}...")
        lines.append(f"  Crypto: {report.crypto_status}")
        if report.flags:
            lines.append(f"  Flags: {', '.join(report.flags)}")
        lines.append(f"  CITE: {report.event_id} {report.event_digest}")

    # Findings
    if flags_summary:
        lines.append("")
        lines.append("-" * 60)
        lines.append("FINDINGS")
        lines.append("-" * 60)

        for fs in flags_summary:
            lines.append("")
            lines.append(f"{fs.flag} ({fs.count} events)")
            lines.append(f"  {fs.explanation}")
            for eid in fs.event_ids:
                lines.append(f"    - {eid}")

    return "\n".join(lines)


def render_json(
    reports: List[EventReport],
    keys: Dict[str, KeyInfo],
    flags_summary: List[FlagSummary],
    exit_code: int,
    *,
    db_path: Optional[str] = None,
    filters: Optional[Dict[str, str]] = None,
    include_events: bool = False,
    generated_at: Optional[str] = None,
) -> str:
    """
    Render testimony as JSON matching testimony.schema.v0.1.json.

    The output is deterministic given the same inputs and generated_at.
    """
    timestamp = generated_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Build key_summary in schema format
    key_summary = []
    for key_id, ki in sorted(keys.items(), key=lambda x: x[1].first_seen):
        key_summary.append({
            "key_id": key_id,
            "first_seen": ki.first_seen,
            "last_seen": ki.last_seen,
            "rotations_out": ki.rotations_out,
            "rotations_in": ki.rotations_in,
            "continuity_broken": ki.continuity_broken,
            "reactivated": ki.reactivated,
        })

    # Build events in schema format
    events_list = []
    for r in reports:
        event_data = {
            "event_id": r.event_id,
            "occurred_at": r.occurred_at,
            "actor": {
                "type": r.actor_type,
                "id": r.actor_id,
            },
            "action": r.action,
            "intent": r.intent,
            "context": {
                "tool": r.tool,
                "tool_version": r.tool_version,
                "observation": r.observation,
            },
            "inputs": r.inputs,
            "outputs": r.outputs,
            "crypto": {
                "status": r.crypto_status,
                "event_digest": r.event_digest,
                "signature_ok": r.signature_ok,
            },
            "flags": r.flags + r.file_flags,
        }

        # Add raw_event when include_events is set
        if include_events and r.raw_event_bytes:
            import base64
            event_data["raw_event"] = {
                "encoding": "application/json",
                "source": "witness-store",
                "canonical": True,
                "bytes_base64": base64.b64encode(r.raw_event_bytes).decode("ascii"),
            }

        events_list.append(event_data)

    # Calculate summary stats
    crypto_verified = sum(1 for r in reports if r.crypto_status == "VERIFIED")
    crypto_failed = sum(1 for r in reports if r.crypto_status == "FAILED_CRYPTO")
    with_flags = sum(1 for r in reports if r.flags or r.file_flags)
    flags_total = sum(len(r.flags) + len(r.file_flags) for r in reports)

    # Build the testimony document
    data = {
        "schema_version": "0.1",
        "witness_version": __version__,
        "generated_at": timestamp,
        "source": {
            "store": "sqlite",
            "store_locator": db_path or "",
            "range": {
                "since": filters.get("since") if filters else None,
                "until": filters.get("until") if filters else None,
                "actor": filters.get("actor_id") if filters else None,
                "event_ids": [filters.get("event_id")] if filters and filters.get("event_id") else [],
            },
        },
        "summary": {
            "events_total": len(reports),
            "crypto_verified": crypto_verified,
            "crypto_failed": crypto_failed,
            "with_flags": with_flags,
            "flags_total": flags_total,
        },
        "key_summary": key_summary,
        "events": events_list,
        "findings": [
            {
                "flag": fs.flag,
                "count": fs.count,
                "event_ids": fs.event_ids,
                "explanation": fs.explanation,
            }
            for fs in flags_summary
        ],
        "exit_code": exit_code,
    }

    # Use canonical JSON for determinism
    return json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True)


def compute_file_digest(path: Path) -> str:
    """Compute SHA-256 digest of a file."""
    return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()


def emit_artifact(
    out_dir: Path,
    reports: List[EventReport],
    keys: Dict[str, KeyInfo],
    flags_summary: List[FlagSummary],
    exit_code: int,
    *,
    db_path: Optional[str] = None,
    filters: Optional[Dict[str, str]] = None,
    include_events: bool = False,
    generated_at: Optional[str] = None,
) -> List[ManifestArtifact]:
    """
    Emit testimony as artifacts with manifest.

    Creates:
    - testimony.json
    - testimony.md
    - testimony.manifest.json

    Returns list of ManifestArtifact.
    """
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Generate both formats with same timestamp
    timestamp = generated_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    json_content = render_json(
        reports, keys, flags_summary, exit_code,
        db_path=db_path,
        filters=filters,
        include_events=include_events,
        generated_at=timestamp,
    )

    md_content = render_markdown(
        reports, keys, flags_summary,
        db_path=db_path,
        filters=filters,
        include_events=include_events,
        generated_at=timestamp,
    )

    # Write files
    json_path = out_dir / "testimony.json"
    md_path = out_dir / "testimony.md"
    manifest_path = out_dir / "testimony.manifest.json"

    json_path.write_text(json_content, encoding="utf-8")
    md_path.write_text(md_content, encoding="utf-8")

    # Build manifest
    artifacts = [
        ManifestArtifact(
            path="testimony.json",
            digest=compute_file_digest(json_path),
            size_bytes=json_path.stat().st_size,
        ),
        ManifestArtifact(
            path="testimony.md",
            digest=compute_file_digest(md_path),
            size_bytes=md_path.stat().st_size,
        ),
    ]

    manifest = {
        "schema_version": "0.1",
        "artifacts": [
            {
                "path": a.path,
                "digest": a.digest,
                "size_bytes": a.size_bytes,
            }
            for a in artifacts
        ],
    }

    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    return artifacts


def testify(
    db_path: Path | str,
    *,
    since: Optional[str] = None,
    until: Optional[str] = None,
    event_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    format: str = "md",
    check_files: bool = False,
    include_events: bool = False,
    include_artifacts: bool = True,
    fail_on: str = "crypto",
    generated_at: Optional[str] = None,
    emit_artifact_dir: Optional[Path | str] = None,
) -> TestimonyResult:
    """
    Generate a testimony report.

    Args:
        db_path: Path to witness store
        since: Filter events since this timestamp
        until: Filter events until this timestamp
        event_id: Filter to specific event
        actor_id: Filter to specific actor
        format: Output format ("md", "text", "json")
        check_files: Verify artifact files exist and match digests
        include_events: Include raw event JSON in output
        include_artifacts: Include artifact details
        fail_on: When to fail ("crypto" = fail on crypto errors, "never" = always generate)
        generated_at: Override timestamp for deterministic output
        emit_artifact_dir: If set, emit testimony artifacts to this directory

    Returns:
        TestimonyResult with rendered text and metadata
    """
    db_path = Path(db_path)

    if not db_path.exists():
        return TestimonyResult(
            text=f"Error: Store not found: {db_path}",
            exit_code=1,
            event_count=0,
            verified_count=0,
            flagged_count=0,
            failed_count=0,
            flags_summary=[],
            format=format,
        )

    store = WitnessStore(db_path)
    try:
        reports, keys, flags_summary, exit_code = build_testimony(
            store,
            since=since,
            until=until,
            event_id=event_id,
            actor_id=actor_id,
            check_files=check_files,
            include_events=include_events,
            include_artifacts=include_artifacts,
        )
    finally:
        store.close()

    # Check fail_on policy
    failed_count = sum(1 for r in reports if r.crypto_status == "FAILED_CRYPTO")
    if fail_on == "crypto" and failed_count > 0:
        return TestimonyResult(
            text=f"Error: {failed_count} event(s) failed cryptographic verification. "
                 f"Cannot generate testimony. Use --fail-on never to override.",
            exit_code=3,
            event_count=len(reports),
            verified_count=sum(1 for r in reports if r.crypto_status == "VERIFIED"),
            flagged_count=sum(1 for r in reports if r.flags),
            failed_count=failed_count,
            flags_summary=flags_summary,
            format=format,
        )

    # Build filters dict for display
    filters = {
        "since": since,
        "until": until,
        "event_id": event_id,
        "actor_id": actor_id,
    }
    filters = {k: v for k, v in filters.items() if v}

    # Emit artifacts if requested
    if emit_artifact_dir:
        emit_artifact(
            Path(emit_artifact_dir),
            reports, keys, flags_summary, exit_code,
            db_path=str(db_path),
            filters=filters,
            include_events=include_events,
            generated_at=generated_at,
        )

    # Render
    if format == "json":
        text = render_json(
            reports, keys, flags_summary, exit_code,
            db_path=str(db_path),
            filters=filters,
            include_events=include_events,
            generated_at=generated_at,
        )
    elif format == "text":
        text = render_text(
            reports, keys, flags_summary,
            db_path=str(db_path),
            filters=filters,
            generated_at=generated_at,
        )
    else:  # md
        text = render_markdown(
            reports, keys, flags_summary,
            db_path=str(db_path),
            filters=filters,
            include_events=include_events,
            generated_at=generated_at,
        )

    return TestimonyResult(
        text=text,
        exit_code=exit_code,
        event_count=len(reports),
        verified_count=sum(1 for r in reports if r.crypto_status == "VERIFIED" and not r.flags),
        flagged_count=sum(1 for r in reports if r.flags),
        failed_count=failed_count,
        flags_summary=flags_summary,
        format=format,
    )
