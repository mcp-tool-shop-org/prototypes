"""Cross-repo comparison — find structural similarities between two project indexes."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from math import sqrt


@dataclass
class CompareResult:
    """Result of comparing two indexes from different repos."""

    # Identity
    left_profile: str = ""
    right_profile: str = ""
    left_file_count: int = 0
    right_file_count: int = 0

    # Similarity scores (0.0–1.0)
    role_similarity: float = 0.0
    plan_similarity: float = 0.0
    structure_similarity: float = 0.0
    overall_similarity: float = 0.0

    # Role distribution comparison
    shared_roles: list[str] = field(default_factory=list)
    left_only_roles: list[str] = field(default_factory=list)
    right_only_roles: list[str] = field(default_factory=list)
    role_distribution: dict[str, dict[str, float]] = field(default_factory=dict)

    # Structural matches
    shared_filenames: list[str] = field(default_factory=list)
    shared_patterns: list[str] = field(default_factory=list)

    # Plan comparison
    shared_plans: list[str] = field(default_factory=list)
    left_only_plans: list[str] = field(default_factory=list)
    right_only_plans: list[str] = field(default_factory=list)

    @property
    def archetype_match(self) -> str:
        """Classify the similarity level."""
        if self.overall_similarity >= 0.85:
            return "near_identical"
        if self.overall_similarity >= 0.65:
            return "same_archetype"
        if self.overall_similarity >= 0.40:
            return "related"
        return "different"

    def to_dict(self) -> dict:
        return {
            "left_profile": self.left_profile,
            "right_profile": self.right_profile,
            "left_file_count": self.left_file_count,
            "right_file_count": self.right_file_count,
            "similarity": {
                "role": round(self.role_similarity, 3),
                "plan": round(self.plan_similarity, 3),
                "structure": round(self.structure_similarity, 3),
                "overall": round(self.overall_similarity, 3),
            },
            "archetype_match": self.archetype_match,
            "roles": {
                "shared": self.shared_roles,
                "left_only": self.left_only_roles,
                "right_only": self.right_only_roles,
                "distribution": self.role_distribution,
            },
            "structure": {
                "shared_filenames": self.shared_filenames,
                "shared_patterns": self.shared_patterns,
            },
            "plans": {
                "shared": self.shared_plans,
                "left_only": self.left_only_plans,
                "right_only": self.right_only_plans,
            },
        }


def _role_distribution(files: list[dict]) -> dict[str, float]:
    """Calculate role percentage distribution."""
    if not files:
        return {}
    counts: dict[str, int] = {}
    for f in files:
        role = f.get("role", "unknown")
        counts[role] = counts.get(role, 0) + 1
    total = len(files)
    return {role: count / total for role, count in sorted(counts.items())}


def _cosine_similarity(a: dict[str, float], b: dict[str, float]) -> float:
    """Cosine similarity between two distribution dicts."""
    all_keys = set(a.keys()) | set(b.keys())
    if not all_keys:
        return 0.0
    dot = sum(a.get(k, 0.0) * b.get(k, 0.0) for k in all_keys)
    mag_a = sqrt(sum(v * v for v in a.values()))
    mag_b = sqrt(sum(v * v for v in b.values()))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _jaccard(a: set, b: set) -> float:
    """Jaccard similarity between two sets."""
    if not a and not b:
        return 1.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def _extract_filenames(files: list[dict]) -> set[str]:
    """Extract just the filename (leaf) from all paths."""
    names: set[str] = set()
    for f in files:
        path = f.get("path", "")
        name = path.rsplit("/", 1)[-1] if "/" in path else path
        names.add(name)
    return names


def _extract_dir_patterns(files: list[dict]) -> set[str]:
    """Extract top-level directory names as structural patterns."""
    dirs: set[str] = set()
    for f in files:
        path = f.get("path", "")
        parts = path.split("/")
        if len(parts) >= 2:
            dirs.add(parts[0])
    return dirs


def compare_indices(left: dict, right: dict) -> CompareResult:
    """Compare two META_ZIP_INDEX.json dicts from different repos.

    Produces similarity scores and structural comparison.
    """
    result = CompareResult()

    left_files = left.get("files", [])
    right_files = right.get("files", [])

    result.left_profile = left.get("profile", "unknown")
    result.right_profile = right.get("profile", "unknown")
    result.left_file_count = len(left_files)
    result.right_file_count = len(right_files)

    # Role distribution comparison
    left_dist = _role_distribution(left_files)
    right_dist = _role_distribution(right_files)

    left_roles = set(left_dist.keys())
    right_roles = set(right_dist.keys())
    result.shared_roles = sorted(left_roles & right_roles)
    result.left_only_roles = sorted(left_roles - right_roles)
    result.right_only_roles = sorted(right_roles - left_roles)
    result.role_distribution = {
        role: {
            "left": round(left_dist.get(role, 0.0), 3),
            "right": round(right_dist.get(role, 0.0), 3),
        }
        for role in sorted(left_roles | right_roles)
    }
    result.role_similarity = _cosine_similarity(left_dist, right_dist)

    # Structural comparison (filenames, directory patterns)
    left_names = _extract_filenames(left_files)
    right_names = _extract_filenames(right_files)
    result.shared_filenames = sorted(left_names & right_names)

    left_dirs = _extract_dir_patterns(left_files)
    right_dirs = _extract_dir_patterns(right_files)
    result.shared_patterns = sorted(left_dirs & right_dirs)

    result.structure_similarity = _jaccard(left_names, right_names) * 0.6 + _jaccard(left_dirs, right_dirs) * 0.4

    # Plan comparison
    left_plans = set(left.get("plans", {}).keys())
    right_plans = set(right.get("plans", {}).keys())
    result.shared_plans = sorted(left_plans & right_plans)
    result.left_only_plans = sorted(left_plans - right_plans)
    result.right_only_plans = sorted(right_plans - left_plans)
    result.plan_similarity = _jaccard(left_plans, right_plans)

    # Overall similarity (weighted blend)
    result.overall_similarity = (
        result.role_similarity * 0.50 + result.structure_similarity * 0.30 + result.plan_similarity * 0.20
    )

    return result


def format_compare_human(result: CompareResult) -> str:
    """Format a CompareResult as human-readable text."""
    lines: list[str] = []

    lines.append(f"Profiles: {result.left_profile} vs {result.right_profile}")
    lines.append(f"Files:    {result.left_file_count} vs {result.right_file_count}")
    lines.append("")
    lines.append(f"Overall similarity: {result.overall_similarity:.1%}  ({result.archetype_match})")
    lines.append(f"  Role similarity:      {result.role_similarity:.1%}")
    lines.append(f"  Structure similarity:  {result.structure_similarity:.1%}")
    lines.append(f"  Plan similarity:       {result.plan_similarity:.1%}")

    # Shared roles
    if result.shared_roles:
        lines.append("")
        lines.append(f"Shared roles ({len(result.shared_roles)}):")
        for role in result.shared_roles:
            left_pct = result.role_distribution.get(role, {}).get("left", 0)
            right_pct = result.role_distribution.get(role, {}).get("right", 0)
            lines.append(f"  {role:20s}  {left_pct:5.1%} vs {right_pct:5.1%}")

    if result.left_only_roles:
        lines.append("")
        lines.append(f"Roles only in left: {', '.join(result.left_only_roles)}")
    if result.right_only_roles:
        lines.append(f"Roles only in right: {', '.join(result.right_only_roles)}")

    # Shared structure
    if result.shared_patterns:
        lines.append("")
        lines.append(f"Shared directory patterns: {', '.join(result.shared_patterns)}")

    if result.shared_filenames:
        shown = result.shared_filenames[:10]
        lines.append(f"Shared filenames ({len(result.shared_filenames)}): {', '.join(shown)}")
        if len(result.shared_filenames) > 10:
            lines.append(f"  ... and {len(result.shared_filenames) - 10} more")

    # Plans
    if result.shared_plans:
        lines.append("")
        lines.append(f"Shared plans: {', '.join(result.shared_plans)}")

    return "\n".join(lines)


def format_compare_json(result: CompareResult) -> str:
    """Format a CompareResult as JSON."""
    return json.dumps(result.to_dict(), indent=2)
