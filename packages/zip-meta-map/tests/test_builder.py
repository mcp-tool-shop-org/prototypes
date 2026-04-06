"""Tests for the core builder."""

import json
import zipfile
from pathlib import Path

import pytest

from zip_meta_map.builder import build, build_index, detect_profile, load_policy, validate_index
from zip_meta_map.profiles import PYTHON_CLI
from zip_meta_map.scanner import scan_directory

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"

# All valid roles in v0.1.1
VALID_ROLES = {
    "entrypoint",
    "public_api",
    "source",
    "internal",
    "config",
    "lockfile",
    "ci",
    "test",
    "fixture",
    "doc",
    "doc_api",
    "doc_architecture",
    "schema",
    "build",
    "script",
    "generated",
    "vendor",
    "asset",
    "data",
    "unknown",
}


def test_detect_profile_python():
    files = scan_directory(FIXTURE_DIR, [".git/**"])
    profile = detect_profile(files)
    assert profile.name == "python_cli"


def test_build_index_valid_schema():
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    validate_index(index)


def test_build_index_required_fields():
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    assert index["format"] == "zip-meta-map"
    assert index["version"] == "0.2"
    assert index["profile"] == "python_cli"
    assert isinstance(index["files"], list)
    assert isinstance(index["plans"], dict)
    assert "overview" in index["plans"]


def test_build_index_files_have_confidence():
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    for entry in index["files"]:
        assert len(entry["sha256"]) == 64
        assert entry["size_bytes"] >= 0
        assert entry["role"] in VALID_ROLES
        assert 0.0 <= entry["confidence"] <= 1.0
        assert "reason" in entry


def test_build_start_here_ranked():
    """start_here should be ordered: README first, then entrypoints, then config."""
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    start = index["start_here"]
    assert len(start) >= 2
    # README should be first or very near the top
    assert "README.md" in start
    readme_pos = start.index("README.md")
    assert readme_pos <= 1, f"README.md should be near top, was at position {readme_pos}"


def test_build_start_here_contains_entrypoint():
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    start = index["start_here"]
    assert "src/tiny_cli/main.py" in start


def test_build_plans_have_budgets():
    """Plans should include budget information."""
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    overview = index["plans"]["overview"]
    assert "budget_bytes" in overview
    assert "max_total_bytes" in overview
    assert overview["max_total_bytes"] > 0


def test_build_plans_have_stop_after():
    """Overview plan should have stop_after for quick orientation."""
    files = scan_directory(FIXTURE_DIR, PYTHON_CLI.ignore_globs)
    index = build_index(files, PYTHON_CLI, "tiny_python_cli")
    overview = index["plans"]["overview"]
    assert "stop_after" in overview
    assert len(overview["stop_after"]) > 0


def test_build_full_directory():
    front, index = build(FIXTURE_DIR)
    assert "tiny_python_cli" in front
    assert index["format"] == "zip-meta-map"
    validate_index(index)


def test_build_front_has_roles_summary():
    front, _ = build(FIXTURE_DIR)
    assert "Roles" in front


def test_build_writes_output(tmp_path):
    build(FIXTURE_DIR, output_dir=tmp_path)
    assert (tmp_path / "META_ZIP_FRONT.md").exists()
    assert (tmp_path / "META_ZIP_INDEX.json").exists()

    index = json.loads((tmp_path / "META_ZIP_INDEX.json").read_text())
    validate_index(index)


def test_build_zip(tmp_path):
    zip_path = tmp_path / "fixture.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        for fpath in sorted(FIXTURE_DIR.rglob("*")):
            if fpath.is_file():
                arcname = str(fpath.relative_to(FIXTURE_DIR))
                zf.write(fpath, arcname)

    front, index = build(zip_path)
    assert index["format"] == "zip-meta-map"
    validate_index(index)


def test_build_invalid_input(tmp_path):
    bad = tmp_path / "not_a_zip.txt"
    bad.write_text("hello")
    with pytest.raises(ValueError, match="directory or .zip"):
        build(bad)


def test_build_forced_profile():
    front, index = build(FIXTURE_DIR, profile_name="node_ts_tool")
    assert index["profile"] == "node_ts_tool"
    validate_index(index)


def test_build_with_policy(tmp_path):
    policy = {
        "format": "zip-meta-policy",
        "version": "0.1",
        "plan_budgets": {"overview": 10000},
        "notes": "Test policy",
    }
    policy_path = tmp_path / "META_ZIP_POLICY.json"
    policy_path.write_text(json.dumps(policy))

    front, index = build(FIXTURE_DIR, policy_path=policy_path)
    assert index["policy_applied"] is True
    assert index["plans"]["overview"]["max_total_bytes"] == 10000
    validate_index(index)


def test_build_with_policy_ignore_extra(tmp_path):
    policy = {
        "format": "zip-meta-policy",
        "version": "0.1",
        "ignore_extra": ["tests/**"],
    }
    policy_path = tmp_path / "META_ZIP_POLICY.json"
    policy_path.write_text(json.dumps(policy))

    _, index = build(FIXTURE_DIR, policy_path=policy_path)
    paths = {f["path"] for f in index["files"]}
    assert "tests/test_main.py" not in paths


def test_policy_invalid_schema(tmp_path):
    bad_policy = {"format": "wrong", "version": "0.1"}
    policy_path = tmp_path / "bad.json"
    policy_path.write_text(json.dumps(bad_policy))

    with pytest.raises(Exception):
        load_policy(policy_path)


# ── Golden tests: meaning, not just validity ──


