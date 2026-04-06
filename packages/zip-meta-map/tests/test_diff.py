"""Tests for zip_meta_map.diff — index comparison logic."""

from __future__ import annotations

import json

from zip_meta_map.diff import (
    DiffResult,
    FileChange,
    diff_indices,
    format_diff_human,
    format_diff_json,
)


def _minimal_index(**overrides: object) -> dict:
    """Build a minimal valid index dict for testing."""
    base: dict = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "zip-meta-map/test",
        "profile": "python_cli",
        "start_here": ["README.md"],
        "ignore": [".git/**"],
        "files": [
            {
                "path": "README.md",
                "size_bytes": 100,
                "sha256": "a" * 64,
                "role": "doc",
                "confidence": 0.95,
            },
        ],
        "plans": {
            "overview": {
                "description": "Quick overview",
                "steps": ["READ README.md"],
            },
        },
    }
    base.update(overrides)
    return base


# -- Identical indices --


def test_identical_indices_no_changes():
    idx = _minimal_index()
    result = diff_indices(idx, idx)
    assert not result.has_changes
    assert result.files_added == []
    assert result.files_removed == []
    assert result.files_modified == []
    assert result.profile_changed is None


# -- Profile changes --


def test_profile_changed():
    old = _minimal_index(profile="python_cli")
    new = _minimal_index(profile="node_ts_tool")
    result = diff_indices(old, new)
    assert result.profile_changed == ("python_cli", "node_ts_tool")
    assert result.has_changes


def test_profile_unchanged():
    old = _minimal_index(profile="python_cli")
    new = _minimal_index(profile="python_cli")
    result = diff_indices(old, new)
    assert result.profile_changed is None


# -- File changes --


def test_file_added():
    old = _minimal_index()
    new_file = {
        "path": "src/main.py",
        "size_bytes": 200,
        "sha256": "b" * 64,
        "role": "entrypoint",
        "confidence": 0.9,
    }
    new = _minimal_index(files=old["files"] + [new_file])
    result = diff_indices(old, new)
    assert result.files_added == ["src/main.py"]
    assert result.files_removed == []
    assert result.has_changes


