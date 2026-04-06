"""Tests for custom role extension system."""

from zip_meta_map.profiles import CustomRole, Plan, Profile
from zip_meta_map.roles import assign_role


def _profile_with_custom_roles(custom_roles: list[CustomRole]) -> Profile:
    """Create a minimal profile with custom roles for testing."""
    return Profile(
        name="test_profile",
        entrypoint_patterns=["src/main.py"],
        start_here_extras=["README.md"],
        ignore_globs=[".git/**"],
        plans={
            "overview": Plan(
                description="Test overview",
                steps=["READ README.md"],
            )
        },
        custom_roles=custom_roles,
    )


def test_custom_role_matches_pattern():
    """Custom role should be assigned when path matches pattern."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="migration", description="Database migrations", patterns=["migrations/*.sql"]),
        ]
    )
    r = assign_role("migrations/001_init.sql", profile)
    assert r.role == "migration"
    assert r.confidence == 0.80
    assert "custom role" in r.reason


def test_custom_role_confidence():
    """Custom role should use the specified confidence."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="proto", description="Protobuf definitions", patterns=["**/*.proto"], confidence=0.92),
        ]
    )
    result = assign_role("api/service.proto", profile)
    # Proto files match _SCHEMA_PATTERNS at priority 8, before custom roles at 14
    assert result.role == "schema"


def test_custom_role_no_match():
    """Custom role should not be assigned when path doesn't match."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="migration", description="Database migrations", patterns=["migrations/*.sql"]),
        ]
    )
    r = assign_role("src/utils.py", profile)
    assert r.role != "migration"


def test_custom_role_does_not_override_entrypoint():
    """Profile entrypoints (priority 1) should win over custom roles (priority 14)."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="special", description="Special files", patterns=["src/main.py"]),
        ]
    )
    r = assign_role("src/main.py", profile)
    assert r.role == "entrypoint"  # Entrypoint wins at priority 1


def test_custom_role_does_not_override_lockfile():
    """Lockfiles (priority 2) should win over custom roles."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="special", description="Special files", patterns=["package-lock.json"]),
        ]
    )
    r = assign_role("package-lock.json", profile)
    assert r.role == "lockfile"


def test_multiple_custom_roles_first_match_wins():
    """When multiple custom roles match, the first in the list wins."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="alpha", description="Alpha", patterns=["*.sql"]),
            CustomRole(name="beta", description="Beta", patterns=["*.sql"]),
        ]
    )
    r = assign_role("query.sql", profile)
    assert r.role == "alpha"


def test_custom_role_with_glob_star():
    """Custom roles should support ** glob patterns."""
    profile = _profile_with_custom_roles(
        [
            CustomRole(name="storybook", description="Storybook stories", patterns=["**/*.stories.tsx"]),
        ]
    )
    r = assign_role("src/components/Button.stories.tsx", profile)
    assert r.role == "storybook"


def test_empty_custom_roles():
    """Profile with no custom roles should work normally."""
    profile = _profile_with_custom_roles([])
    r = assign_role("README.md", profile)
    assert r.role == "doc"


def test_custom_role_description_in_index():
    """Custom roles should be advertised in the index output."""
    from zip_meta_map.builder import build_index
    from zip_meta_map.scanner import ScannedFile

    profile = _profile_with_custom_roles(
        [
            CustomRole(name="migration", description="Database migration files", patterns=["migrations/*.sql"]),
        ]
    )
    files = [
        ScannedFile(path="README.md", size_bytes=100, sha256="a" * 64),
        ScannedFile(path="migrations/001.sql", size_bytes=50, sha256="b" * 64),
    ]
    index = build_index(files, profile, "test_project")
    assert "custom_roles" in index
    assert index["custom_roles"]["migration"] == "Database migration files"