def test_golden_fixture_roles():
    """The tiny_python_cli fixture should have meaningful role assignments."""
    _, index = build(FIXTURE_DIR)
    file_roles = {f["path"]: f["role"] for f in index["files"]}

    assert file_roles["README.md"] == "doc"
    assert file_roles["pyproject.toml"] == "config"
    assert file_roles["src/tiny_cli/main.py"] == "entrypoint"
    assert file_roles["tests/test_main.py"] == "test"


def test_golden_fixture_confidence():
    """High-signal files should have high confidence."""
    _, index = build(FIXTURE_DIR)
    file_conf = {f["path"]: f["confidence"] for f in index["files"]}

    assert file_conf["README.md"] >= 0.90
    assert file_conf["pyproject.toml"] >= 0.90
    assert file_conf["src/tiny_cli/main.py"] >= 0.90
    assert file_conf["tests/test_main.py"] >= 0.80


def test_golden_fixture_start_here_order():
    """start_here should prioritize README > entrypoint > config."""
    _, index = build(FIXTURE_DIR)
    start = index["start_here"]
    assert start[0] == "README.md", f"First start_here should be README.md, got {start[0]}"


# ── Phase 2: Progressive disclosure tests ──


def test_build_has_excerpts():
    """start_here files should have excerpts when built with content."""
    _, index = build(FIXTURE_DIR)
    file_map = {f["path"]: f for f in index["files"]}
    readme = file_map["README.md"]
    assert "excerpt" in readme, "README.md should have an excerpt"
    assert len(readme["excerpt"]) > 0


def test_build_has_modules():
    """Build should produce module summaries for directories with 2+ files."""
    _, index = build(FIXTURE_DIR)
    modules = index.get("modules", [])
    # tiny_python_cli has src/tiny_cli/ with at least 2 files
    assert len(modules) >= 1
    paths = [m["path"] for m in modules]
    assert any("src" in p for p in paths) or any("." == p for p in paths)


def test_build_has_deep_dive_plan():
    """Python CLI profile should include the deep_dive plan."""
    _, index = build(FIXTURE_DIR)
    assert "deep_dive" in index["plans"]
    deep = index["plans"]["deep_dive"]
    assert "SUMMARIZE_THEN_CHOOSE_NEXT" in " ".join(deep["steps"])


def test_build_front_has_modules_section():
    """FRONT.md should include modules section when modules exist."""
    front, index = build(FIXTURE_DIR)
    if index.get("modules"):
        assert "Modules" in front


def test_build_version_is_0_2():
    """Phase 2 should produce version 0.2."""
    _, index = build(FIXTURE_DIR)
    assert index["version"] == "0.2"


# ── Phase 3: Capabilities contract ──


def test_build_has_capabilities():
    """Build should populate capabilities based on features present."""
    _, index = build(FIXTURE_DIR)
    caps = index.get("capabilities", [])
    assert isinstance(caps, list)
    # Fixture has excerpts (README is in start_here) and modules
    assert "excerpts" in caps
    assert "modules" in caps


def test_build_capabilities_validated():
    """Capabilities should pass schema validation."""
    _, index = build(FIXTURE_DIR)
    validate_index(index)


# ── Phase 7: Multi-profile stability tests ──

NODE_FIXTURE = Path(__file__).parent / "fixtures" / "tiny_node_tool"
MONOREPO_FIXTURE = Path(__file__).parent / "fixtures" / "tiny_monorepo"


def test_node_fixture_detects_profile():
    """tiny_node_tool should auto-detect as node_ts_tool."""
    _, index = build(NODE_FIXTURE)
    assert index["profile"] == "node_ts_tool"
    validate_index(index)


def test_node_fixture_roles():
    """Node fixture should have meaningful role assignments."""
    _, index = build(NODE_FIXTURE)
    file_roles = {f["path"]: f["role"] for f in index["files"]}
    assert file_roles["README.md"] == "doc"
    assert file_roles["package.json"] == "config"
    assert file_roles["tsconfig.json"] == "config"


def test_node_fixture_start_here():
    """Node fixture start_here should include README and config."""
    _, index = build(NODE_FIXTURE)
    assert "README.md" in index["start_here"]


def test_node_fixture_has_plans():
    """Node fixture should have all expected plans."""
    _, index = build(NODE_FIXTURE)
    assert "overview" in index["plans"]
    assert "deep_dive" in index["plans"]


def test_monorepo_fixture_detects_profile():
    """tiny_monorepo should auto-detect as monorepo."""
    _, index = build(MONOREPO_FIXTURE)
    assert index["profile"] == "monorepo"
    validate_index(index)


def test_monorepo_fixture_roles():
    """Monorepo fixture should have meaningful role assignments."""
    _, index = build(MONOREPO_FIXTURE)
    file_roles = {f["path"]: f["role"] for f in index["files"]}
    assert file_roles["README.md"] == "doc"
    assert file_roles["pnpm-workspace.yaml"] == "config"


def test_monorepo_fixture_has_modules():
    """Monorepo should produce module summaries for packages."""
    _, index = build(MONOREPO_FIXTURE)
    modules = index.get("modules", [])
    module_paths = [m["path"] for m in modules]
    # Should have at least the packages/* dirs
    assert any("packages" in p for p in module_paths)


def test_monorepo_fixture_has_plans():
    """Monorepo fixture should have all expected plans."""
    _, index = build(MONOREPO_FIXTURE)
    assert "overview" in index["plans"]
    assert "deep_dive" in index["plans"]


def test_all_profiles_produce_valid_indices():
    """Every profile fixture should produce schema-valid output."""
    for fixture in [FIXTURE_DIR, NODE_FIXTURE, MONOREPO_FIXTURE]:
        _, index = build(fixture)
        validate_index(index)
        assert len(index["files"]) > 0
        assert len(index["start_here"]) > 0
        assert len(index["plans"]) > 0
