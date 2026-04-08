"""Tests for new CLI features: --jobs, --compact-json, --stream, --format, --plugin-dir, --output-schema."""

from __future__ import annotations

import json
import os
import tempfile

from tool_scan.cli import _build_json_output, main
from tool_scan.grader import MCPToolGrader


def _write_tool_file(tmpdir: str, name: str, tool: dict) -> str:
    """Write a tool JSON file and return its path."""
    path = os.path.join(tmpdir, f"{name}.json")
    with open(path, "w") as f:
        json.dump(tool, f)
    return path


def _make_safe_tool(name: str) -> dict:
    return {
        "name": name,
        "description": f"A safe tool called {name} for testing CLI features",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    }


# =============================================================================
# --compact-json
# =============================================================================


class TestCompactJson:
    def test_compact_json_valid(self, capsys):
        """--compact-json should emit valid JSON without indentation."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = _write_tool_file(tmpdir, "t1", _make_safe_tool("t1"))
            exit_code = main(["--json", "--compact-json", path])

            captured = capsys.readouterr()
            output = json.loads(captured.out)

            assert exit_code == 0
            assert "results" in output
            assert "summary" in output
            # Compact means no newlines in the JSON body (single line)
            assert "\n" not in captured.out.strip()

    def test_compact_json_matches_normal_json(self, capsys):
        """--compact-json should produce functionally identical output to --json."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = _write_tool_file(tmpdir, "t1", _make_safe_tool("t1"))

            # Normal JSON
            main(["--json", path])
            normal_out = json.loads(capsys.readouterr().out)

            # Compact JSON
            main(["--json", "--compact-json", path])
            compact_out = json.loads(capsys.readouterr().out)

            assert normal_out["results"].keys() == compact_out["results"].keys()
            assert normal_out["summary"] == compact_out["summary"]


# =============================================================================
# --jobs N
# =============================================================================


class TestConcurrentJobs:
    def test_jobs_1_matches_default(self, capsys):
        """--jobs 1 should produce identical output to default."""
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = [
                _write_tool_file(tmpdir, f"t{i}", _make_safe_tool(f"t{i}"))
                for i in range(5)
            ]

            # Default (no --jobs)
            main(["--json"] + paths)
            default_out = json.loads(capsys.readouterr().out)

            # --jobs 1
            main(["--json", "--jobs", "1"] + paths)
            jobs1_out = json.loads(capsys.readouterr().out)

            assert set(default_out["results"].keys()) == set(jobs1_out["results"].keys())
            assert default_out["summary"]["total"] == jobs1_out["summary"]["total"]

    def test_jobs_4_produces_all_results(self, capsys):
        """--jobs 4 should process all files and produce all results."""
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = [
                _write_tool_file(tmpdir, f"t{i}", _make_safe_tool(f"t{i}"))
                for i in range(10)
            ]

            exit_code = main(["--json", "--jobs", "4"] + paths)
            output = json.loads(capsys.readouterr().out)

            assert exit_code == 0
            assert output["summary"]["total"] == 10
            assert len(output["results"]) == 10

    def test_jobs_4_matches_jobs_1_content(self, capsys):
        """--jobs 4 should produce identical content (same scores) to --jobs 1."""
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = [
                _write_tool_file(tmpdir, f"tool_{i}", _make_safe_tool(f"tool_{i}"))
                for i in range(8)
            ]

            main(["--json", "--jobs", "1"] + paths)
            single_out = json.loads(capsys.readouterr().out)

            main(["--json", "--jobs", "4"] + paths)
            multi_out = json.loads(capsys.readouterr().out)

            for name in single_out["results"]:
                assert name in multi_out["results"]
                assert single_out["results"][name]["score"] == multi_out["results"][name]["score"]
                assert single_out["results"][name]["grade"] == multi_out["results"][name]["grade"]


# =============================================================================
# --stream
# =============================================================================


class TestStreamingJson:
    def test_streaming_produces_valid_json(self, capsys):
        """--stream should produce valid, parseable JSON."""
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = [
                _write_tool_file(tmpdir, f"t{i}", _make_safe_tool(f"t{i}"))
                for i in range(5)
            ]

            exit_code = main(["--json", "--stream"] + paths)
            output = json.loads(capsys.readouterr().out)

            assert exit_code == 0
            assert "results" in output
            assert "summary" in output
            assert output["summary"]["total"] == 5

    def test_streaming_compact_produces_valid_json(self, capsys):
        """--stream --compact-json should produce valid compact JSON."""
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = [
                _write_tool_file(tmpdir, f"t{i}", _make_safe_tool(f"t{i}"))
                for i in range(3)
            ]

            exit_code = main(["--json", "--stream", "--compact-json"] + paths)
            captured = capsys.readouterr()
            output = json.loads(captured.out)

            assert exit_code == 0
            assert len(output["results"]) == 3

    def test_streaming_matches_normal_results(self, capsys):
        """Streaming output should have same results as non-streaming."""
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = [
                _write_tool_file(tmpdir, f"t{i}", _make_safe_tool(f"t{i}"))
                for i in range(3)
            ]

            # Normal
            main(["--json"] + paths)
            normal_out = json.loads(capsys.readouterr().out)

            # Streaming
            main(["--json", "--stream"] + paths)
            stream_out = json.loads(capsys.readouterr().out)

            assert set(normal_out["results"].keys()) == set(stream_out["results"].keys())
            for name in normal_out["results"]:
                assert normal_out["results"][name]["score"] == stream_out["results"][name]["score"]


