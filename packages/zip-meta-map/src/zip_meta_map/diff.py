"""Index diffing — compare two META_ZIP_INDEX.json files."""

from __future__ import annotations

import json
from dataclasses import dataclass, field


@dataclass
class FileChange:
    """Describes what changed about a single file."""

    path: str
    changes: list[str] = field(default_factory=list)


@dataclass
class DiffResult:
    """Result of comparing two META_ZIP_INDEX.json dicts."""

    files_added: list[str] = field(default_factory=list)
    files_removed: list[str] = field(default_factory=list)
    files_modified: list[FileChange] = field(default_factory=list)
    profile_changed: tuple[str, str] | None = None
    start_here_added: list[str] = field(default_factory=list)
    start_here_removed: list[str] = field(default_factory=list)
    plans_added: list[str] = field(default_factory=list)
    plans_removed: list[str] = field(default_factory=list)
    plans_modified: list[str] = field(default_factory=list)
    capabilities_added: list[str] = field(default_factory=list)
    capabilities_removed: list[str] = field(default_factory=list)
    warnings_added: list[str] = field(default_factory=list)
    warnings_removed: list[str] = field(default_factory=list)
    modules_added: list[str] = field(default_factory=list)
    modules_removed: list[str] = field(default_factory=list)
    modules_modified: list[str] = field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        """True if any difference was detected."""
        return bool(
            self.files_added
            or self.files_removed
            or self.files_modified
            or self.profile_changed
            or self.start_here_added
            or self.start_here_removed
            or self.plans_added
            or self.plans_removed
            or self.plans_modified
            or self.capabilities_added
            or self.capabilities_removed
            or self.warnings_added
            or self.warnings_removed
            or self.modules_added
            or self.modules_removed
            or self.modules_modified
        )

    def to_dict(self) -> dict:
        """Serialize to a JSON-friendly dict."""
        d: dict = {
            "has_changes": self.has_changes,
            "files_added": self.files_added,
            "files_removed": self.files_removed,
            "files_modified": [{"path": fc.path, "changes": fc.changes} for fc in self.files_modified],
        }
        if self.profile_changed:
            d["profile_changed"] = {"old": self.profile_changed[0], "new": self.profile_changed[1]}
        d["start_here_added"] = self.start_here_added
        d["start_here_removed"] = self.start_here_removed
        d["plans_added"] = self.plans_added
        d["plans_removed"] = self.plans_removed
        d["plans_modified"] = self.plans_modified
        d["capabilities_added"] = self.capabilities_added
        d["capabilities_removed"] = self.capabilities_removed
        d["warnings_added"] = self.warnings_added
        d["warnings_removed"] = self.warnings_removed
        d["modules_added"] = self.modules_added
        d["modules_removed"] = self.modules_removed
        d["modules_modified"] = self.modules_modified
        return d


