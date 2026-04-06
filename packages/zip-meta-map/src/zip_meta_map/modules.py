"""Module (directory-level) summary generation."""

from __future__ import annotations

from collections import Counter

# Role labels for summary generation
_ROLE_LABELS: dict[str, str] = {
    "entrypoint": "entry point",
    "public_api": "public API surface",
    "source": "source code",
    "internal": "internal modules",
    "config": "configuration",
    "lockfile": "lock files",
    "ci": "CI/CD pipelines",
    "test": "tests",
    "fixture": "test fixtures",
    "doc": "documentation",
    "doc_api": "API documentation",
    "doc_architecture": "architecture docs",
    "schema": "schema definitions",
    "build": "build scripts",
    "script": "utility scripts",
    "generated": "generated output",
    "vendor": "vendored dependencies",
    "asset": "static assets",
    "data": "data files",
    "unknown": "unclassified files",
}

# Roles that mark a file as "key" within a module
_KEY_ROLES = {"entrypoint", "public_api", "config", "doc", "doc_architecture"}


def build_modules(file_entries: list[dict], min_files: int = 2) -> list[dict]:
    """Build module summaries from file entries.

    Groups files by their parent directory and generates a heuristic
    summary for each directory with at least `min_files` files.
    """
    # Group files by directory
    dir_files: dict[str, list[dict]] = {}
    for f in file_entries:
        path = f["path"]
        if "/" in path:
            dir_path = path.rsplit("/", 1)[0]
        else:
            dir_path = "."
        dir_files.setdefault(dir_path, []).append(f)

    modules: list[dict] = []
    for dir_path in sorted(dir_files):
        entries = dir_files[dir_path]
        if len(entries) < min_files:
            continue

        role_counts = Counter(f["role"] for f in entries)
        total_bytes = sum(f["size_bytes"] for f in entries)

        # Primary roles: top 3 by count, excluding unknown
        primary = [role for role, _ in role_counts.most_common(5) if role != "unknown"][:3]

        # Key files: entrypoints, configs, READMEs
        key = [f["path"] for f in entries if f["role"] in _KEY_ROLES][:5]

        # Heuristic summary
        summary = _generate_summary(dir_path, role_counts, key, entries)

        mod: dict = {
            "path": dir_path,
            "file_count": len(entries),
            "total_bytes": total_bytes,
            "primary_roles": primary,
        }
        if key:
            mod["key_files"] = key
        if summary:
            mod["summary"] = summary

        modules.append(mod)

    return modules


def _generate_summary(
    dir_path: str,
    role_counts: Counter,
    key_files: list[str],
    entries: list[dict],
) -> str:
    """Generate a heuristic summary string for a module."""
    parts: list[str] = []

    # What does this directory primarily contain?
    top_roles = [role for role, _ in role_counts.most_common(3) if role != "unknown"]
    if top_roles:
        labels = [_ROLE_LABELS.get(r, r) for r in top_roles]
        parts.append(f"Contains {', '.join(labels)}")

    # Mention entrypoints
    entry_files = [f["path"].rsplit("/", 1)[-1] for f in entries if f["role"] == "entrypoint"]
    if entry_files:
        parts.append(f"entry: {', '.join(entry_files[:2])}")

    # File count context
    count = len(entries)
    if count >= 20:
        parts.append(f"{count} files")
    elif count >= 10:
        parts.append(f"{count} files")

    return "; ".join(parts) if parts else ""
