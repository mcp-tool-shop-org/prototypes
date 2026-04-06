"""Tests for the CLI entry point."""

import json
from pathlib import Path

import pytest

from zip_meta_map.cli import main

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def test_cli_help():
    with pytest.raises(SystemExit, match="0"):
        main(["--help"])


def test_cli_version(capsys):
    with pytest.raises(SystemExit, match="0"):
        main(["--version"])
    captured = capsys.readouterr()
    assert "zip-meta-map" in captured.out


def test_cli_build_stdout(capsys):
    code = main(["build", str(FIXTURE_DIR)])
    assert code == 0
    captured = capsys.readouterr()
    assert "META_ZIP_FRONT.md" in captured.out
    assert "META_ZIP_INDEX.json" in captured.out


def test_cli_build_output_dir(tmp_path, capsys):
    out = tmp_path / "output"
    code = main(["build", str(FIXTURE_DIR), "-o", str(out)])
    assert code == 0
    assert (out / "META_ZIP_FRONT.md").exists()
    assert (out / "META_ZIP_INDEX.json").exists()


def test_cli_build_summary(tmp_path, capsys):
    """Build with output dir should print a build summary."""
    out = tmp_path / "output"
    code = main(["build", str(FIXTURE_DIR), "-o", str(out)])
    assert code == 0
    captured = capsys.readouterr()
    assert "Profile:" in captured.out
    assert "Files:" in captured.out


def test_cli_build_missing_input(tmp_path, capsys):
    missing = tmp_path / "definitely_does_not_exist"
    code = main(["build", str(missing)])
    assert code == 1
    captured = capsys.readouterr()
    assert "does not exist" in captured.err


def test_cli_build_with_policy(tmp_path, capsys):
    policy = {"format": "zip-meta-policy", "version": "0.1", "plan_budgets": {"overview": 5000}}
    policy_path = tmp_path / "policy.json"
    policy_path.write_text(json.dumps(policy))

    out = tmp_path / "output"
    code = main(["build", str(FIXTURE_DIR), "-o", str(out), "--policy", str(policy_path)])
    assert code == 0

    index = json.loads((out / "META_ZIP_INDEX.json").read_text())
    assert index["policy_applied"] is True


def test_cli_build_missing_policy(tmp_path, capsys):
    code = main(["build", str(FIXTURE_DIR), "--policy", str(tmp_path / "nope.json")])
    assert code == 1
    captured = capsys.readouterr()
    assert "does not exist" in captured.err


def test_cli_explain(capsys):
    code = main(["explain", str(FIXTURE_DIR)])
    assert code == 0
    captured = capsys.readouterr()
    assert "Profile:" in captured.out
    assert "python_cli" in captured.out
    assert "Top files to read first:" in captured.out
    assert "Overview plan:" in captured.out


def test_cli_explain_json(capsys):
    """--json flag should produce valid JSON output."""
    code = main(["explain", str(FIXTURE_DIR), "--json"])
    assert code == 0
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    assert data["profile"] == "python_cli"
    assert isinstance(data["file_count"], int)
    assert isinstance(data["roles"], dict)
    assert isinstance(data["start_here"], list)
    assert isinstance(data["plans"], dict)


def test_cli_explain_missing_input(tmp_path, capsys):
    missing = tmp_path / "nope"
    code = main(["explain", str(missing)])
    assert code == 1


def test_cli_validate_valid(tmp_path, capsys):
    """validate command should accept a valid index."""
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
    index_path = tmp_path / "META_ZIP_INDEX.json"
    index_path.write_text(json.dumps(index))

    code = main(["validate", str(index_path)])
    assert code == 0
    captured = capsys.readouterr()
    assert "Valid" in captured.out


def test_cli_validate_invalid(tmp_path, capsys):
    """validate command should reject an invalid index."""
    bad_index = {"format": "wrong"}
    index_path = tmp_path / "bad.json"
    index_path.write_text(json.dumps(bad_index))

    code = main(["validate", str(index_path)])
    assert code == 1
    captured = capsys.readouterr()
    assert "failed" in captured.err.lower() or "Validation" in captured.err


def test_cli_validate_missing_file(tmp_path, capsys):
    code = main(["validate", str(tmp_path / "nonexistent.json")])
    assert code == 1
    captured = capsys.readouterr()
    assert "does not exist" in captured.err


def test_cli_validate_bad_json(tmp_path, capsys):
    bad = tmp_path / "corrupt.json"
    bad.write_text("not json {{{")
    code = main(["validate", str(bad)])
    assert code == 1


def test_cli_no_command(capsys):
    code = main([])
    assert code == 0


# ── Phase 3: Consumer integration hooks ──


def test_cli_build_format_json(capsys):
    """--format json should produce valid JSON with front_md and index."""
    code = main(["build", str(FIXTURE_DIR), "--format", "json"])
    assert code == 0
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    assert "front_md" in data
    assert "index" in data
    assert data["index"]["format"] == "zip-meta-map"


