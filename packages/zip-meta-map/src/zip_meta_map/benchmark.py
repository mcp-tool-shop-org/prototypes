"""Performance benchmarking for zip-meta-map.

Run: python -m zip_meta_map.benchmark [path] [--runs N]

Reports timing for each phase: scan, roles, index build, front generation.
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from zip_meta_map.builder import build, build_front, build_index, detect_profile, validate_index
from zip_meta_map.roles import assign_role
from zip_meta_map.scanner import scan_directory, scan_directory_incremental


def _fmt_time(seconds: float) -> str:
    if seconds < 0.001:
        return f"{seconds * 1_000_000:.0f} us"
    if seconds < 1.0:
        return f"{seconds * 1000:.1f} ms"
    return f"{seconds:.2f} s"


def _fmt_size(bytes_val: int) -> str:
    if bytes_val < 1024:
        return f"{bytes_val} B"
    if bytes_val < 1024 * 1024:
        return f"{bytes_val / 1024:.1f} KB"
    return f"{bytes_val / (1024 * 1024):.1f} MB"


def benchmark(input_path: Path, runs: int = 3, use_cache: bool = False) -> dict:
    """Run benchmarks on a directory and return timing results."""
    input_path = input_path.resolve()
    if not input_path.is_dir():
        raise ValueError(f"Benchmark requires a directory, got: {input_path}")

    results: dict = {
        "path": str(input_path),
        "runs": runs,
        "phases": {},
    }

    # Phase 1: Scan (cold)
    scan_times: list[float] = []
    files = []
    for _ in range(runs):
        t0 = time.perf_counter()
        preliminary = scan_directory(input_path, [".git/**"])
        profile = detect_profile(preliminary)
        files = scan_directory(input_path, profile.ignore_globs, retain_content=True)
        scan_times.append(time.perf_counter() - t0)

    results["file_count"] = len(files)
    results["total_bytes"] = sum(f.size_bytes for f in files)
    results["profile"] = profile.name
    results["phases"]["scan"] = {
        "min": min(scan_times),
        "max": max(scan_times),
        "avg": sum(scan_times) / len(scan_times),
    }

    # Phase 1b: Incremental scan (if cache enabled)
    if use_cache:
        cache_path = input_path / ".zip-meta-map-cache.json"
        incr_times: list[float] = []
        for _ in range(runs):
            t0 = time.perf_counter()
            scan_directory_incremental(input_path, profile.ignore_globs, cache_path)
            incr_times.append(time.perf_counter() - t0)
        results["phases"]["scan_incremental"] = {
            "min": min(incr_times),
            "max": max(incr_times),
            "avg": sum(incr_times) / len(incr_times),
        }
        # Clean up cache
        if cache_path.exists():
            cache_path.unlink()

    # Phase 2: Role assignment
    role_times: list[float] = []
    for _ in range(runs):
        t0 = time.perf_counter()
        for f in files:
            assign_role(f.path, profile)
        role_times.append(time.perf_counter() - t0)

    results["phases"]["roles"] = {
        "min": min(role_times),
        "max": max(role_times),
        "avg": sum(role_times) / len(role_times),
        "per_file_us": (sum(role_times) / len(role_times)) / max(len(files), 1) * 1_000_000,
    }

    # Phase 3: Index build
    build_times: list[float] = []
    index = {}
    for _ in range(runs):
        t0 = time.perf_counter()
        index = build_index(files, profile, input_path.name)
        build_times.append(time.perf_counter() - t0)

    results["phases"]["build_index"] = {
        "min": min(build_times),
        "max": max(build_times),
        "avg": sum(build_times) / len(build_times),
    }

    # Phase 4: FRONT.md generation
    front_times: list[float] = []
    for _ in range(runs):
        t0 = time.perf_counter()
        build_front(index, input_path.name)
        front_times.append(time.perf_counter() - t0)

    results["phases"]["build_front"] = {
        "min": min(front_times),
        "max": max(front_times),
        "avg": sum(front_times) / len(front_times),
    }

    # Phase 5: Schema validation
    validate_times: list[float] = []
    for _ in range(runs):
        t0 = time.perf_counter()
        validate_index(index)
        validate_times.append(time.perf_counter() - t0)

    results["phases"]["validate"] = {
        "min": min(validate_times),
        "max": max(validate_times),
        "avg": sum(validate_times) / len(validate_times),
    }

    # Total end-to-end
    e2e_times: list[float] = []
    for _ in range(runs):
        t0 = time.perf_counter()
        build(input_path)
        e2e_times.append(time.perf_counter() - t0)

    results["phases"]["end_to_end"] = {
        "min": min(e2e_times),
        "max": max(e2e_times),
        "avg": sum(e2e_times) / len(e2e_times),
    }

    return results


def format_results(results: dict) -> str:
    """Format benchmark results as a human-readable report."""
    lines: list[str] = []

    lines.append(f"Benchmark: {results['path']}")
    lines.append(f"  Files:   {results['file_count']}")
    lines.append(f"  Size:    {_fmt_size(results['total_bytes'])}")
    lines.append(f"  Profile: {results['profile']}")
    lines.append(f"  Runs:    {results['runs']}")
    lines.append("")
    lines.append(f"{'Phase':<25s}  {'Min':>10s}  {'Avg':>10s}  {'Max':>10s}")
    lines.append("-" * 60)

    for phase_name, timings in results["phases"].items():
        label = phase_name.replace("_", " ").title()
        lines.append(
            f"{label:<25s}  {_fmt_time(timings['min']):>10s}  "
            f"{_fmt_time(timings['avg']):>10s}  {_fmt_time(timings['max']):>10s}"
        )

    # Role throughput
    if "roles" in results["phases"]:
        per_file = results["phases"]["roles"].get("per_file_us", 0)
        lines.append("")
        lines.append(f"Role assignment throughput: {per_file:.1f} us/file")

    # Files/sec for end-to-end
    if "end_to_end" in results["phases"]:
        avg_e2e = results["phases"]["end_to_end"]["avg"]
        if avg_e2e > 0:
            fps = results["file_count"] / avg_e2e
            lines.append(f"End-to-end throughput:     {fps:.0f} files/sec")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="zip-meta-map-benchmark",
        description="Benchmark zip-meta-map performance on a directory.",
    )
    parser.add_argument("path", type=Path, help="Directory to benchmark")
    parser.add_argument("--runs", type=int, default=3, help="Number of runs per phase (default: 3)")
    parser.add_argument("--cache", action="store_true", help="Also benchmark incremental scanning")
    parser.add_argument("--json", action="store_true", dest="json_output", help="Output as JSON")

    args = parser.parse_args(argv)

    if not args.path.exists() or not args.path.is_dir():
        print(f"Error: {args.path} is not a directory", file=sys.stderr)
        return 1

    results = benchmark(args.path, runs=args.runs, use_cache=args.cache)

    if args.json_output:
        import json

        print(json.dumps(results, indent=2))
    else:
        print(format_results(results))

    return 0


if __name__ == "__main__":
    sys.exit(main())