def diff_indices(old: dict, new: dict) -> DiffResult:
    """Compare two META_ZIP_INDEX.json dicts and return a DiffResult."""
    result = DiffResult()

    # Profile
    old_profile = old.get("profile", "")
    new_profile = new.get("profile", "")
    if old_profile != new_profile:
        result.profile_changed = (old_profile, new_profile)

    # Files
    old_files = {f["path"]: f for f in old.get("files", [])}
    new_files = {f["path"]: f for f in new.get("files", [])}

    old_paths = set(old_files.keys())
    new_paths = set(new_files.keys())

    result.files_added = sorted(new_paths - old_paths)
    result.files_removed = sorted(old_paths - new_paths)

    for path in sorted(old_paths & new_paths):
        changes = _compare_file_entries(old_files[path], new_files[path])
        if changes:
            result.files_modified.append(FileChange(path=path, changes=changes))

    # start_here
    old_sh = set(old.get("start_here", []))
    new_sh = set(new.get("start_here", []))
    result.start_here_added = sorted(new_sh - old_sh)
    result.start_here_removed = sorted(old_sh - new_sh)

    # Plans
    old_plans = old.get("plans", {})
    new_plans = new.get("plans", {})
    old_plan_names = set(old_plans.keys())
    new_plan_names = set(new_plans.keys())
    result.plans_added = sorted(new_plan_names - old_plan_names)
    result.plans_removed = sorted(old_plan_names - new_plan_names)
    for name in sorted(old_plan_names & new_plan_names):
        if not _plans_equal(old_plans[name], new_plans[name]):
            result.plans_modified.append(name)

    # Capabilities
    old_caps = set(old.get("capabilities", []))
    new_caps = set(new.get("capabilities", []))
    result.capabilities_added = sorted(new_caps - old_caps)
    result.capabilities_removed = sorted(old_caps - new_caps)

    # Warnings
    old_warns = set(old.get("warnings", []))
    new_warns = set(new.get("warnings", []))
    result.warnings_added = sorted(new_warns - old_warns)
    result.warnings_removed = sorted(old_warns - new_warns)

    # Modules
    old_mods = {m["path"]: m for m in old.get("modules", [])}
    new_mods = {m["path"]: m for m in new.get("modules", [])}
    old_mod_paths = set(old_mods.keys())
    new_mod_paths = set(new_mods.keys())
    result.modules_added = sorted(new_mod_paths - old_mod_paths)
    result.modules_removed = sorted(old_mod_paths - new_mod_paths)
    for path in sorted(old_mod_paths & new_mod_paths):
        if not _modules_equal(old_mods[path], new_mods[path]):
            result.modules_modified.append(path)

    return result


def _compare_file_entries(old: dict, new: dict) -> list[str]:
    """Compare two file entries and return a list of change descriptions."""
    changes: list[str] = []

    if old.get("sha256") != new.get("sha256"):
        changes.append("content changed")

    if old.get("role") != new.get("role"):
        changes.append(f"role: {old.get('role')} -> {new.get('role')}")

    old_size = old.get("size_bytes", 0)
    new_size = new.get("size_bytes", 0)
    if old_size != new_size:
        changes.append(f"size: {old_size} -> {new_size}")

    old_conf = old.get("confidence", 0)
    new_conf = new.get("confidence", 0)
    if old_conf != new_conf:
        changes.append(f"confidence: {old_conf} -> {new_conf}")

    old_flags = set(old.get("risk_flags", []))
    new_flags = set(new.get("risk_flags", []))
    added_flags = sorted(new_flags - old_flags)
    removed_flags = sorted(old_flags - new_flags)
    if added_flags:
        changes.append(f"risk_flags added: {', '.join(added_flags)}")
    if removed_flags:
        changes.append(f"risk_flags removed: {', '.join(removed_flags)}")

    return changes


def _plans_equal(old: dict, new: dict) -> bool:
    """Check if two plan dicts are equal."""
    return (
        old.get("description") == new.get("description")
        and old.get("steps") == new.get("steps")
        and old.get("budget_bytes") == new.get("budget_bytes")
        and old.get("max_total_bytes") == new.get("max_total_bytes")
        and old.get("stop_after") == new.get("stop_after")
    )


def _modules_equal(old: dict, new: dict) -> bool:
    """Check if two module dicts are equal."""
    return (
        old.get("file_count") == new.get("file_count")
        and old.get("primary_roles") == new.get("primary_roles")
        and old.get("summary") == new.get("summary")
        and old.get("total_bytes") == new.get("total_bytes")
    )


