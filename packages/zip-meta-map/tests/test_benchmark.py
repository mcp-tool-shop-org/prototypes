"""Tests for benchmark module."""

from pathlib import Path

from zip_meta_map.benchmark import benchmark, format_results

FIXTURE_DIR = Path(__file__).parent / "fixtures" / "tiny_python_cli"


def test_benchmark_runs():
    """Benchmark should complete and return valid results."""
    results = benchmark(FIXTURE_DIR, runs=1)
    assert results["file_count"] > 0
    assert results["total_bytes"] > 0
    assert results["profile"] == "python_cli"
    assert "scan" in results["phases"]
    assert "roles" in results["phases"]
    assert "build_index" in results["phases"]
    assert "build_front" in results["phases"]
    assert "validate" in results["phases"]
    assert "end_to_end" in results["phases"]


def test_benchmark_timing_sanity():
    """All timings should be positive numbers."""
    results = benchmark(FIXTURE_DIR, runs=1)
    for phase_name, timings in results["phases"].items():
        assert timings["min"] >= 0, f"{phase_name} min < 0"
        assert timings["avg"] >= 0, f"{phase_name} avg < 0"
        assert timings["max"] >= timings["min"], f"{phase_name} max < min"


def test_benchmark_with_cache():
    """Incremental benchmark should include scan_incremental phase."""
    results = benchmark(FIXTURE_DIR, runs=1, use_cache=True)
    assert "scan_incremental" in results["phases"]


def test_format_results():
    """format_results should produce readable output."""
    results = benchmark(FIXTURE_DIR, runs=1)
    text = format_results(results)
    assert "tiny_python_cli" in text
    assert "python_cli" in text
    assert "files/sec" in text


def test_benchmark_role_throughput():
    """Role throughput metric should be populated."""
    results = benchmark(FIXTURE_DIR, runs=1)
    assert "per_file_us" in results["phases"]["roles"]
    assert results["phases"]["roles"]["per_file_us"] > 0
