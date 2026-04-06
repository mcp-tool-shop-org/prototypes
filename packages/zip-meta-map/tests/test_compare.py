"""Tests for cross-repo comparison (archetype matching)."""

from __future__ import annotations

import json

from zip_meta_map.compare import (
    CompareResult,
    _cosine_similarity,
    _jaccard,
    _role_distribution,
    compare_indices,
    format_compare_human,
    format_compare_json,
)


def _minimal_index(profile: str = "python_cli", files: list[dict] | None = None, **overrides) -> dict:
    base: dict = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "zip-meta-map/test",
        "profile": profile,
        "start_here": ["README.md"],
        "ignore": [".git/**"],
        "files": files
        or [
            {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
            {"path": "src/main.py", "size_bytes": 200, "sha256": "b" * 64, "role": "entrypoint", "confidence": 0.9},
            {"path": "tests/test_main.py", "size_bytes": 150, "sha256": "c" * 64, "role": "test", "confidence": 0.85},
        ],
        "plans": {
            "overview": {"description": "Quick overview", "steps": ["READ README.md"]},
            "debug": {"description": "Debug", "steps": ["READ src/"]},
            "deep_dive": {"description": "Deep dive", "steps": ["READ all"]},
        },
    }
    base.update(overrides)
    return base


# ── Helper tests ──


def test_cosine_similarity_identical():
    a = {"doc": 0.5, "source": 0.3, "test": 0.2}
    assert _cosine_similarity(a, a) > 0.99


def test_cosine_similarity_orthogonal():
    a = {"doc": 1.0}
    b = {"source": 1.0}
    assert _cosine_similarity(a, b) == 0.0


def test_cosine_similarity_empty():
    assert _cosine_similarity({}, {}) == 0.0


def test_jaccard_identical():
    assert _jaccard({"a", "b", "c"}, {"a", "b", "c"}) == 1.0


def test_jaccard_disjoint():
    assert _jaccard({"a"}, {"b"}) == 0.0


def test_jaccard_empty():
    assert _jaccard(set(), set()) == 1.0


def test_role_distribution():
    files = [
        {"role": "doc"},
        {"role": "doc"},
        {"role": "source"},
    ]
    dist = _role_distribution(files)
    assert abs(dist["doc"] - 2 / 3) < 0.01
    assert abs(dist["source"] - 1 / 3) < 0.01


# ── Comparison tests ──


def test_identical_indices():
    idx = _minimal_index()
    result = compare_indices(idx, idx)
    assert result.overall_similarity > 0.99
    assert result.archetype_match == "near_identical"
    assert result.shared_roles == sorted(["doc", "entrypoint", "test"])


def test_same_profile_different_files():
    left = _minimal_index()
    right = _minimal_index(
        files=[
            {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
            {"path": "src/app.py", "size_bytes": 300, "sha256": "d" * 64, "role": "source", "confidence": 0.8},
            {"path": "tests/test_app.py", "size_bytes": 200, "sha256": "e" * 64, "role": "test", "confidence": 0.85},
        ]
    )
    result = compare_indices(left, right)
    # Overlapping roles (doc, test) but different (entrypoint vs source) → moderate similarity
    assert result.role_similarity > 0.5
    assert "README.md" in result.shared_filenames


def test_different_profiles():
    left = _minimal_index(profile="python_cli")
    right = _minimal_index(
        profile="rust_cli",
        files=[
            {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
            {"path": "src/main.rs", "size_bytes": 200, "sha256": "f" * 64, "role": "entrypoint", "confidence": 0.9},
            {"path": "Cargo.toml", "size_bytes": 150, "sha256": "g" * 64, "role": "config", "confidence": 0.95},
        ],
    )
    result = compare_indices(left, right)
    assert result.left_profile == "python_cli"
    assert result.right_profile == "rust_cli"
    # Still some similarity (both have doc + entrypoint)
    assert result.role_similarity > 0.5


def test_completely_different():
    left = _minimal_index(
        files=[
            {"path": "data.csv", "size_bytes": 1000, "sha256": "a" * 64, "role": "data", "confidence": 0.75},
        ],
        plans={},
    )
    right = _minimal_index(
        files=[
            {"path": "main.rs", "size_bytes": 500, "sha256": "b" * 64, "role": "source", "confidence": 0.6},
        ],
        plans={"overview": {"description": "test", "steps": ["READ"]}},
    )
    result = compare_indices(left, right)
    assert result.archetype_match == "different"


def test_shared_plans():
    left = _minimal_index()
    right = _minimal_index(
        plans={
            "overview": {"description": "Quick overview", "steps": ["READ README.md"]},
            "deep_dive": {"description": "Deep dive", "steps": ["READ all"]},
            "custom": {"description": "Custom plan", "steps": ["DO stuff"]},
        }
    )
    result = compare_indices(left, right)
    assert "overview" in result.shared_plans
    assert "deep_dive" in result.shared_plans
    assert "custom" in result.right_only_plans
    assert "debug" in result.left_only_plans


def test_role_distribution_in_result():
    left = _minimal_index()
    right = _minimal_index()
    result = compare_indices(left, right)
    assert "doc" in result.role_distribution
    assert "left" in result.role_distribution["doc"]
    assert "right" in result.role_distribution["doc"]


# ── Archetype classification ──


def test_archetype_near_identical():
    r = CompareResult(overall_similarity=0.90)
    assert r.archetype_match == "near_identical"


def test_archetype_same():
    r = CompareResult(overall_similarity=0.70)
    assert r.archetype_match == "same_archetype"


def test_archetype_related():
    r = CompareResult(overall_similarity=0.50)
    assert r.archetype_match == "related"


def test_archetype_different():
    r = CompareResult(overall_similarity=0.20)
    assert r.archetype_match == "different"


# ── Serialization ──


def test_to_dict_serializable():
    idx = _minimal_index()
    result = compare_indices(idx, idx)
    d = result.to_dict()
    text = json.dumps(d)
    parsed = json.loads(text)
    assert parsed["archetype_match"] == "near_identical"
    assert parsed["similarity"]["overall"] > 0.99


def test_format_human():
    idx = _minimal_index()
    result = compare_indices(idx, idx)
    text = format_compare_human(result)
    assert "python_cli" in text
    assert "near_identical" in text
    assert "Overall similarity" in text


def test_format_json():
    idx = _minimal_index()
    result = compare_indices(idx, idx)
    text = format_compare_json(result)
    parsed = json.loads(text)
    assert "archetype_match" in parsed
