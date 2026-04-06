"""Tests for role assignment with confidence scoring."""

from zip_meta_map.profiles import NODE_TS_TOOL, PYTHON_CLI
from zip_meta_map.roles import assign_role

# ── Entrypoints ──


def test_entrypoint_python_main():
    r = assign_role("src/myapp/main.py", PYTHON_CLI)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_entrypoint_python_cli():
    r = assign_role("src/myapp/cli.py", PYTHON_CLI)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_entrypoint_node_index():
    r = assign_role("src/index.ts", NODE_TS_TOOL)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_entrypoint_node_cli():
    r = assign_role("src/cli.ts", NODE_TS_TOOL)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


# ── Config ──


def test_config_pyproject():
    r = assign_role("pyproject.toml", PYTHON_CLI)
    assert r.role == "config"
    assert r.confidence >= 0.90


def test_config_package_json():
    r = assign_role("package.json", NODE_TS_TOOL)
    assert r.role == "config"
    assert r.confidence >= 0.90


def test_config_tsconfig():
    r = assign_role("tsconfig.json", NODE_TS_TOOL)
    assert r.role == "config"
    assert r.confidence >= 0.80


# ── Lockfiles ──


def test_lockfile_package_lock():
    r = assign_role("package-lock.json", NODE_TS_TOOL)
    assert r.role == "lockfile"
    assert r.confidence >= 0.90


def test_lockfile_poetry():
    r = assign_role("poetry.lock", PYTHON_CLI)
    assert r.role == "lockfile"
    assert r.confidence >= 0.90


def test_lockfile_cargo():
    r = assign_role("Cargo.lock", PYTHON_CLI)
    assert r.role == "lockfile"
    assert r.confidence >= 0.90


# ── CI ──


def test_ci_github_workflow():
    r = assign_role(".github/workflows/ci.yml", PYTHON_CLI)
    assert r.role == "ci"
    assert r.confidence >= 0.85


def test_ci_circleci():
    r = assign_role(".circleci/config.yml", PYTHON_CLI)
    assert r.role == "ci"
    assert r.confidence >= 0.85


# ── Docs ──


def test_doc_readme():
    r = assign_role("README.md", PYTHON_CLI)
    assert r.role == "doc"
    assert r.confidence >= 0.90


def test_doc_license():
    r = assign_role("LICENSE", PYTHON_CLI)
    assert r.role == "doc"
    assert r.confidence >= 0.85


def test_doc_architecture():
    r = assign_role("ARCHITECTURE.md", PYTHON_CLI)
    assert r.role == "doc_architecture"
    assert r.confidence >= 0.85


def test_doc_api_dir():
    r = assign_role("docs/api/endpoints.md", PYTHON_CLI)
    assert r.role == "doc_api"
    assert r.confidence >= 0.70


# ── Tests & Fixtures ──


def test_test_file():
    r = assign_role("tests/test_main.py", PYTHON_CLI)
    assert r.role == "test"
    assert r.confidence >= 0.80


def test_test_spec_file():
    r = assign_role("src/utils.spec.ts", NODE_TS_TOOL)
    assert r.role == "test"
    assert r.confidence >= 0.80


def test_fixture_dir():
    r = assign_role("tests/fixtures/sample.json", PYTHON_CLI)
    assert r.role == "fixture"
    assert r.confidence >= 0.80


# ── Source ──


def test_source_detection():
    r = assign_role("src/myapp/utils.py", PYTHON_CLI)
    assert r.role == "source"
    assert r.confidence >= 0.50


# ── Public API ──


def test_public_api_init():
    r = assign_role("src/myapp/__init__.py", PYTHON_CLI)
    assert r.role == "public_api"
    assert r.confidence >= 0.60


# ── Build ──


def test_build_makefile():
    r = assign_role("Makefile", PYTHON_CLI)
    assert r.role == "build"
    assert r.confidence >= 0.85


def test_build_dockerfile():
    r = assign_role("Dockerfile", PYTHON_CLI)
    assert r.role == "build"
    assert r.confidence >= 0.80


# ── Schema ──


def test_schema_json_schema():
    r = assign_role("schema/meta.schema.json", PYTHON_CLI)
    assert r.role == "schema"
    assert r.confidence >= 0.80


def test_schema_proto():
    r = assign_role("proto/service.proto", PYTHON_CLI)
    assert r.role == "schema"
    assert r.confidence >= 0.80


# ── Generated / Vendor ──


def test_generated_dist():
    r = assign_role("dist/index.js", PYTHON_CLI)
    assert r.role == "generated"
    assert r.confidence >= 0.80


def test_vendor_dir():
    r = assign_role("vendor/lib/thing.js", PYTHON_CLI)
    assert r.role == "vendor"
    assert r.confidence >= 0.80


# ── Scripts ──


def test_script_dir():
    r = assign_role("scripts/deploy.sh", PYTHON_CLI)
    assert r.role == "script"
    assert r.confidence >= 0.70


# ── Assets ──


def test_asset_image():
    r = assign_role("assets/logo.png", PYTHON_CLI)
    assert r.role == "asset"
    assert r.confidence >= 0.70


# ── Data ──


def test_data_csv():
    r = assign_role("data/results.csv", PYTHON_CLI)
    assert r.role == "data"
    assert r.confidence >= 0.70


# ── Unknown ──


def test_unknown_fallback():
    r = assign_role("random.bin", PYTHON_CLI)
    assert r.role == "unknown"
    assert r.confidence < 0.50
    assert r.reason  # must have an explanation


# ── Confidence band invariants ──


def test_high_confidence_entrypoint():
    """Entrypoints detected by profile pattern should be >= 0.90."""
    r = assign_role("src/myapp/main.py", PYTHON_CLI)
    assert r.confidence >= 0.90


def test_good_confidence_test():
    """Test files matched by directory convention should be >= 0.70."""
    r = assign_role("tests/test_scanner.py", PYTHON_CLI)
    assert r.confidence >= 0.70


def test_fair_confidence_source_by_ext():
    """Source code detected only by extension should be >= 0.50."""
    r = assign_role("lib/helpers.py", PYTHON_CLI)
    assert r.confidence >= 0.50


def test_reason_always_present():
    """Every assignment should have a non-empty reason."""
    paths = [
        "src/app/main.py",
        "README.md",
        "package-lock.json",
        ".github/workflows/ci.yml",
        "random.xyz",
    ]
    for path in paths:
        r = assign_role(path, PYTHON_CLI)
        assert r.reason, f"No reason for {path}"
