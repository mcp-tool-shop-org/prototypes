"""Core builder — generates META_ZIP_FRONT.md and META_ZIP_INDEX.json."""

from __future__ import annotations

import json
from fnmatch import fnmatch
from pathlib import Path

import jsonschema

from zip_meta_map import __version__
from zip_meta_map.chunker import chunk_text, is_chunkable
from zip_meta_map.modules import build_modules
from zip_meta_map.profiles import ALL_PROFILES, DEFAULT_PROFILE, Profile
from zip_meta_map.roles import RoleAssignment, assign_role
from zip_meta_map.safety import detect_risk_flags, detect_warnings
from zip_meta_map.scanner import ScannedFile, scan_directory, scan_zip
from zip_meta_map.schema import load_index_schema, load_policy_schema

# Max lines to use for an excerpt
_EXCERPT_MAX_LINES = 8
_EXCERPT_MAX_BYTES = 1024

# Roles considered high-value for start_here ranking (order = priority)
_START_HERE_ROLE_PRIORITY: dict[str, int] = {
    "entrypoint": 0,
    "doc": 1,
    "doc_architecture": 2,
    "config": 3,
    "public_api": 4,
}

# Files that are always good start_here candidates regardless of role
_START_HERE_NAMES: dict[str, int] = {
    "README.md": 0,
    "README.rst": 0,
    "ARCHITECTURE.md": 1,
    "DESIGN.md": 2,
}


def detect_profile(files: list[ScannedFile]) -> Profile:
    """Auto-detect a profile from the file listing.

    Detection order: monorepo first (most specific workspace markers),
    then language-specific profiles by specificity.
    """
    paths = {f.path for f in files}
    names = {f.path.rsplit("/", 1)[-1] if "/" in f.path else f.path for f in files}

    # Check monorepo indicators first (highest priority)
    monorepo = ALL_PROFILES["monorepo"]
    for detect_file in monorepo.detect_files:
        if detect_file in paths:
            return monorepo

    # Detection order: Rust > Go > .NET > Java > Node/TS > Python
    # (more specific markers first)
    detection_order = ["rust_cli", "go_cli", "dotnet_cli", "java_cli", "node_ts_tool", "python_cli"]
    for profile_name in detection_order:
        profile = ALL_PROFILES[profile_name]
        for detect_file in profile.detect_files:
            # Support glob-style detect files (e.g., "*.csproj")
            if "*" in detect_file:
                from fnmatch import fnmatch

                if any(fnmatch(n, detect_file) for n in names):
                    return profile
            elif detect_file in paths:
                return profile

    return DEFAULT_PROFILE


def _rank_start_here(path: str, assignment: RoleAssignment, profile: Profile) -> tuple[int, str]:
    """Return a sort key for start_here ranking. Lower = read first."""
    name = path.rsplit("/", 1)[-1] if "/" in path else path

    # Named files get highest priority
    if name in _START_HERE_NAMES:
        return (_START_HERE_NAMES[name], path)

    # Profile entrypoints
    for pattern in profile.entrypoint_patterns:
        if fnmatch(path, pattern):
            return (3, path)

    # Role-based priority
    if assignment.role in _START_HERE_ROLE_PRIORITY:
        return (_START_HERE_ROLE_PRIORITY[assignment.role] + 5, path)

    # Everything else sorts to the end
    return (100, path)


