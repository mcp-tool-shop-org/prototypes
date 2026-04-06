"""Tests for report and step summary generation."""

from pathlib import Path

from zip_meta_map.builder import build
from zip_meta_map.report import build_report, build_step_summary

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def _build_fixture_index():
    """Build an index from the fixture for reuse."""
    _, index = build(FIXTURE_DIR)
    return index


# ── Step summary tests ──


def test_step_summary_contains_profile():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    assert "python_cli" in summary


def test_step_summary_contains_file_count():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    file_count = len(index["files"])
    assert str(file_count) in summary


def test_step_summary_contains_start_here():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    assert "Start Here" in summary
    assert "README.md" in summary


def test_step_summary_contains_plans_table():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    assert "Plans" in summary
    assert "overview" in summary
    assert "Steps" in summary


def test_step_summary_contains_role_distribution():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    assert "Role Distribution" in summary
    assert "doc" in summary
    assert "entrypoint" in summary


def test_step_summary_no_warnings_when_clean():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    # Clean fixture should not have warnings section
    if not index.get("warnings"):
        assert "Warnings" not in summary or "| **Warnings**" not in summary


def test_step_summary_no_risk_flags_when_clean():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    # Clean fixture should not have risk flags section
    if not any(f.get("risk_flags") for f in index["files"]):
        assert "Risk Flags" not in summary


def test_step_summary_capabilities():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    assert "Capabilities" in summary


def test_step_summary_has_generator():
    index = _build_fixture_index()
    summary = build_step_summary(index, "tiny_python_cli")
    assert "zip-meta-map" in summary


def test_step_summary_with_warnings():
    """Step summary should show warnings when present."""
    index = _build_fixture_index()
    index["warnings"] = ["Test warning 1", "Test warning 2"]
    summary = build_step_summary(index, "test")
    assert "Warnings (2)" in summary
    assert "Test warning 1" in summary


def test_step_summary_with_risk_flags():
    """Step summary should show risk flags when present."""
    index = _build_fixture_index()
    index["files"][0]["risk_flags"] = ["exec_shell", "network_io"]
    summary = build_step_summary(index, "test")
    assert "Risk Flags" in summary
    assert "exec_shell" in summary


def test_step_summary_with_chunks():
    """Step summary should show chunk stats when chunks exist."""
    index = _build_fixture_index()
    index["files"][0]["chunks"] = [
        {"id": "c1", "start_line": 1, "end_line": 50, "byte_len": 2000},
        {"id": "c2", "start_line": 51, "end_line": 100, "byte_len": 2000},
    ]
    summary = build_step_summary(index, "test")
    assert "Chunk Stats" in summary


def test_step_summary_empty_index():
    """Step summary should handle an empty index."""
    index = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test/0.1.0",
        "profile": "python_cli",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
    }
    summary = build_step_summary(index, "empty")
    assert "empty" in summary
    assert "python_cli" in summary


# ── Report tests ──


def test_report_contains_all_sections():
    index = _build_fixture_index()
    report = build_report(index, "tiny_python_cli")
    assert "Summary" in report
    assert "Start Here" in report
    assert "Role Distribution" in report
    assert "Plans" in report
    assert "File Inventory" in report


def test_report_file_table():
    index = _build_fixture_index()
    report = build_report(index, "tiny_python_cli")
    assert "File Inventory" in report
    assert "README.md" in report
    assert "Path" in report


def test_report_module_table():
    index = _build_fixture_index()
    report = build_report(index, "tiny_python_cli")
    if index.get("modules"):
        assert "Modules" in report
        assert "Primary Roles" in report


def test_report_full_plans():
    """Report should include full plan descriptions, not just a summary table."""
    index = _build_fixture_index()
    report = build_report(index, "tiny_python_cli")
    # Should have the full plan description text
    overview = index["plans"]["overview"]
    assert overview["description"] in report
    # Should have individual steps
    assert overview["steps"][0] in report


def test_report_risk_analysis():
    """Report should include risk analysis when flags present."""
    index = _build_fixture_index()
    index["files"][0]["risk_flags"] = ["exec_shell"]
    report = build_report(index, "test")
    assert "Risk Analysis" in report
    assert "exec_shell" in report


def test_report_empty_index():
    index = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test/0.1.0",
        "profile": "python_cli",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
    }
    report = build_report(index, "empty")
    assert "empty" in report
    assert "advisory" in report


def test_report_deterministic():
    """Same index should produce identical report output."""
    index = _build_fixture_index()
    r1 = build_report(index, "test")
    r2 = build_report(index, "test")
    assert r1 == r2


def test_report_has_capabilities():
    index = _build_fixture_index()
    report = build_report(index, "tiny_python_cli")
    assert "Capabilities" in report


def test_report_has_generator():
    index = _build_fixture_index()
    report = build_report(index, "tiny_python_cli")
    assert "zip-meta-map" in report
    assert "advisory" in report