def format_diff_human(result: DiffResult) -> str:
    """Format a DiffResult as human-readable text for terminal output."""
    if not result.has_changes:
        return "No changes detected."

    parts: list[str] = []

    # Profile
    if result.profile_changed:
        old, new = result.profile_changed
        parts.append(f"Profile: {old} -> {new}")

    # Files summary line
    counts = []
    if result.files_added:
        counts.append(f"+{len(result.files_added)} added")
    if result.files_removed:
        counts.append(f"-{len(result.files_removed)} removed")
    if result.files_modified:
        counts.append(f"~{len(result.files_modified)} modified")
    if counts:
        parts.append(f"Files: {', '.join(counts)}")

    # File details
    if result.files_added:
        parts.append("")
        parts.append("Added:")
        for path in result.files_added:
            parts.append(f"  + {path}")

    if result.files_removed:
        parts.append("")
        parts.append("Removed:")
        for path in result.files_removed:
            parts.append(f"  - {path}")

    if result.files_modified:
        parts.append("")
        parts.append("Modified:")
        for fc in result.files_modified:
            parts.append(f"  ~ {fc.path}")
            for change in fc.changes:
                parts.append(f"    - {change}")

    # start_here
    if result.start_here_added or result.start_here_removed:
        sh_counts = []
        if result.start_here_added:
            sh_counts.append(f"+{len(result.start_here_added)} added")
        if result.start_here_removed:
            sh_counts.append(f"-{len(result.start_here_removed)} removed")
        parts.append("")
        parts.append(f"Start Here: {', '.join(sh_counts)}")
        for path in result.start_here_added:
            parts.append(f"  + {path}")
        for path in result.start_here_removed:
            parts.append(f"  - {path}")

    # Plans
    if result.plans_added or result.plans_removed or result.plans_modified:
        plan_counts = []
        if result.plans_added:
            plan_counts.append(f"+{len(result.plans_added)} added")
        if result.plans_removed:
            plan_counts.append(f"-{len(result.plans_removed)} removed")
        if result.plans_modified:
            plan_counts.append(f"~{len(result.plans_modified)} modified")
        parts.append("")
        parts.append(f"Plans: {', '.join(plan_counts)}")
        for name in result.plans_added:
            parts.append(f"  + {name}")
        for name in result.plans_removed:
            parts.append(f"  - {name}")
        for name in result.plans_modified:
            parts.append(f"  ~ {name}")

    # Capabilities
    if result.capabilities_added or result.capabilities_removed:
        cap_counts = []
        if result.capabilities_added:
            cap_counts.append(f"+{len(result.capabilities_added)} added")
        if result.capabilities_removed:
            cap_counts.append(f"-{len(result.capabilities_removed)} removed")
        parts.append("")
        parts.append(f"Capabilities: {', '.join(cap_counts)}")
        for cap in result.capabilities_added:
            parts.append(f"  + {cap}")
        for cap in result.capabilities_removed:
            parts.append(f"  - {cap}")

    # Warnings
    if result.warnings_added or result.warnings_removed:
        warn_counts = []
        if result.warnings_added:
            warn_counts.append(f"+{len(result.warnings_added)} added")
        if result.warnings_removed:
            warn_counts.append(f"-{len(result.warnings_removed)} removed")
        parts.append("")
        parts.append(f"Warnings: {', '.join(warn_counts)}")
        for w in result.warnings_added:
            parts.append(f"  + {w}")
        for w in result.warnings_removed:
            parts.append(f"  - {w}")

    # Modules
    if result.modules_added or result.modules_removed or result.modules_modified:
        mod_counts = []
        if result.modules_added:
            mod_counts.append(f"+{len(result.modules_added)} added")
        if result.modules_removed:
            mod_counts.append(f"-{len(result.modules_removed)} removed")
        if result.modules_modified:
            mod_counts.append(f"~{len(result.modules_modified)} modified")
        parts.append("")
        parts.append(f"Modules: {', '.join(mod_counts)}")
        for path in result.modules_added:
            parts.append(f"  + {path}")
        for path in result.modules_removed:
            parts.append(f"  - {path}")
        for path in result.modules_modified:
            parts.append(f"  ~ {path}")

    return "\n".join(parts)


def format_diff_json(result: DiffResult) -> str:
    """Format a DiffResult as a JSON string."""
    return json.dumps(result.to_dict(), indent=2)