def _find_start_here(
    files: list[ScannedFile],
    assignments: dict[str, RoleAssignment],
    profile: Profile,
) -> list[str]:
    """Determine start_here files from scanned files, ranked by usefulness."""
    candidates: list[tuple[tuple[int, str], str]] = []

    for f in files:
        a = assignments[f.path]
        name = f.path.rsplit("/", 1)[-1] if "/" in f.path else f.path

        # Include if: entrypoint, profile extra, architecture doc, or named start file
        is_candidate = (
            a.role == "entrypoint"
            or a.role == "doc_architecture"
            or name in _START_HERE_NAMES
            or f.path in profile.start_here_extras
        )
        if is_candidate:
            rank = _rank_start_here(f.path, a, profile)
            candidates.append((rank, f.path))

    # Also include profile extras that exist but weren't caught above
    existing_paths = {f.path for f in files}
    for extra in profile.start_here_extras:
        if extra in existing_paths and not any(c[1] == extra for c in candidates):
            a = assignments[extra]
            rank = _rank_start_here(extra, a, profile)
            candidates.append((rank, extra))

    candidates.sort(key=lambda x: x[0])
    return [path for _, path in candidates]


def load_policy(policy_path: Path) -> dict:
    """Load and validate a META_ZIP_POLICY.json file."""
    data = json.loads(policy_path.read_text(encoding="utf-8"))
    schema = load_policy_schema()
    jsonschema.validate(instance=data, schema=schema)
    return data


def _apply_policy_to_ignores(profile_ignores: list[str], policy: dict) -> list[str]:
    """Merge policy ignore_extra patterns into the profile ignores."""
    extra = policy.get("ignore_extra", [])
    if not extra:
        return profile_ignores
    combined = list(profile_ignores)
    for pattern in extra:
        if pattern not in combined:
            combined.append(pattern)
    return combined


def _apply_policy_to_plans(plans: dict, policy: dict) -> dict:
    """Apply policy budget overrides to plan dicts."""
    budgets = policy.get("plan_budgets", {})
    if not budgets:
        return plans
    updated = {}
    for name, plan in plans.items():
        if name in budgets:
            plan = dict(plan)
            plan["max_total_bytes"] = budgets[name]
        updated[name] = plan
    return updated


def _extract_excerpt(content: bytes | None, path: str) -> str | None:
    """Extract a safe excerpt from file content.

    Returns the first N lines of text, truncated to _EXCERPT_MAX_BYTES.
    Only works on text files that can be decoded as UTF-8.
    """
    if content is None:
        return None

    try:
        text = content.decode("utf-8", errors="strict")
    except UnicodeDecodeError:
        return None

    lines = text.splitlines()
    if not lines:
        return None

    excerpt_lines = lines[:_EXCERPT_MAX_LINES]
    excerpt = "\n".join(excerpt_lines)

    # Truncate if too long
    if len(excerpt.encode("utf-8")) > _EXCERPT_MAX_BYTES:
        excerpt = excerpt[:_EXCERPT_MAX_BYTES]
        # Don't cut in the middle of a line
        last_nl = excerpt.rfind("\n")
        if last_nl > 0:
            excerpt = excerpt[:last_nl]

    return excerpt if excerpt.strip() else None