def test_cli_build_format_ndjson(capsys):
    """--format ndjson should produce one JSON line per file."""
    code = main(["build", str(FIXTURE_DIR), "--format", "ndjson"])
    assert code == 0
    captured = capsys.readouterr()
    lines = [line for line in captured.out.strip().split("\n") if line.strip()]
    assert len(lines) >= 1
    for line in lines:
        entry = json.loads(line)
        assert "path" in entry
        assert "role" in entry
        assert "confidence" in entry


def test_cli_build_manifest_only_stdout(capsys):
    """--manifest-only should suppress FRONT.md in stdout output."""
    code = main(["build", str(FIXTURE_DIR), "--manifest-only"])
    assert code == 0
    captured = capsys.readouterr()
    assert "META_ZIP_FRONT.md" not in captured.out
    assert "META_ZIP_INDEX.json" in captured.out


def test_cli_build_manifest_only_output_dir(tmp_path, capsys):
    """--manifest-only -o should only write META_ZIP_INDEX.json."""
    out = tmp_path / "output"
    code = main(["build", str(FIXTURE_DIR), "-o", str(out), "--manifest-only"])
    assert code == 0
    assert (out / "META_ZIP_INDEX.json").exists()
    assert not (out / "META_ZIP_FRONT.md").exists()

    index = json.loads((out / "META_ZIP_INDEX.json").read_text())
    assert index["format"] == "zip-meta-map"


def test_cli_build_manifest_only_json(capsys):
    """--manifest-only --format json should emit only the index dict."""
    code = main(["build", str(FIXTURE_DIR), "--manifest-only", "--format", "json"])
    assert code == 0
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    # Should be the index directly, not wrapped in {front_md, index}
    assert data["format"] == "zip-meta-map"
    assert "front_md" not in data


def test_cli_validate_shows_capabilities(tmp_path, capsys):
    """validate should display capabilities when present."""
    index = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test/0.1.0",
        "profile": "python_cli",
        "start_here": [],
        "ignore": [],
        "files": [],
        "plans": {},
        "capabilities": ["chunks", "excerpts"],
    }
    index_path = tmp_path / "META_ZIP_INDEX.json"
    index_path.write_text(json.dumps(index))

    code = main(["validate", str(index_path)])
    assert code == 0
    captured = capsys.readouterr()
    assert "chunks" in captured.out
    assert "excerpts" in captured.out


def test_cli_explain_json_includes_capabilities(capsys):
    """explain --json should include capabilities in output."""
    code = main(["explain", str(FIXTURE_DIR), "--json"])
    assert code == 0
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    assert "capabilities" in data


# ── Phase 4: Step summary and report flags ──


def test_cli_build_summary_stdout(capsys, monkeypatch):
    """--summary without GITHUB_STEP_SUMMARY should print to stdout."""
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
    code = main(["build", str(FIXTURE_DIR), "--summary"])
    assert code == 0
    captured = capsys.readouterr()
    assert "zip-meta-map:" in captured.out
    assert "Start Here" in captured.out
    assert "Role Distribution" in captured.out


def test_cli_build_summary_writes_to_file(tmp_path, monkeypatch, capsys):
    """--summary with GITHUB_STEP_SUMMARY should append to that file."""
    summary_file = tmp_path / "summary.md"
    summary_file.write_text("")
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary_file))

    code = main(["build", str(FIXTURE_DIR), "--summary"])
    assert code == 0

    content = summary_file.read_text()
    assert "zip-meta-map:" in content
    assert "Start Here" in content


def test_cli_build_summary_appends(tmp_path, monkeypatch, capsys):
    """Multiple --summary writes should append, not overwrite."""
    summary_file = tmp_path / "summary.md"
    summary_file.write_text("# Previous content\n")
    monkeypatch.setenv("GITHUB_STEP_SUMMARY", str(summary_file))

    main(["build", str(FIXTURE_DIR), "--summary"])
    content = summary_file.read_text()
    assert "Previous content" in content
    assert "zip-meta-map:" in content


def test_cli_build_summary_no_auto_detect(capsys, monkeypatch):
    """Without --summary, GITHUB_STEP_SUMMARY should NOT be written."""
    import tempfile

    with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
        summary_path = f.name
        f.write("")

    monkeypatch.setenv("GITHUB_STEP_SUMMARY", summary_path)
    main(["build", str(FIXTURE_DIR)])
    capsys.readouterr()

    content = Path(summary_path).read_text()
    assert content == ""  # Should not have been written
    Path(summary_path).unlink()


def test_cli_build_report_stdout(capsys):
    """--report md without -o should print report to stdout."""
    code = main(["build", str(FIXTURE_DIR), "--report", "md"])
    assert code == 0
    captured = capsys.readouterr()
    assert "zip-meta-map Report:" in captured.out
    assert "File Inventory" in captured.out
    assert "advisory" in captured.out


