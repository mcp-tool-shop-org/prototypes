#!/usr/bin/env python3
"""
Tool-Scan CLI
=============

Security scanner for MCP tools.

Usage:
    # Scan a single tool
    tool-scan my_tool.json

    # Scan multiple tools
    tool-scan tool1.json tool2.json

    # JSON output for CI/CD
    tool-scan --json tool.json

    # Compact JSON for large batches
    tool-scan --json --compact-json tools/*.json

    # SARIF output for GitHub Security / code scanning
    tool-scan --format sarif tools/*.json

    # Strict mode (fail on any security issues)
    tool-scan --strict tool.json

    # Concurrent scanning
    tool-scan --jobs 4 tools/*.json

    # Custom plugin rules
    tool-scan --plugin-dir ./my-rules/ tool.json

    # Scan from stdin
    cat tool.json | tool-scan -

    # Output JSON schema (for CI validation)
    tool-scan --output-schema

Examples:
    # Quick security check
    tool-scan my_tool.json

    # CI/CD integration
    tool-scan --strict --min-score 80 --json tools/*.json

    # GitHub Code Scanning integration
    tool-scan --format sarif --strict tools/*.json > results.sarif
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from importlib.resources import files as _pkg_files
from pathlib import Path
from typing import Any, cast

from .grader import Grade, GradeReport, MCPToolGrader
from .plugins import PluginRegistry
from .sarif import grade_reports_to_sarif


# ANSI color codes
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"

    @classmethod
    def disable(cls) -> None:
        """Disable colors for non-TTY output."""
        cls.RESET = ""
        cls.BOLD = ""
        cls.RED = ""
        cls.GREEN = ""
        cls.YELLOW = ""
        cls.BLUE = ""
        cls.MAGENTA = ""
        cls.CYAN = ""


def colorize_grade(grade: Grade) -> str:
    """Colorize grade based on letter."""
    if grade.letter.startswith("A"):
        return f"{Colors.GREEN}{Colors.BOLD}{grade.letter}{Colors.RESET}"
    elif grade.letter.startswith("B"):
        return f"{Colors.BLUE}{grade.letter}{Colors.RESET}"
    elif grade.letter.startswith("C"):
        return f"{Colors.YELLOW}{grade.letter}{Colors.RESET}"
    elif grade.letter.startswith("D"):
        return f"{Colors.MAGENTA}{grade.letter}{Colors.RESET}"
    else:
        return f"{Colors.RED}{Colors.BOLD}{grade.letter}{Colors.RESET}"


def colorize_score(score: float) -> str:
    """Colorize score based on value."""
    if score >= 90:
        return f"{Colors.GREEN}{score:.0f}{Colors.RESET}"
    elif score >= 80:
        return f"{Colors.BLUE}{score:.0f}{Colors.RESET}"
    elif score >= 70:
        return f"{Colors.YELLOW}{score:.0f}{Colors.RESET}"
    elif score >= 60:
        return f"{Colors.MAGENTA}{score:.0f}{Colors.RESET}"
    else:
        return f"{Colors.RED}{score:.0f}{Colors.RESET}"


def print_report(report: GradeReport, verbose: bool = False) -> None:
    """Print a formatted grade report."""
    print()
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.BOLD}Tool: {Colors.CYAN}{report.tool_name}{Colors.RESET}")
    print(f"{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print()

    # Score and grade
    print(f"  Score: {colorize_score(report.score)}/100")
    print(f"  Grade: {colorize_grade(report.grade)} ({report.grade.description})")
    print()

    # Status - use ASCII alternatives for Windows compatibility
    safe_icon = (
        f"{Colors.GREEN}[OK]{Colors.RESET}" if report.is_safe else f"{Colors.RED}[X]{Colors.RESET}"
    )
    compliant_icon = (
        f"{Colors.GREEN}[OK]{Colors.RESET}"
        if report.is_compliant
        else f"{Colors.RED}[X]{Colors.RESET}"
    )
    print(f"  Safe: {safe_icon} {'Yes' if report.is_safe else 'No - Security Issues Found'}")
    print(
        f"  Compliant: {compliant_icon} {'Yes' if report.is_compliant else 'No - MCP Spec Violations'}"
    )
    print()

    # Remarks
    if report.remarks:
        print(f"  {Colors.BOLD}Remarks ({len(report.remarks)}):{Colors.RESET}")
        max_display = 20 if verbose else 5

        for displayed, remark in enumerate(report.remarks):
            if displayed >= max_display:
                remaining = len(report.remarks) - displayed
                print(f"    {Colors.CYAN}... and {remaining} more (use --verbose){Colors.RESET}")
                break

            # Color code by category
            if "Critical" in remark.category.value:
                color = Colors.RED
            elif "Security" in remark.category.value:
                color = Colors.MAGENTA
            elif "Compliance" in remark.category.value:
                color = Colors.YELLOW
            else:
                color = Colors.BLUE

            print(f"    {color}{remark.category.value}{Colors.RESET}: {remark.title}")
            if verbose and remark.action:
                print(f"      → {remark.action}")
    else:
        print(f"  {Colors.GREEN}No issues found - Tool is ready for production!{Colors.RESET}")

    print()


def print_summary_table(reports: dict[str, GradeReport]) -> None:
    """Print a summary table for multiple tools."""
    print()
    print(f"{Colors.BOLD}Summary{Colors.RESET}")
    print()

    # Header
    print(f"  {'Tool Name':<40} {'Score':>7} {'Grade':>7} {'Status':>10}")
    print(f"  {'-' * 40} {'-' * 7} {'-' * 7} {'-' * 10}")

    # Rows
    for name, report in sorted(reports.items(), key=lambda x: -x[1].score):
        status = (
            f"{Colors.GREEN}Safe{Colors.RESET}"
            if report.is_safe
            else f"{Colors.RED}Unsafe{Colors.RESET}"
        )
        print(
            f"  {name[:40]:<40} "
            f"{colorize_score(report.score):>7} "
            f"{colorize_grade(report.grade):>7} "
            f"{status:>10}"
        )

    print()

    # Overall stats
    total = len(reports)
    safe = sum(1 for r in reports.values() if r.is_safe)
    compliant = sum(1 for r in reports.values() if r.is_compliant)
    avg_score = sum(r.score for r in reports.values()) / total if total > 0 else 0

    print(f"  {Colors.BOLD}Total:{Colors.RESET} {total} tools")
    print(f"  {Colors.BOLD}Average Score:{Colors.RESET} {colorize_score(avg_score)}")
    print(f"  {Colors.BOLD}Safe:{Colors.RESET} {safe}/{total}")
    print(f"  {Colors.BOLD}Compliant:{Colors.RESET} {compliant}/{total}")
    print()


def load_tool(path: str) -> dict[str, Any]:
    """Load a tool definition from a file or stdin."""
    if path == "-":
        return cast(dict[str, Any], json.load(sys.stdin))

    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    with open(file_path) as f:
        return cast(dict[str, Any], json.load(f))


def _load_and_grade(
    file_path: str,
    grader: MCPToolGrader,
) -> tuple[dict[str, GradeReport], list[str]]:
    """Load a file and grade all tools in it. Returns (reports, errors)."""
    reports: dict[str, GradeReport] = {}
    errors: list[str] = []

    try:
        tool = load_tool(file_path)

        if isinstance(tool, list):
            for i, t in enumerate(tool):
                name = t.get("name", f"tool_{i}")
                reports[name] = grader.grade(t)
        else:
            name = tool.get("name", Path(file_path).stem if file_path != "-" else "stdin")
            reports[name] = grader.grade(tool)

    except json.JSONDecodeError as e:
        errors.append(f"Invalid JSON in {file_path}: {e}")
    except FileNotFoundError as e:
        errors.append(str(e))
    except Exception as e:
        errors.append(f"Error processing {file_path}: {e}")

    return reports, errors


def _build_json_output(
    reports: dict[str, GradeReport],
    errors: list[str],
    min_score: int,
) -> dict[str, Any]:
    """Build the standard JSON output dict."""
    return {
        "results": {name: report.json_report for name, report in reports.items()},
        "summary": {
            "total": len(reports),
            "passed": sum(
                1 for r in reports.values() if r.score >= min_score and r.is_safe
            ),
            "failed": sum(
                1 for r in reports.values() if r.score < min_score or not r.is_safe
            ),
            "average_score": sum(r.score for r in reports.values()) / len(reports)
            if reports
            else 0,
        },
        "errors": errors,
    }


def _write_streaming_json(
    reports: dict[str, GradeReport],
    errors: list[str],
    min_score: int,
    compact: bool,
    out: Any = None,
) -> None:
    """Write JSON output incrementally to reduce peak memory.

    Instead of building the full output dict and serializing at once,
    writes each result incrementally to the output stream.
    """
    if out is None:
        out = sys.stdout

    sep = ("," , ":") if compact else None
    indent = None if compact else 2

    # Write opening
    out.write('{\n  "results": {\n' if not compact else '{"results":{')

    sorted_names = sorted(reports.keys())
    for i, name in enumerate(sorted_names):
        report = reports[name]
        report_json = json.dumps(report.json_report, indent=indent, separators=sep)

        if compact:
            out.write(json.dumps(name, separators=sep))
            out.write(":")
            out.write(report_json)
        else:
            # Indent each line of the report
            indented = "\n".join(
                f"      {line}" if j > 0 else f"    {json.dumps(name)}: {line}"
                for j, line in enumerate(report_json.split("\n"))
            )
            out.write(indented)

        if i < len(sorted_names) - 1:
            out.write(",\n" if not compact else ",")

        # Flush periodically to avoid buffering everything
        if i % 100 == 0:
            out.flush()

    # Write summary
    summary = {
        "total": len(reports),
        "passed": sum(1 for r in reports.values() if r.score >= min_score and r.is_safe),
        "failed": sum(1 for r in reports.values() if r.score < min_score or not r.is_safe),
        "average_score": sum(r.score for r in reports.values()) / len(reports)
        if reports
        else 0,
    }

    summary_json = json.dumps(summary, indent=indent, separators=sep)
    errors_json = json.dumps(errors, indent=indent, separators=sep)

    if compact:
        out.write('},"summary":')
        out.write(summary_json)
        out.write(',"errors":')
        out.write(errors_json)
        out.write("}")
    else:
        out.write("\n  },\n")
        out.write(f'  "summary": {summary_json},\n')
        out.write(f'  "errors": {errors_json}\n')
        out.write("}")

    out.write("\n")
    out.flush()


def main(args: list[str] | None = None) -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        prog="tool-scan",
        description="Tool-Scan: Security scanner for MCP tools",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  tool-scan my_tool.json                Scan a single tool
  tool-scan --json tool.json            Output as JSON
  tool-scan --strict tools/*.json       Strict mode for CI/CD
  tool-scan --format sarif tools/*.json SARIF output for code scanning
  tool-scan --jobs 4 tools/*.json       Parallel scanning
  cat tool.json | tool-scan -           Read from stdin
  tool-scan --output-schema             Print JSON output schema

Exit codes:
  0  All tools passed (grade C- or better, no security issues)
  1  One or more tools failed security scan
  2  Error loading or parsing files
        """,
    )

    parser.add_argument(
        "files",
        nargs="*",
        metavar="FILE",
        help="Tool definition JSON file(s), or - for stdin",
    )

    parser.add_argument(
        "-j",
        "--json",
        action="store_true",
        help="Output results as JSON",
    )

    parser.add_argument(
        "-s",
        "--strict",
        action="store_true",
        help="Strict mode: fail on any security issues",
    )

    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Show all remarks and details",
    )

    parser.add_argument(
        "--min-score",
        type=int,
        default=70,
        metavar="N",
        help="Minimum passing score (default: 70)",
    )

    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable colored output",
    )

    parser.add_argument(
        "--include-optional",
        action="store_true",
        help="Include optional enterprise checks",
    )

    parser.add_argument(
        "--jobs",
        type=int,
        default=1,
        metavar="N",
        help="Number of concurrent workers for file processing (default: 1)",
    )

    parser.add_argument(
        "--compact-json",
        action="store_true",
        help="Emit compact JSON (no indentation) for large batches",
    )

    parser.add_argument(
        "--format",
        choices=["text", "json", "sarif"],
        default=None,
        dest="output_format",
        help="Output format: text (default), json, sarif",
    )

    parser.add_argument(
        "--plugin-dir",
        type=str,
        default=None,
        metavar="DIR",
        help="Directory containing custom rule plugin .py files",
    )

    parser.add_argument(
        "--output-schema",
        action="store_true",
        help="Print the JSON output schema and exit",
    )

    parser.add_argument(
        "--stream",
        action="store_true",
        help="Stream JSON results incrementally (reduces peak memory for large batches)",
    )

    parsed = parser.parse_args(args)

    # Handle --output-schema
    if parsed.output_schema:
        schema_path = _pkg_files("tool_scan").joinpath("output_schema.json")
        print(schema_path.read_text(encoding="utf-8"))
        return 0

    # Require files for all other operations
    if not parsed.files:
        parser.error("the following arguments are required: FILE")

    # Resolve output format: --format takes precedence, then --json flag
    output_format = parsed.output_format
    if output_format is None:
        output_format = "json" if parsed.json else "text"

    # Disable colors if requested or not a TTY or non-text output
    if parsed.no_color or not sys.stdout.isatty() or output_format != "text":
        Colors.disable()

    # Initialize plugin registry
    registry = PluginRegistry()
    if parsed.plugin_dir:
        loaded = registry.load_directory(parsed.plugin_dir)
        if loaded > 0 and output_format == "text":
            print(
                f"{Colors.CYAN}Loaded {loaded} plugin(s) from {parsed.plugin_dir}{Colors.RESET}",
                file=sys.stderr,
            )
    registry.discover_entry_points()

    # Initialize grader
    grader = MCPToolGrader(
        strict_security=parsed.strict,
        include_optional_checks=parsed.include_optional,
        plugin_registry=registry if registry.plugins else None,
    )

    # Load and grade tools
    reports: dict[str, GradeReport] = {}
    errors: list[str] = []

    if parsed.jobs > 1 and len(parsed.files) > 1:
        # Concurrent file processing
        with ThreadPoolExecutor(max_workers=parsed.jobs) as executor:
            futures = {
                executor.submit(_load_and_grade, fp, grader): fp for fp in parsed.files
            }
            for future in as_completed(futures):
                file_reports, file_errors = future.result()
                reports.update(file_reports)
                errors.extend(file_errors)
    else:
        # Sequential processing
        for file_path in parsed.files:
            file_reports, file_errors = _load_and_grade(file_path, grader)
            reports.update(file_reports)
            errors.extend(file_errors)

    # Output errors
    if errors:
        for error in errors:
            print(f"{Colors.RED}Error:{Colors.RESET} {error}", file=sys.stderr)
        if not reports:
            return 2

    # Output results
    if output_format == "sarif":
        sarif_output = grade_reports_to_sarif(reports)
        indent = None if parsed.compact_json else 2
        sep = (",", ":") if parsed.compact_json else None
        print(json.dumps(sarif_output, indent=indent, separators=sep))

    elif output_format == "json":
        if parsed.stream:
            _write_streaming_json(
                reports, errors, parsed.min_score, compact=parsed.compact_json
            )
        elif parsed.compact_json:
            output = _build_json_output(reports, errors, parsed.min_score)
            print(json.dumps(output, separators=(",", ":")))
        else:
            output = _build_json_output(reports, errors, parsed.min_score)
            print(json.dumps(output, indent=2))

    else:
        # Text output
        for report in reports.values():
            print_report(report, verbose=parsed.verbose)

        if len(reports) > 1:
            print_summary_table(reports)

    # Determine exit code
    failed = any(
        r.score < parsed.min_score or (parsed.strict and not r.is_safe) for r in reports.values()
    )

    return 1 if failed or errors else 0


if __name__ == "__main__":
    sys.exit(main())
