"""Tests for SQL safety in SessionRegistry.

Goal: Ensure sort_by, sort_order, and search inputs cannot cause SQL injection.
"""

from __future__ import annotations

import pytest

from context_window_manager.core.session_registry import (
    SessionRegistry,
    Window,
    escape_like_pattern,
    validate_sort_column,
    validate_sort_order,
)


class TestEscapeLikePattern:
    """Tests for LIKE pattern escaping."""

    def test_escapes_percent(self):
        """Percent signs should be escaped."""
        assert escape_like_pattern("100%") == "100\\%"

    def test_escapes_underscore(self):
        """Underscores should be escaped."""
        assert escape_like_pattern("my_file") == "my\\_file"

    def test_escapes_backslash(self):
        """Backslashes should be escaped first."""
        assert escape_like_pattern("a\\b") == "a\\\\b"

    def test_escapes_combined(self):
        """Multiple special chars should all be escaped."""
        assert escape_like_pattern("50% off_sale\\deal") == "50\\% off\\_sale\\\\deal"

    def test_preserves_normal_text(self):
        """Normal text should pass through unchanged."""
        assert escape_like_pattern("hello world") == "hello world"

    def test_empty_string(self):
        """Empty string should return empty."""
        assert escape_like_pattern("") == ""


class TestValidateSortColumn:
    """Tests for sort column validation."""

    def test_allows_valid_column(self):
        """Valid columns should pass through."""
        allowed = frozenset({"name", "created_at"})
        assert validate_sort_column("name", allowed) == "name"
        assert validate_sort_column("created_at", allowed) == "created_at"

    def test_rejects_invalid_column(self):
        """Invalid columns should return default."""
        allowed = frozenset({"name", "created_at"})
        assert validate_sort_column("invalid", allowed, "created_at") == "created_at"

    def test_rejects_sql_injection_attempt(self):
        """SQL injection attempts should return default."""
        allowed = frozenset({"name", "created_at"})
        # Attempt to inject SQL
        assert validate_sort_column("name; DROP TABLE windows;--", allowed) == "created_at"
        assert validate_sort_column("1=1 OR", allowed) == "created_at"
        assert validate_sort_column("name DESC, (SELECT", allowed) == "created_at"

    def test_rejects_case_variations(self):
        """Column names must match exactly (case-sensitive)."""
        allowed = frozenset({"name", "created_at"})
        assert validate_sort_column("NAME", allowed) == "created_at"
        assert validate_sort_column("Name", allowed) == "created_at"


class TestValidateSortOrder:
    """Tests for sort order validation."""

    def test_allows_asc(self):
        """ASC should be allowed (case-insensitive)."""
        assert validate_sort_order("asc") == "ASC"
        assert validate_sort_order("ASC") == "ASC"
        assert validate_sort_order("Asc") == "ASC"

    def test_allows_desc(self):
        """DESC should be allowed (case-insensitive)."""
        assert validate_sort_order("desc") == "DESC"
        assert validate_sort_order("DESC") == "DESC"
        assert validate_sort_order("Desc") == "DESC"

    def test_rejects_invalid(self):
        """Invalid orders should return DESC."""
        assert validate_sort_order("invalid") == "DESC"
        assert validate_sort_order("") == "DESC"

    def test_rejects_sql_injection_attempt(self):
        """SQL injection attempts should return DESC."""
        assert validate_sort_order("ASC; DROP TABLE windows;--") == "DESC"
        assert validate_sort_order("DESC, (SELECT password FROM users)") == "DESC"

    def test_strips_whitespace(self):
        """Whitespace should be stripped."""
        assert validate_sort_order("  asc  ") == "ASC"
        assert validate_sort_order("\tdesc\n") == "DESC"


class TestListWindowsSQLSafety:
    """Integration tests for SQL safety in list_windows."""

    @pytest.fixture
    async def registry(self, tmp_path):
        """Create a registry with test data."""
        registry = SessionRegistry(tmp_path / "registry.db")
        await registry.initialize()

        # Create a test session first
        await registry.create_session(
            session_id="test-session",
            model="test-model",
        )

        # Create test windows
        test_windows = [
            Window(
                name="alpha-window",
                session_id="test-session",
                description="First test window",
                tags=["tag1"],
                model="test-model",
            ),
            Window(
                name="beta-window",
                session_id="test-session",
                description="Second test window with 50% discount",
                tags=["tag2"],
                model="test-model",
            ),
            Window(
                name="gamma-window",
                session_id="test-session",
                description="Third test_window",
                tags=["tag_special"],
                model="test-model",
            ),
        ]
        for w in test_windows:
            await registry.create_window(w)

        return registry

    @pytest.mark.asyncio
    async def test_malicious_sort_by_falls_back_safely(self, registry):
        """Malicious sort_by should fall back to default, not crash."""
        # These should not cause SQL errors or data leakage
        windows, total = await registry.list_windows(sort_by="name; DROP TABLE windows;--")
        assert total == 3  # All windows returned
        assert len(windows) == 3

    @pytest.mark.asyncio
    async def test_malicious_sort_order_falls_back_safely(self, registry):
        """Malicious sort_order should fall back to DESC."""
        windows, total = await registry.list_windows(
            sort_by="name",
            sort_order="ASC; DROP TABLE windows;--"
        )
        assert total == 3
        assert len(windows) == 3

    @pytest.mark.asyncio
    async def test_search_with_sql_characters_returns_correct_results(self, registry):
        """Search containing SQL characters should match literally."""
        # Search for "50%" - should find beta-window
        windows, total = await registry.list_windows(search="50%")
        assert total == 1
        assert windows[0].name == "beta-window"

    @pytest.mark.asyncio
    async def test_search_with_underscore_matches_literally(self, registry):
        """Underscore in search should match literally, not as wildcard."""
        # Search for "test_window" - should only match gamma
        windows, total = await registry.list_windows(search="test_window")
        assert total == 1
        assert windows[0].name == "gamma-window"

    @pytest.mark.asyncio
    async def test_tag_with_special_chars_matches_literally(self, registry):
        """Tags with special characters should match literally."""
        windows, total = await registry.list_windows(tags=["tag_special"])
        assert total == 1
        assert windows[0].name == "gamma-window"

    @pytest.mark.asyncio
    async def test_sort_is_deterministic(self, registry):
        """Sorting should be deterministic across multiple calls."""
        # Get results twice
        windows1, _ = await registry.list_windows(sort_by="created_at", sort_order="desc")
        windows2, _ = await registry.list_windows(sort_by="created_at", sort_order="desc")

        # Order should be identical
        names1 = [w.name for w in windows1]
        names2 = [w.name for w in windows2]
        assert names1 == names2

    @pytest.mark.asyncio
    async def test_search_with_sql_injection_attempt(self, registry):
        """SQL injection in search should not execute."""
        # This should not cause an error or drop tables
        windows, total = await registry.list_windows(
            search="'; DROP TABLE windows; --"
        )
        # Should return 0 results (no match), not crash
        assert total == 0
        assert len(windows) == 0

        # Verify tables still exist by fetching all
        all_windows, all_total = await registry.list_windows()
        assert all_total == 3