def test_multiple_files_added():
    old = _minimal_index()
    new_files = old["files"] + [
        {"path": "a.py", "size_bytes": 10, "sha256": "b" * 64, "role": "source", "confidence": 0.8},
        {"path": "b.py", "size_bytes": 20, "sha256": "c" * 64, "role": "source", "confidence": 0.8},
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    assert result.files_added == ["a.py", "b.py"]


def test_file_removed():
    old_files = [
        {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
        {"path": "old.py", "size_bytes": 50, "sha256": "d" * 64, "role": "source", "confidence": 0.7},
    ]
    old = _minimal_index(files=old_files)
    new = _minimal_index()
    result = diff_indices(old, new)
    assert result.files_removed == ["old.py"]
    assert result.has_changes


def test_multiple_files_removed():
    old_files = [
        {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
        {"path": "x.py", "size_bytes": 10, "sha256": "e" * 64, "role": "source", "confidence": 0.7},
        {"path": "y.py", "size_bytes": 20, "sha256": "f" * 64, "role": "source", "confidence": 0.7},
    ]
    old = _minimal_index(files=old_files)
    new = _minimal_index()
    result = diff_indices(old, new)
    assert result.files_removed == ["x.py", "y.py"]


def test_file_modified_sha256():
    old = _minimal_index()
    new_files = [
        {"path": "README.md", "size_bytes": 100, "sha256": "b" * 64, "role": "doc", "confidence": 0.95},
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    assert len(result.files_modified) == 1
    assert result.files_modified[0].path == "README.md"
    assert "content changed" in result.files_modified[0].changes
    assert result.has_changes


def test_file_modified_role():
    old = _minimal_index()
    new_files = [
        {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "config", "confidence": 0.95},
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    assert len(result.files_modified) == 1
    assert "role: doc -> config" in result.files_modified[0].changes


def test_file_modified_size():
    old = _minimal_index()
    new_files = [
        {"path": "README.md", "size_bytes": 200, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    assert any("size: 100 -> 200" in c for fc in result.files_modified for c in fc.changes)


def test_file_modified_confidence():
    old = _minimal_index()
    new_files = [
        {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.5},
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    assert any("confidence: 0.95 -> 0.5" in c for fc in result.files_modified for c in fc.changes)


def test_file_modified_risk_flags_added():
    old = _minimal_index()
    new_files = [
        {
            "path": "README.md",
            "size_bytes": 100,
            "sha256": "a" * 64,
            "role": "doc",
            "confidence": 0.95,
            "risk_flags": ["secrets_like"],
        },
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    assert any("risk_flags added: secrets_like" in c for fc in result.files_modified for c in fc.changes)


def test_file_modified_risk_flags_removed():
    old_files = [
        {
            "path": "README.md",
            "size_bytes": 100,
            "sha256": "a" * 64,
            "role": "doc",
            "confidence": 0.95,
            "risk_flags": ["exec_shell"],
        },
    ]
    old = _minimal_index(files=old_files)
    new = _minimal_index()
    result = diff_indices(old, new)
    assert any("risk_flags removed: exec_shell" in c for fc in result.files_modified for c in fc.changes)


def test_file_unchanged():
    old = _minimal_index()
    new = _minimal_index()
    result = diff_indices(old, new)
    assert result.files_modified == []


# -- start_here changes --


def test_start_here_added():
    old = _minimal_index(start_here=["README.md"])
    new = _minimal_index(start_here=["README.md", "src/main.py"])
    result = diff_indices(old, new)
    assert result.start_here_added == ["src/main.py"]
    assert result.start_here_removed == []


def test_start_here_removed():
    old = _minimal_index(start_here=["README.md", "DESIGN.md"])
    new = _minimal_index(start_here=["README.md"])
    result = diff_indices(old, new)
    assert result.start_here_removed == ["DESIGN.md"]


# -- Plan changes --


def test_plan_added():
    old = _minimal_index()
    new_plans = dict(old["plans"])
    new_plans["debug"] = {"description": "Debug flow", "steps": ["READ logs"]}
    new = _minimal_index(plans=new_plans)
    result = diff_indices(old, new)
    assert result.plans_added == ["debug"]


def test_plan_removed():
    old_plans = {
        "overview": {"description": "Quick overview", "steps": ["READ README.md"]},
        "debug": {"description": "Debug flow", "steps": ["READ logs"]},
    }
    old = _minimal_index(plans=old_plans)
    new = _minimal_index()
    result = diff_indices(old, new)
    assert result.plans_removed == ["debug"]


def test_plan_modified():
    old = _minimal_index()
    new_plans = {
        "overview": {"description": "Updated overview", "steps": ["READ README.md", "READ src/"]},
    }
    new = _minimal_index(plans=new_plans)
    result = diff_indices(old, new)
    assert result.plans_modified == ["overview"]


# -- Capabilities changes --


def test_capabilities_added():
    old = _minimal_index()
    new = _minimal_index(capabilities=["chunks", "excerpts"])
    result = diff_indices(old, new)
    assert result.capabilities_added == ["chunks", "excerpts"]


def test_capabilities_removed():
    old = _minimal_index(capabilities=["chunks", "modules"])
    new = _minimal_index(capabilities=["chunks"])
    result = diff_indices(old, new)
    assert result.capabilities_removed == ["modules"]


# -- Warnings changes --


def test_warnings_added():
    old = _minimal_index()
    new = _minimal_index(warnings=["Risk: exec_shell detected"])
    result = diff_indices(old, new)
    assert result.warnings_added == ["Risk: exec_shell detected"]


def test_warnings_removed():
    old = _minimal_index(warnings=["Old warning"])
    new = _minimal_index()
    result = diff_indices(old, new)
    assert result.warnings_removed == ["Old warning"]


# -- Module changes --


def test_module_added():
    old = _minimal_index()
    new = _minimal_index(modules=[{"path": "src", "file_count": 3, "primary_roles": ["source"]}])
    result = diff_indices(old, new)
    assert result.modules_added == ["src"]


def test_module_removed():
    old = _minimal_index(modules=[{"path": "lib", "file_count": 2, "primary_roles": ["vendor"]}])
    new = _minimal_index()
    result = diff_indices(old, new)
    assert result.modules_removed == ["lib"]


def test_module_modified():
    old = _minimal_index(modules=[{"path": "src", "file_count": 3, "primary_roles": ["source"], "summary": "old"}])
    new = _minimal_index(modules=[{"path": "src", "file_count": 5, "primary_roles": ["source"], "summary": "new"}])
    result = diff_indices(old, new)
    assert result.modules_modified == ["src"]


# -- DiffResult.to_dict --


def test_to_dict_serializable():
    old = _minimal_index()
    new_files = old["files"] + [
        {"path": "new.py", "size_bytes": 10, "sha256": "b" * 64, "role": "source", "confidence": 0.8},
    ]
    new = _minimal_index(files=new_files)
    result = diff_indices(old, new)
    d = result.to_dict()
    # Should be JSON-serializable
    json_str = json.dumps(d)
    parsed = json.loads(json_str)
    assert parsed["has_changes"] is True
    assert parsed["files_added"] == ["new.py"]


def test_to_dict_profile_changed():
    old = _minimal_index(profile="python_cli")
    new = _minimal_index(profile="monorepo")
    result = diff_indices(old, new)
    d = result.to_dict()
    assert d["profile_changed"] == {"old": "python_cli", "new": "monorepo"}


# -- format_diff_human --


def test_format_human_no_changes():
    result = DiffResult()
    assert format_diff_human(result) == "No changes detected."


def test_format_human_with_changes():
    result = DiffResult(
        files_added=["new.py"],
        files_removed=["old.py"],
        files_modified=[FileChange(path="main.py", changes=["content changed", "role: source -> entrypoint"])],
    )
    text = format_diff_human(result)
    assert "+1 added" in text
    assert "-1 removed" in text
    assert "~1 modified" in text
    assert "+ new.py" in text
    assert "- old.py" in text
    assert "~ main.py" in text
    assert "content changed" in text
    assert "role: source -> entrypoint" in text


def test_format_human_profile_change():
    result = DiffResult(profile_changed=("python_cli", "monorepo"))
    text = format_diff_human(result)
    assert "python_cli -> monorepo" in text


# -- format_diff_json --


def test_format_json_valid():
    result = DiffResult(files_added=["test.py"])
    text = format_diff_json(result)
    parsed = json.loads(text)
    assert parsed["has_changes"] is True
    assert parsed["files_added"] == ["test.py"]


def test_format_json_no_changes():
    result = DiffResult()
    text = format_diff_json(result)
    parsed = json.loads(text)
    assert parsed["has_changes"] is False
