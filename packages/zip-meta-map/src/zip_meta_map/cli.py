"""CLI entry point for zip-meta-map."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from zip_meta_map import __version__
from zip_meta_map.builder import build, validate_index
from zip_meta_map.profiles import ALL_PROFILES


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="zip-meta-map",
        description="Generate machine-readable metadata manifests for ZIP archives and project directories.",
    )
    parser.add_argument("--version", action="version", version=f"zip-meta-map {__version__}")

    subparsers = parser.add_subparsers(dest="command")

    # build command
    build_parser = subparsers.add_parser("build", help="Scan input and generate metadata files")
    build_parser.add_argument("input", type=Path, help="Path to a directory or .zip file")
    build_parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Output directory for generated files (default: print to stdout)",
    )
    build_parser.add_argument(
        "-p",
        "--profile",
        choices=list(ALL_PROFILES.keys()),
        default=None,
        help="Force a specific profile (default: auto-detect)",
    )
    build_parser.add_argument(
        "--policy",
        type=Path,
        default=None,
        help="Path to a META_ZIP_POLICY.json file",
    )
    build_parser.add_argument(
        "--format",
        choices=["pretty", "json", "ndjson"],
        default="pretty",
        dest="output_format",
        help="Output format when printing to stdout (default: pretty)",
    )
    build_parser.add_argument(
        "--manifest-only",
        action="store_true",
        help="Emit only META_ZIP_INDEX.json (no FRONT.md), useful for pipelines",
    )
    build_parser.add_argument(
        "--summary",
        action="store_true",
        help="Write a step summary to $GITHUB_STEP_SUMMARY (or stdout if not in CI)",
    )
    build_parser.add_argument(
        "--report",
        choices=["md"],
        default=None,
        dest="report_format",
        help="Generate a detailed standalone markdown report",
    )

    # explain command
    explain_parser = subparsers.add_parser("explain", help="Show detected profile and top files to read")
    explain_parser.add_argument("input", type=Path, help="Path to a directory or .zip file")
    explain_parser.add_argument(
        "-p",
        "--profile",
        choices=list(ALL_PROFILES.keys()),
        default=None,
        help="Force a specific profile (default: auto-detect)",
    )
    explain_parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Output explain results as JSON",
    )

    # diff command
    diff_parser = subparsers.add_parser("diff", help="Compare two META_ZIP_INDEX.json files")
    diff_parser.add_argument("old", type=Path, help="Path to the old/base META_ZIP_INDEX.json")
    diff_parser.add_argument("new", type=Path, help="Path to the new/current META_ZIP_INDEX.json")
    diff_parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Output diff as JSON",
    )
    diff_parser.add_argument(
        "--exit-code",
        action="store_true",
        help="Exit with code 1 if changes detected (like diff --exit-code)",
    )

    # compare command
    compare_parser = subparsers.add_parser(
        "compare", help="Compare two indexes from different repos (archetype matching)"
    )
    compare_parser.add_argument("left", type=Path, help="Path to first META_ZIP_INDEX.json")
    compare_parser.add_argument("right", type=Path, help="Path to second META_ZIP_INDEX.json")
    compare_parser.add_argument(
        "--json",
        action="store_true",
        dest="json_output",
        help="Output comparison as JSON",
    )
    compare_parser.add_argument(
        "--exit-code",
        action="store_true",
        help="Exit with code 1 if similarity < 0.5 (repos are 'different')",
    )

    # benchmark command
    bench_parser = subparsers.add_parser("benchmark", help="Benchmark performance on a directory")
    bench_parser.add_argument("input", type=Path, help="Directory to benchmark")
    bench_parser.add_argument("--runs", type=int, default=3, help="Number of runs per phase (default: 3)")
    bench_parser.add_argument("--cache", action="store_true", help="Also benchmark incremental scanning")
    bench_parser.add_argument("--json", action="store_true", dest="json_output", help="Output as JSON")

    # serve command
    subparsers.add_parser("serve", help="Start the MCP server (requires pip install 'zip-meta-map[mcp]')")

    # validate command
    validate_parser = subparsers.add_parser("validate", help="Validate a META_ZIP_INDEX.json file against the schema")
    validate_parser.add_argument("input", type=Path, help="Path to a META_ZIP_INDEX.json file")

    args = parser.parse_args(argv)

    if args.command is None:
        parser.print_help()
        return 0

    if args.command == "build":
        return _cmd_build(args)

    if args.command == "explain":
        return _cmd_explain(args)

    if args.command == "diff":
        return _cmd_diff(args)

    if args.command == "benchmark":
        return _cmd_benchmark(args)

    if args.command == "serve":
        from zip_meta_map.server import main as serve_main

        serve_main()
        return 0

    if args.command == "compare":
        return _cmd_compare(args)

    if args.command == "validate":
        return _cmd_validate(args)

    return 0


def _cmd_build(args: argparse.Namespace) -> int:
    input_path: Path = args.input
    if not input_path.exists():
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        return 1

    policy_path: Path | None = args.policy
    if policy_path and not policy_path.exists():
        print(f"Error: policy file {policy_path} does not exist", file=sys.stderr)
        return 1

    # For --manifest-only with -o, still write the directory but skip FRONT.md
    output_dir = args.output
    manifest_only = args.manifest_only

    try:
        front, index = build(
            input_path,
            output_dir=None if manifest_only and output_dir else output_dir,
            profile_name=args.profile,
            policy_path=policy_path,
        )
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    # Handle --manifest-only with -o: write only the JSON
    if manifest_only and output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "META_ZIP_INDEX.json").write_text(json.dumps(index, indent=2) + "\n", encoding="utf-8")

    if output_dir:
        # Print build summary
        file_count = len(index["files"])
        profile = index["profile"]
        modules = index.get("modules", [])
        warnings = index.get("warnings", [])
        chunked = sum(1 for f in index["files"] if f.get("chunks"))
        flagged = sum(1 for f in index["files"] if f.get("risk_flags"))

        wrote = "META_ZIP_INDEX.json" if manifest_only else "META_ZIP_FRONT.md and META_ZIP_INDEX.json"
        print(f"Wrote {wrote} to {output_dir}/")
        print(f"  Profile:  {profile}")
        print(f"  Files:    {file_count}")
        if modules:
            print(f"  Modules:  {len(modules)}")
        if chunked:
            print(f"  Chunked:  {chunked} file(s)")
        if flagged:
            print(f"  Flagged:  {flagged} file(s) with risk flags")
        if warnings:
            print(f"  Warnings: {len(warnings)}")
    else:
        _print_build_output(front, index, args.output_format, manifest_only)

    # Derive project name from input path
    project_name = input_path.stem if input_path.suffix == ".zip" else input_path.name

    # Step summary
    if args.summary:
        from zip_meta_map.report import build_step_summary

        summary_md = build_step_summary(index, project_name)
        summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
        if summary_path:
            with open(summary_path, "a", encoding="utf-8") as f:
                f.write(summary_md + "\n")
        else:
            print(summary_md)

    # Report
    if args.report_format:
        from zip_meta_map.report import build_report

        report_md = build_report(index, project_name)
        if output_dir:
            output_dir.mkdir(parents=True, exist_ok=True)
            (output_dir / "META_ZIP_REPORT.md").write_text(report_md, encoding="utf-8")
            print(f"Wrote META_ZIP_REPORT.md to {output_dir}/")
        else:
            print(report_md)

    return 0


def _print_build_output(front: str, index: dict, fmt: str, manifest_only: bool) -> None:
    """Print build output to stdout in the requested format."""
    if fmt == "json":
        if manifest_only:
            print(json.dumps(index, indent=2))
        else:
            print(json.dumps({"front_md": front, "index": index}, indent=2))
    elif fmt == "ndjson":
        # One JSON line per file entry — useful for piping
        for f in index["files"]:
            print(json.dumps(f))
    else:
        # pretty (default)
        if not manifest_only:
            print("--- META_ZIP_FRONT.md ---")
            print(front)
        print("--- META_ZIP_INDEX.json ---")
        print(json.dumps(index, indent=2))


def _cmd_explain(args: argparse.Namespace) -> int:
    input_path: Path = args.input
    if not input_path.exists():
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        return 1

    try:
        _, index = build(input_path, profile_name=args.profile)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1

    if args.json_output:
        explain_data = _build_explain_data(index)
        print(json.dumps(explain_data, indent=2))
        return 0

    profile = index["profile"]
    start_here = index["start_here"]
    files = index["files"]
    plans = index["plans"]

    print(f"Profile:  {profile}")
    print(f"Files:    {len(files)}")
    print()

    # Role distribution
    role_counts: dict[str, int] = {}
    for f in files:
        role_counts[f["role"]] = role_counts.get(f["role"], 0) + 1
    print("Roles:")
    for role, count in sorted(role_counts.items(), key=lambda x: -x[1]):
        print(f"  {role:20s} {count}")
    print()

    # Top 10 "read first" files
    file_map = {f["path"]: f for f in files}
    print("Top files to read first:")
    shown = 0
    for path in start_here:
        if shown >= 10:
            break
        entry = file_map.get(path, {})
        role = entry.get("role", "?")
        conf = entry.get("confidence", 0)
        reason = entry.get("reason", "")
        print(f"  {path:40s}  [{role}]  conf={conf:.2f}  {reason}")
        shown += 1
    print()

    # Modules
    modules = index.get("modules", [])
    if modules:
        print(f"Modules ({len(modules)}):")
        for mod in modules[:10]:
            summary = mod.get("summary", "")
            print(f"  {mod['path']:40s}  {mod['file_count']} files  {summary}")
        print()

    # Overview plan
    if "overview" in plans:
        plan = plans["overview"]
        print("Overview plan:")
        print(f"  {plan['description']}")
        for i, step in enumerate(plan["steps"], 1):
            print(f"  {i}. {step}")
        if plan.get("max_total_bytes"):
            print(f"  Budget: ~{plan['max_total_bytes'] // 1024} KB")
    print()

    # Safety warnings
    warnings = index.get("warnings", [])
    if warnings:
        print(f"Warnings ({len(warnings)}):")
        for w in warnings:
            print(f"  - {w}")
        print()

    # Low-confidence warnings
    low_conf = [(f["path"], f["confidence"], f.get("reason", "")) for f in files if f["confidence"] < 0.5]
    if low_conf:
        print(f"Low confidence ({len(low_conf)} files):")
        for path, conf, reason in low_conf[:5]:
            print(f"  {path:40s}  conf={conf:.2f}  {reason}")
        if len(low_conf) > 5:
            print(f"  ... and {len(low_conf) - 5} more")

    return 0


def _build_explain_data(index: dict) -> dict:
    """Build a structured explain object for --json output."""
    files = index["files"]

    role_counts: dict[str, int] = {}
    for f in files:
        role_counts[f["role"]] = role_counts.get(f["role"], 0) + 1

    return {
        "profile": index["profile"],
        "file_count": len(files),
        "roles": role_counts,
        "start_here": index["start_here"],
        "modules": index.get("modules", []),
        "plans": index["plans"],
        "warnings": index.get("warnings", []),
        "capabilities": index.get("capabilities", []),
        "low_confidence_count": sum(1 for f in files if f["confidence"] < 0.5),
    }


def _cmd_diff(args: argparse.Namespace) -> int:
    old_path: Path = args.old
    new_path: Path = args.new

    for path, label in [(old_path, "old"), (new_path, "new")]:
        if not path.exists():
            print(f"Error: {label} file {path} does not exist", file=sys.stderr)
            return 1

    try:
        old_data = json.loads(old_path.read_text(encoding="utf-8"))
        new_data = json.loads(new_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error: could not read JSON: {e}", file=sys.stderr)
        return 1

    from zip_meta_map.diff import diff_indices, format_diff_human, format_diff_json

    result = diff_indices(old_data, new_data)

    if args.json_output:
        print(format_diff_json(result))
    else:
        print(format_diff_human(result))

    if args.exit_code:
        return 1 if result.has_changes else 0
    return 0


def _cmd_benchmark(args: argparse.Namespace) -> int:
    input_path: Path = args.input
    if not input_path.exists() or not input_path.is_dir():
        print(f"Error: {input_path} is not a directory", file=sys.stderr)
        return 1

    from zip_meta_map.benchmark import benchmark, format_results

    results = benchmark(input_path, runs=args.runs, use_cache=args.cache)

    if args.json_output:
        print(json.dumps(results, indent=2))
    else:
        print(format_results(results))

    return 0


def _cmd_compare(args: argparse.Namespace) -> int:
    left_path: Path = args.left
    right_path: Path = args.right

    for path, label in [(left_path, "left"), (right_path, "right")]:
        if not path.exists():
            print(f"Error: {label} file {path} does not exist", file=sys.stderr)
            return 1

    try:
        left_data = json.loads(left_path.read_text(encoding="utf-8"))
        right_data = json.loads(right_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error: could not read JSON: {e}", file=sys.stderr)
        return 1

    from zip_meta_map.compare import compare_indices, format_compare_human, format_compare_json

    result = compare_indices(left_data, right_data)

    if args.json_output:
        print(format_compare_json(result))
    else:
        print(format_compare_human(result))

    if args.exit_code:
        return 0 if result.overall_similarity >= 0.5 else 1
    return 0


def _cmd_validate(args: argparse.Namespace) -> int:
    input_path: Path = args.input
    if not input_path.exists():
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        return 1

    try:
        data = json.loads(input_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error: could not read JSON: {e}", file=sys.stderr)
        return 1

    try:
        validate_index(data)
    except Exception as e:
        print(f"Validation failed: {e}", file=sys.stderr)
        return 1

    file_count = len(data.get("files", []))
    caps = data.get("capabilities", [])
    caps_str = f", capabilities: {', '.join(caps)}" if caps else ""
    print(f"Valid META_ZIP_INDEX.json ({file_count} files, version {data.get('version', '?')}{caps_str})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