# =============================================================================
# --format sarif
# =============================================================================


class TestFormatSarif:
    def test_sarif_format_produces_valid_sarif(self, capsys):
        """--format sarif should produce valid SARIF output."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = _write_tool_file(tmpdir, "t1", _make_safe_tool("t1"))

            exit_code = main(["--format", "sarif", path])
            output = json.loads(capsys.readouterr().out)

            assert exit_code == 0
            assert output["version"] == "2.1.0"
            assert "runs" in output

    def test_sarif_compact(self, capsys):
        """--format sarif --compact-json should produce compact SARIF."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = _write_tool_file(tmpdir, "t1", _make_safe_tool("t1"))

            main(["--format", "sarif", "--compact-json", path])
            captured = capsys.readouterr()

            # Should be valid JSON
            output = json.loads(captured.out)
            assert output["version"] == "2.1.0"


# =============================================================================
# --output-schema
# =============================================================================


class TestOutputSchema:
    def test_output_schema_prints_valid_json_schema(self, capsys):
        """--output-schema should print the JSON Schema for tool-scan output."""
        exit_code = main(["--output-schema"])
        output = json.loads(capsys.readouterr().out)

        assert exit_code == 0
        assert output["$schema"] == "https://json-schema.org/draft/2020-12/schema"
        assert "GradeReport" in str(output)
        assert "Remark" in str(output)

    def test_output_schema_validates_real_output(self, capsys):
        """The output schema should structurally match real tool-scan output."""
        # Get the schema
        main(["--output-schema"])
        schema = json.loads(capsys.readouterr().out)

        # Get real output
        with tempfile.TemporaryDirectory() as tmpdir:
            path = _write_tool_file(tmpdir, "t1", _make_safe_tool("t1"))
            main(["--json", path])
            real_output = json.loads(capsys.readouterr().out)

        # Verify top-level keys match schema
        required_keys = set(schema.get("required", []))
        assert required_keys.issubset(set(real_output.keys()))


# =============================================================================
# --plugin-dir
# =============================================================================


class TestPluginDir:
    def test_plugin_dir_loads_rules(self, capsys):
        """--plugin-dir should load custom rules."""
        plugin_code = '''
from tool_scan.plugins import SecurityRulePlugin, ThreatPatternSpec
from tool_scan.security_scanner import ThreatCategory, ThreatSeverity

class CustomRule(SecurityRulePlugin):
    @property
    def name(self):
        return "test-rule"

    @property
    def version(self):
        return "0.1.0"

    def get_threat_patterns(self):
        return [
            ThreatPatternSpec(
                pattern=r"custom_forbidden_pattern",
                category=ThreatCategory.TOOL_POISONING,
                severity=ThreatSeverity.HIGH,
                title="Custom forbidden pattern",
                description="Detected custom forbidden pattern from plugin",
            ),
        ]
'''
        with tempfile.TemporaryDirectory() as tmpdir:
            # Write plugin
            with open(os.path.join(tmpdir, "custom_rule.py"), "w") as f:
                f.write(plugin_code)

            # Write tool that triggers the custom rule
            tool = {
                "name": "trigger_tool",
                "description": "This has custom_forbidden_pattern in it",
                "inputSchema": {"type": "object"},
            }
            tool_path = _write_tool_file(tmpdir, "trigger", tool)

            main(["--json", "--plugin-dir", tmpdir, tool_path])
            output = json.loads(capsys.readouterr().out)

            # Check the custom pattern was detected
            remarks = output["results"]["trigger_tool"]["remarks"]
            titles = [r["title"] for r in remarks]
            assert "Custom forbidden pattern" in titles

    def test_plugin_dir_nonexistent_no_crash(self, capsys):
        """--plugin-dir with nonexistent path should not crash."""
        with tempfile.TemporaryDirectory() as tmpdir:
            path = _write_tool_file(tmpdir, "t1", _make_safe_tool("t1"))
            exit_code = main(["--json", "--plugin-dir", "/nonexistent", path])
            output = json.loads(capsys.readouterr().out)

            assert exit_code == 0
            assert "t1" in output["results"]


# =============================================================================
# build_json_output helper
# =============================================================================


class TestBuildJsonOutput:
    def test_build_json_output_structure(self):
        grader = MCPToolGrader(strict_security=False)
        tool = _make_safe_tool("test")
        reports = {"test": grader.grade(tool)}

        output = _build_json_output(reports, [], min_score=70)

        assert "results" in output
        assert "summary" in output
        assert "errors" in output
        assert output["summary"]["total"] == 1
        assert isinstance(output["errors"], list)

    def test_build_json_output_with_errors(self):
        grader = MCPToolGrader(strict_security=False)
        tool = _make_safe_tool("test")
        reports = {"test": grader.grade(tool)}
        errors = ["File not found: bad.json"]

        output = _build_json_output(reports, errors, min_score=70)

        assert output["errors"] == ["File not found: bad.json"]