def test_cli_build_report_output_dir(tmp_path, capsys):
    """--report md with -o should write META_ZIP_REPORT.md."""
    out = tmp_path / "output"
    code = main(["build", str(FIXTURE_DIR), "-o", str(out), "--report", "md"])
    assert code == 0
    report_path = out / "META_ZIP_REPORT.md"
    assert report_path.exists()
    content = report_path.read_text()
    assert "zip-meta-map Report:" in content


def test_cli_build_summary_and_report_together(tmp_path, capsys, monkeypatch):
    """--summary and --report md should both work together."""
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
    out = tmp_path / "output"
    code = main(["build", str(FIXTURE_DIR), "-o", str(out), "--summary", "--report", "md"])
    assert code == 0
    captured = capsys.readouterr()
    # Summary should be printed to stdout (no GITHUB_STEP_SUMMARY set)
    assert "zip-meta-map:" in captured.out
    # Report should be written to file
    assert (out / "META_ZIP_REPORT.md").exists()


def test_cli_build_summary_with_manifest_only(capsys, monkeypatch):
    """--summary should work with --manifest-only."""
    monkeypatch.delenv("GITHUB_STEP_SUMMARY", raising=False)
    code = main(["build", str(FIXTURE_DIR), "--manifest-only", "--summary"])
    assert code == 0
    captured = capsys.readouterr()
    assert "zip-meta-map:" in captured.out


# ── Phase 6: Diff command ──


def _write_index(path, **overrides):
    """Write a minimal valid index JSON to path."""
    index = {
        "format": "zip-meta-map",
        "version": "0.2",
        "generated_by": "test/0.1.0",
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
    index.update(overrides)
    path.write_text(json.dumps(index))
    return index


def test_cli_diff_identical(tmp_path, capsys):
    """diff of identical indices should report no changes."""
    idx = tmp_path / "index.json"
    _write_index(idx)
    code = main(["diff", str(idx), str(idx)])
    assert code == 0
    captured = capsys.readouterr()
    assert "No changes detected" in captured.out


def test_cli_diff_with_changes(tmp_path, capsys):
    """diff with file changes should show details."""
    old = tmp_path / "old.json"
    new = tmp_path / "new.json"
    _write_index(old)
    _write_index(
        new,
        files=[
            {"path": "README.md", "size_bytes": 100, "sha256": "a" * 64, "role": "doc", "confidence": 0.95},
            {"path": "new.py", "size_bytes": 50, "sha256": "b" * 64, "role": "source", "confidence": 0.8},
        ],
    )
    code = main(["diff", str(old), str(new)])
    assert code == 0
    captured = capsys.readouterr()
    assert "+1 added" in captured.out
    assert "new.py" in captured.out


def test_cli_diff_json_output(tmp_path, capsys):
    """--json should produce valid JSON diff output."""
    idx = tmp_path / "index.json"
    _write_index(idx)
    code = main(["diff", str(idx), str(idx), "--json"])
    assert code == 0
    captured = capsys.readouterr()
    data = json.loads(captured.out)
    assert data["has_changes"] is False


def test_cli_diff_exit_code_no_changes(tmp_path):
    """--exit-code should return 0 when no changes."""
    idx = tmp_path / "index.json"
    _write_index(idx)
    code = main(["diff", str(idx), str(idx), "--exit-code"])
    assert code == 0


def test_cli_diff_exit_code_with_changes(tmp_path):
    """--exit-code should return 1 when changes detected."""
    old = tmp_path / "old.json"
    new = tmp_path / "new.json"
    _write_index(old)
    _write_index(new, profile="monorepo")
    code = main(["diff", str(old), str(new), "--exit-code"])
    assert code == 1


def test_cli_diff_missing_old(tmp_path, capsys):
    """Missing old file should return error."""
    new = tmp_path / "new.json"
    _write_index(new)
    code = main(["diff", str(tmp_path / "missing.json"), str(new)])
    assert code == 1
    captured = capsys.readouterr()
    assert "does not exist" in captured.err


def test_cli_diff_missing_new(tmp_path, capsys):
    """Missing new file should return error."""
    old = tmp_path / "old.json"
    _write_index(old)
    code = main(["diff", str(old), str(tmp_path / "missing.json")])
    assert code == 1
    captured = capsys.readouterr()
    assert "does not exist" in captured.err


def test_cli_diff_bad_json(tmp_path, capsys):
    """Corrupt JSON should return error."""
    old = tmp_path / "old.json"
    _write_index(old)
    bad = tmp_path / "bad.json"
    bad.write_text("not json{{{")
    code = main(["diff", str(old), str(bad)])
    assert code == 1
    captured = capsys.readouterr()
    assert "could not read JSON" in captured.err
