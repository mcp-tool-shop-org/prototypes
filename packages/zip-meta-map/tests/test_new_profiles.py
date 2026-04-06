"""Tests for new built-in profiles: Rust, Go, .NET, Java."""

from pathlib import Path

from zip_meta_map.builder import build, validate_index
from zip_meta_map.profiles import DOTNET_CLI, GO_CLI, JAVA_CLI, RUST_CLI
from zip_meta_map.roles import assign_role

RUST_FIXTURE = Path(__file__).parent / "fixtures" / "tiny_rust_cli"
GO_FIXTURE = Path(__file__).parent / "fixtures" / "tiny_go_cli"
DOTNET_FIXTURE = Path(__file__).parent / "fixtures" / "tiny_dotnet_cli"
JAVA_FIXTURE = Path(__file__).parent / "fixtures" / "tiny_java_cli"


# ── Rust profile ──


def test_rust_detects_profile():
    """Rust fixture should auto-detect as rust_cli."""
    _, index = build(RUST_FIXTURE)
    assert index["profile"] == "rust_cli"
    validate_index(index)


def test_rust_entrypoint():
    r = assign_role("src/main.rs", RUST_CLI)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_rust_lib_entrypoint():
    r = assign_role("src/lib.rs", RUST_CLI)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_rust_cargo_toml():
    r = assign_role("Cargo.toml", RUST_CLI)
    assert r.role == "config"
    assert r.confidence >= 0.90


def test_rust_build_script():
    """build.rs is in _NAME_ROLES as 'build' role (priority 4, before custom roles)."""
    r = assign_role("build.rs", RUST_CLI)
    assert r.role == "build"
    assert r.confidence >= 0.85


def test_rust_fixture_has_plans():
    _, index = build(RUST_FIXTURE)
    assert "overview" in index["plans"]
    assert "debug" in index["plans"]
    assert "deep_dive" in index["plans"]
    assert "security_review" in index["plans"]


def test_rust_fixture_start_here():
    _, index = build(RUST_FIXTURE)
    assert "README.md" in index["start_here"]


def test_rust_fixture_roles():
    _, index = build(RUST_FIXTURE)
    file_roles = {f["path"]: f["role"] for f in index["files"]}
    assert file_roles["README.md"] == "doc"
    assert file_roles["Cargo.toml"] == "config"
    assert file_roles["src/main.rs"] == "entrypoint"


def test_rust_custom_roles_advertised():
    _, index = build(RUST_FIXTURE)
    assert "custom_roles" in index
    assert "bench" in index["custom_roles"]


# ── Go profile ──


def test_go_detects_profile():
    """Go fixture should auto-detect as go_cli."""
    _, index = build(GO_FIXTURE)
    assert index["profile"] == "go_cli"
    validate_index(index)


def test_go_entrypoint():
    r = assign_role("cmd/app/main.go", GO_CLI)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_go_mod():
    r = assign_role("go.mod", GO_CLI)
    assert r.role == "config"
    assert r.confidence >= 0.90


def test_go_test_file():
    r = assign_role("cmd/app/main_test.go", GO_CLI)
    assert r.role == "test"
    assert r.confidence >= 0.80


def test_go_fixture_has_plans():
    _, index = build(GO_FIXTURE)
    assert "overview" in index["plans"]
    assert "deep_dive" in index["plans"]


def test_go_fixture_start_here():
    _, index = build(GO_FIXTURE)
    assert "README.md" in index["start_here"]


# ── .NET profile ──


def test_dotnet_detects_profile():
    """Dotnet fixture should auto-detect as dotnet_cli."""
    _, index = build(DOTNET_FIXTURE)
    assert index["profile"] == "dotnet_cli"
    validate_index(index)


def test_dotnet_entrypoint():
    r = assign_role("Program.cs", DOTNET_CLI)
    assert r.role == "entrypoint"
    assert r.confidence >= 0.90


def test_dotnet_csproj_custom_role():
    """*.csproj should match the project_file custom role."""
    r = assign_role("TinyDotnet.csproj", DOTNET_CLI)
    assert r.role == "project_file"
    assert r.confidence >= 0.85


def test_dotnet_fixture_has_plans():
    _, index = build(DOTNET_FIXTURE)
    assert "overview" in index["plans"]
    assert "deep_dive" in index["plans"]


def test_dotnet_fixture_start_here():
    _, index = build(DOTNET_FIXTURE)
    assert "README.md" in index["start_here"]


# ── Java profile ──


def test_java_detects_profile():
    """Java fixture should auto-detect as java_cli."""
    _, index = build(JAVA_FIXTURE)
    assert index["profile"] == "java_cli"
    validate_index(index)


def test_java_pom():
    r = assign_role("pom.xml", JAVA_CLI)
    # pom.xml is in _NAME_ROLES as config, which takes priority over custom role
    assert r.role in ("config", "maven_config")
    assert r.confidence >= 0.90


def test_java_fixture_has_plans():
    _, index = build(JAVA_FIXTURE)
    assert "overview" in index["plans"]
    assert "deep_dive" in index["plans"]


def test_java_fixture_start_here():
    _, index = build(JAVA_FIXTURE)
    assert "README.md" in index["start_here"]


# ── Cross-profile schema validity ──


def test_all_new_profiles_produce_valid_indices():
    """Every new profile fixture should produce schema-valid output."""
    for fixture in [RUST_FIXTURE, GO_FIXTURE, DOTNET_FIXTURE, JAVA_FIXTURE]:
        _, index = build(fixture)
        validate_index(index)
        assert len(index["files"]) > 0
        assert len(index["start_here"]) > 0
        assert len(index["plans"]) > 0