def build_index(
    files: list[ScannedFile],
    profile: Profile,
    project_name: str,
    policy: dict | None = None,
) -> dict:
    """Build the META_ZIP_INDEX.json content."""
    # Assign roles to all files
    assignments: dict[str, RoleAssignment] = {}
    for f in files:
        assignments[f.path] = assign_role(f.path, profile)

    # Determine start_here for excerpt generation
    start_here = _find_start_here(files, assignments, profile)
    start_here_set = set(start_here)

    file_entries = []
    for f in files:
        a = assignments[f.path]
        entry: dict = {
            "path": f.path,
            "size_bytes": f.size_bytes,
            "sha256": f.sha256,
            "role": a.role,
            "confidence": round(a.confidence, 2),
        }
        if a.reason:
            entry["reason"] = a.reason

        # Chunk large text files
        if is_chunkable(f.path, f.size_bytes) and f.content is not None:
            try:
                text = f.content.decode("utf-8", errors="strict")
                chunks = chunk_text(text)
                if chunks:
                    entry["chunks"] = [c.to_dict() for c in chunks]
            except UnicodeDecodeError:
                pass

        # Excerpt for start_here files and high-value files
        if f.path in start_here_set or a.role in ("entrypoint", "doc", "doc_architecture"):
            excerpt = _extract_excerpt(f.content, f.path)
            if excerpt:
                entry["excerpt"] = excerpt

        # Risk flags
        risk_flags = detect_risk_flags(f.path, f.content, f.size_bytes)
        if risk_flags:
            entry["risk_flags"] = risk_flags

        file_entries.append(entry)

    plans = {name: plan.to_dict() for name, plan in profile.plans.items()}

    # Apply policy overrides
    if policy:
        plans = _apply_policy_to_plans(plans, policy)

    # Build module summaries
    modules = build_modules(file_entries)

    # Generate safety warnings
    warnings = detect_warnings(file_entries, profile.ignore_globs)

    index: dict = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": f"zip-meta-map/{__version__}",
        "profile": profile.name,
        "start_here": start_here,
        "ignore": profile.ignore_globs,
        "files": file_entries,
        "plans": plans,
    }

    if modules:
        index["modules"] = modules

    if warnings:
        index["warnings"] = warnings

    if policy is not None:
        index["policy_applied"] = True

    # Capabilities: advertise which optional features are populated
    caps: list[str] = []
    if any(f.get("chunks") for f in file_entries):
        caps.append("chunks")
    if any(f.get("excerpt") for f in file_entries):
        caps.append("excerpts")
    if modules:
        caps.append("modules")
    if any(f.get("risk_flags") for f in file_entries):
        caps.append("risk_flags")
    if warnings:
        caps.append("warnings")
    if caps:
        index["capabilities"] = caps

    # Advertise custom roles if the profile defines any
    if profile.custom_roles:
        index["custom_roles"] = {cr.name: cr.description for cr in profile.custom_roles}

    return index


def validate_index(index: dict) -> None:
    """Validate index against JSON Schema. Raises jsonschema.ValidationError on failure."""
    schema = load_index_schema()
    jsonschema.validate(instance=index, schema=schema)


def build_front(index: dict, project_name: str) -> str:
    """Build the META_ZIP_FRONT.md content."""
    file_count = len(index["files"])
    start_here = index["start_here"]
    profile = index["profile"]
    generated_by = index["generated_by"]

    # Start here list with reasons
    start_lines = []
    file_map = {f["path"]: f for f in index["files"]}
    for path in start_here:
        entry = file_map.get(path)
        if entry and entry.get("reason"):
            start_lines.append(f"- `{path}` \u2014 {entry['reason']}")
        else:
            start_lines.append(f"- `{path}`")
    start_list = "\n".join(start_lines) if start_lines else "- (none detected)"

    # Role summary
    role_counts: dict[str, int] = {}
    for f in index["files"]:
        role_counts[f["role"]] = role_counts.get(f["role"], 0) + 1
    role_summary = ", ".join(f"{count} {role}" for role, count in sorted(role_counts.items(), key=lambda x: -x[1]))

    # Module summary
    modules_section = _build_modules_section(index)

    # Guardrails
    guardrails = _build_guardrails(index)

    return f"""# {project_name}

> Auto-generated metadata by {generated_by}

## Summary

- **Profile**: `{profile}`
- **Files indexed**: {file_count}
- **Spec version**: {index["version"]}
- **Roles**: {role_summary}

## Start here

{start_list}

## Plans

{_format_plans(index["plans"])}

{modules_section}{guardrails}---

*This file is for humans. Agents should prefer `META_ZIP_INDEX.json`.*
"""


def _build_modules_section(index: dict) -> str:
    """Generate the modules section for FRONT.md."""
    modules = index.get("modules", [])
    if not modules:
        return ""

    lines = ["## Modules\n"]
    for mod in modules:
        path = mod["path"]
        file_count = mod["file_count"]
        primary = ", ".join(mod.get("primary_roles", []))
        summary = mod.get("summary", "")
        line = f"- `{path}/` ({file_count} files"
        if primary:
            line += f", {primary}"
        line += ")"
        if summary:
            line += f" \u2014 {summary}"
        lines.append(line)

    lines.append("\n")
    return "\n".join(lines)


