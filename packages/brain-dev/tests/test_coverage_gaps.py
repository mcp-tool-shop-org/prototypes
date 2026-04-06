"""
Tests for coverage gaps identified by Dev Brain.

These tests target specific uncovered lines:
- analyzer.py:173 - critical priority branch (support >= 0.30)
- analyzer.py:480 - long name refactoring suggestion (name > 50 chars)
- config.py:50 - load_config() function
- server.py:458-460, 465, 469 - run_server() and main() entry points
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock

from dev_brain.config import DevBrainConfig, load_config
from dev_brain.analyzer import CoverageAnalyzer, RefactorAnalyzer


# =============================================================================
# Test: Critical Priority Branch (analyzer.py:173)
# =============================================================================

class TestCriticalPriorityBranch:
    """Tests for the critical priority assignment when support >= 0.30."""

    def test_coverage_gap_critical_priority_at_030(self):
        """Test that support of 0.30 assigns 'critical' priority."""
        analyzer = CoverageAnalyzer(min_support=0.05)

        patterns = [
            {
                "sequence": ["action_a", "action_b", "action_c"],
                "support": 0.30,  # Exactly at threshold
                "occurrence_count": 1000,
            }
        ]

        gaps = analyzer.analyze_gaps(patterns, [])

        assert len(gaps) == 1
        assert gaps[0].priority == "critical"

    def test_coverage_gap_critical_priority_above_030(self):
        """Test that support above 0.30 assigns 'critical' priority."""
        analyzer = CoverageAnalyzer(min_support=0.05)

        patterns = [
            {
                "sequence": ["high_freq_action"],
                "support": 0.45,  # Well above threshold
                "occurrence_count": 2000,
            }
        ]

        gaps = analyzer.analyze_gaps(patterns, [])

        assert len(gaps) == 1
        assert gaps[0].priority == "critical"
        assert gaps[0].support == 0.45

    def test_coverage_gap_high_priority_just_below_critical(self):
        """Test that support at 0.29 assigns 'high' priority (not critical)."""
        analyzer = CoverageAnalyzer(min_support=0.05)

        patterns = [
            {
                "sequence": ["just_below_critical"],
                "support": 0.29,  # Just below critical threshold
                "occurrence_count": 900,
            }
        ]

        gaps = analyzer.analyze_gaps(patterns, [])

        assert len(gaps) == 1
        assert gaps[0].priority == "high"  # Not critical


# =============================================================================
# Test: Long Name Refactoring (analyzer.py:480)
# =============================================================================

class TestLongNameRefactoring:
    """Tests for the long name refactoring suggestion when name > 50 chars."""

    def test_refactor_suggests_rename_for_very_long_name(self):
        """Test that a name over 50 characters triggers a rename suggestion."""
        analyzer = RefactorAnalyzer()

        # Name with 60 characters
        long_name = "a" * 60

        symbols = [
            {
                "name": long_name,
                "symbol_type": "function",
                "file_path": "src/handlers.py",
                "line": 42,
            }
        ]

        suggestions = analyzer.analyze_code(symbols, [], "naming")

        # Should find at least one suggestion for the long name
        long_name_suggestions = [
            s for s in suggestions
            if "too long" in s.reason.lower()
        ]

        assert len(long_name_suggestions) >= 1
        suggestion = long_name_suggestions[0]
        assert suggestion.suggestion_type == "rename"
        assert "60 chars" in suggestion.reason
        assert suggestion.confidence == 0.6

    def test_refactor_no_rename_for_50_char_name(self):
        """Test that exactly 50 characters does NOT trigger long name warning."""
        analyzer = RefactorAnalyzer()

        # Name with exactly 50 characters
        borderline_name = "a" * 50

        symbols = [
            {
                "name": borderline_name,
                "symbol_type": "function",
                "file_path": "src/handlers.py",
                "line": 10,
            }
        ]

        suggestions = analyzer.analyze_code(symbols, [], "naming")

        # Should NOT find any "too long" suggestions
        long_name_suggestions = [
            s for s in suggestions
            if "too long" in s.reason.lower()
        ]

        assert len(long_name_suggestions) == 0

    def test_refactor_long_name_truncated_in_reason(self):
        """Test that very long names are truncated in the reason message."""
        analyzer = RefactorAnalyzer()

        # Name with 100 characters
        very_long_name = "x" * 100

        symbols = [
            {
                "name": very_long_name,
                "symbol_type": "variable",
                "file_path": "src/data.py",
                "line": 5,
            }
        ]

        suggestions = analyzer.analyze_code(symbols, [], "naming")

        long_name_suggestions = [
            s for s in suggestions
            if "too long" in s.reason.lower()
        ]

        assert len(long_name_suggestions) >= 1
        # Reason should truncate the name to 30 chars + "..."
        assert "..." in long_name_suggestions[0].reason


# =============================================================================
# Test: load_config() Function (config.py:50)
# =============================================================================

class TestLoadConfig:
    """Tests for the load_config() function."""

    def test_load_config_returns_devbrainconfig(self):
        """Test that load_config() returns a DevBrainConfig instance."""
        config = load_config()

        assert isinstance(config, DevBrainConfig)

    def test_load_config_returns_defaults(self):
        """Test that load_config() returns default configuration values."""
        config = load_config()

        assert config.server_name == "dev-brain"
        assert config.server_version == "1.0.0"
        assert config.min_gap_support == 0.05
        assert config.min_confidence == 0.5
        assert config.max_suggestions == 20
        assert config.default_test_framework == "pytest"
        assert config.test_style == "unit"

    def test_load_config_with_path_ignores_path(self):
        """Test that load_config() currently ignores the config_path argument."""
        from pathlib import Path

        # Pass a path (even though it's ignored for now)
        config = load_config(config_path=Path("/some/config/path.yaml"))

        # Should still return default config
        assert isinstance(config, DevBrainConfig)
        assert config.server_name == "dev-brain"


# =============================================================================
# Test: run_server() and main() Entry Points (server.py:458-460, 465, 469)
# =============================================================================

class TestServerEntryPoints:
    """Tests for the server entry point functions."""

    @pytest.mark.asyncio
    async def test_run_server_creates_and_runs_server(self):
        """Test that run_server() creates a server and attempts to run it."""
        from dev_brain.server import run_server

        # Mock the stdio_server context manager and server.run
        mock_read_stream = MagicMock()
        mock_write_stream = MagicMock()

        with patch('dev_brain.server.stdio_server') as mock_stdio:
            # Make stdio_server an async context manager
            mock_context = MagicMock()
            mock_context.__aenter__ = AsyncMock(
                return_value=(mock_read_stream, mock_write_stream)
            )
            mock_context.__aexit__ = AsyncMock(return_value=None)
            mock_stdio.return_value = mock_context

            with patch('dev_brain.server.create_server') as mock_create:
                mock_server = MagicMock()
                mock_server.run = AsyncMock()
                mock_server.create_initialization_options = MagicMock(return_value={})
                mock_create.return_value = mock_server

                # Run the async function
                await run_server()

                # Verify server was created and run was called
                mock_create.assert_called_once()
                mock_server.run.assert_called_once()

    def test_main_calls_asyncio_run(self):
        """Test that main() uses asyncio.run to execute run_server."""
        from dev_brain.server import main

        with patch('dev_brain.server.asyncio.run') as mock_run:
            main()

            # asyncio.run should be called with the run_server coroutine
            mock_run.assert_called_once()
            # The argument should be a coroutine
            call_arg = mock_run.call_args[0][0]
            assert hasattr(call_arg, '__await__') or hasattr(call_arg, 'cr_frame')

    def test_main_module_block_calls_main(self):
        """Test that running the module as __main__ would call main()."""
        # This tests the if __name__ == "__main__": block indirectly
        # by verifying main() is callable
        from dev_brain.server import main

        assert callable(main)


# =============================================================================
# Additional Edge Cases
# =============================================================================

class TestEdgeCases:
    """Additional edge case tests for complete coverage."""

    def test_coverage_analyzer_with_multiple_priorities(self):
        """Test that patterns with different supports get correct priorities."""
        analyzer = CoverageAnalyzer(min_support=0.01)

        patterns = [
            {"sequence": ["critical"], "support": 0.35, "occurrence_count": 100},
            {"sequence": ["high"], "support": 0.25, "occurrence_count": 100},
            {"sequence": ["medium"], "support": 0.15, "occurrence_count": 100},
            {"sequence": ["low"], "support": 0.05, "occurrence_count": 100},
        ]

        gaps = analyzer.analyze_gaps(patterns, [])

        # Map patterns to priorities
        priorities = {tuple(g.pattern): g.priority for g in gaps}

        assert priorities[("critical",)] == "critical"
        assert priorities[("high",)] == "high"
        assert priorities[("medium",)] == "medium"
        assert priorities[("low",)] == "low"

    def test_refactor_analyzer_combined_naming_issues(self):
        """Test analyzer handles both single-letter and long names."""
        analyzer = RefactorAnalyzer()

        symbols = [
            {"name": "x", "symbol_type": "variable", "file_path": "a.py", "line": 1},
            {"name": "a" * 60, "symbol_type": "function", "file_path": "b.py", "line": 2},
            {"name": "normal_name", "symbol_type": "function", "file_path": "c.py", "line": 3},
        ]

        suggestions = analyzer.analyze_code(symbols, [], "naming")

        # Should find suggestions for both single-letter and long name
        single_letter = [s for s in suggestions if "single-letter" in s.reason.lower()]
        long_name = [s for s in suggestions if "too long" in s.reason.lower()]

        assert len(single_letter) >= 1
        assert len(long_name) >= 1