def _build_guardrails(index: dict) -> str:
    """Generate guardrail notes about what to avoid."""
    lines: list[str] = []

    # Warn about generated/vendor dirs
    generated = [f["path"] for f in index["files"] if f["role"] in ("generated", "vendor")]
    if generated:
        dirs = sorted({p.rsplit("/", 1)[0] if "/" in p else p for p in generated})
        lines.append("## Guardrails\n")
        lines.append("The following directories contain generated or vendored code \u2014 avoid modifying:\n")
        for d in dirs[:5]:
            lines.append(f"- `{d}/`")

    # Warn about low-confidence files
    low_conf = [f for f in index["files"] if f["confidence"] < 0.5]
    if low_conf:
        if not lines:
            lines.append("## Guardrails\n")
        lines.append(
            f"\n{len(low_conf)} file(s) have low classification confidence (< 0.5) \u2014 verify roles manually."
        )

    # Include safety warnings
    warnings = index.get("warnings", [])
    if warnings:
        if not lines:
            lines.append("## Guardrails\n")
        lines.append("\n**Safety warnings:**\n")
        for w in warnings:
            lines.append(f"- {w}")

    if lines:
        lines.append("\n")
    return "\n".join(lines)


def _format_plans(plans: dict) -> str:
    parts = []
    for name, plan in plans.items():
        steps = "\n".join(f"   {i + 1}. {s}" for i, s in enumerate(plan["steps"]))
        budget_note = ""
        if plan.get("max_total_bytes"):
            kb = plan["max_total_bytes"] // 1024
            budget_note = f" (budget: ~{kb} KB)"
        parts.append(f"### `{name}`{budget_note}\n\n{plan['description']}\n\n{steps}")
    return "\n\n".join(parts)


def build(
    input_path: Path,
    output_dir: Path | None = None,
    profile_name: str | None = None,
    policy_path: Path | None = None,
) -> tuple[str, dict]:
    """
    Main build entry point.

    Args:
        input_path: Path to a directory or ZIP file.
        output_dir: If set, write output files here. Otherwise just return them.
        profile_name: Force a specific profile. Auto-detect if None.
        policy_path: Optional path to a META_ZIP_POLICY.json file.

    Returns:
        Tuple of (front_md, index_dict).
    """
    input_path = input_path.resolve()

    # Load policy if provided
    policy = None
    if policy_path:
        policy = load_policy(policy_path.resolve())

    if input_path.is_dir():
        project_name = input_path.name
        if profile_name:
            profile = ALL_PROFILES[profile_name]
        else:
            preliminary = scan_directory(input_path, [".git/**"])
            profile = detect_profile(preliminary)
        ignore_globs = profile.ignore_globs
        if policy:
            ignore_globs = _apply_policy_to_ignores(ignore_globs, policy)
        files = scan_directory(input_path, ignore_globs, retain_content=True)
    elif input_path.suffix == ".zip":
        project_name = input_path.stem
        if profile_name:
            profile = ALL_PROFILES[profile_name]
        else:
            preliminary = scan_zip(input_path, [".git/**"])
            profile = detect_profile(preliminary)
        ignore_globs = profile.ignore_globs
        if policy:
            ignore_globs = _apply_policy_to_ignores(ignore_globs, policy)
        files = scan_zip(input_path, ignore_globs, retain_content=True)
    else:
        raise ValueError(f"Input must be a directory or .zip file, got: {input_path}")

    index = build_index(files, profile, project_name, policy=policy)
    validate_index(index)
    front = build_front(index, project_name)

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "META_ZIP_FRONT.md").write_text(front, encoding="utf-8")
        (output_dir / "META_ZIP_INDEX.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")

    return front, index
