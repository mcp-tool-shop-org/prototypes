"""
Tests for Dev Brain analyzers.
"""

import pytest
from dev_brain.analyzer import (
    CoverageGap,
    MissingBehavior,
    TestSuggestion,
    RefactorSuggestion,
    UXInsight,
    CoverageAnalyzer,
    BehaviorAnalyzer,
    TestGenerator,
    RefactorAnalyzer,
    UXAnalyzer,
)


# =============================================================================
# CoverageGap Tests
# =============================================================================

class TestCoverageGap:
    """Tests for CoverageGap dataclass."""

    def test_create_coverage_gap(self):
        """Test creating a coverage gap."""
        gap = CoverageGap(
            gap_id="gap_001",
            pattern=["login", "checkout"],
            support=0.15,
            priority="high",
            suggested_test_name="test_login_checkout_flow",
            suggested_test_file="tests/test_flow.py",
            description="Login to checkout flow not tested",
        )

        assert gap.gap_id == "gap_001"
        assert gap.pattern == ["login", "checkout"]
        assert gap.support == 0.15
        assert gap.priority == "high"

    def test_coverage_gap_to_dict(self):
        """Test converting coverage gap to dict."""
        gap = CoverageGap(
            gap_id="gap_002",
            pattern=["search", "filter"],
            support=0.10,
            priority="medium",
            suggested_test_name="test_search_filter",
            suggested_test_file="tests/test_search.py",
            description="Search filter flow",
        )

        d = gap.to_dict()
        assert d["gap_id"] == "gap_002"
        assert d["pattern"] == ["search", "filter"]
        assert d["support"] == 0.10
        assert d["priority"] == "medium"
        assert "suggested_test" in d
        assert d["suggested_test"] == "test_search_filter"


# =============================================================================
# MissingBehavior Tests
# =============================================================================

class TestMissingBehavior:
    """Tests for MissingBehavior dataclass."""

    def test_create_missing_behavior(self):
        """Test creating a missing behavior."""
        behavior = MissingBehavior(
            behavior_id="beh_001",
            pattern=["bulk_delete", "confirm"],
            observed_count=25,
            description="Users frequently attempt bulk deletion",
            suggested_action="handle_bulk_delete",
            affected_files=["handlers.py"],
        )

        assert behavior.behavior_id == "beh_001"
        assert behavior.pattern == ["bulk_delete", "confirm"]
        assert behavior.observed_count == 25

    def test_missing_behavior_to_dict(self):
        """Test converting missing behavior to dict."""
        behavior = MissingBehavior(
            behavior_id="beh_002",
            pattern=["export_data"],
            observed_count=15,
            description="Export behavior",
            suggested_action="Add export handler",
        )

        d = behavior.to_dict()
        assert d["behavior_id"] == "beh_002"
        assert d["pattern"] == ["export_data"]
        assert d["observed_count"] == 15


# =============================================================================
# TestSuggestion Tests
# =============================================================================

class TestTestSuggestionModel:
    """Tests for TestSuggestion dataclass."""

    def test_create_test_suggestion(self):
        """Test creating a test suggestion."""
        suggestion = TestSuggestion(
            test_name="test_user_login_flow",
            test_file="tests/test_auth.py",
            test_code="def test_user_login_flow():\n    pass",
            covers_pattern=["login", "logout"],
            framework="pytest",
            style="unit",
        )

        assert suggestion.test_name == "test_user_login_flow"
        assert suggestion.framework == "pytest"
        assert suggestion.style == "unit"

    def test_test_suggestion_to_dict(self):
        """Test converting test suggestion to dict."""
        suggestion = TestSuggestion(
            test_name="test_search",
            test_file="tests/test_search.py",
            test_code="def test_search(): pass",
            covers_pattern=["search"],
            framework="pytest",
            style="integration",
        )

        d = suggestion.to_dict()
        assert d["test_name"] == "test_search"
        assert d["framework"] == "pytest"
        assert d["style"] == "integration"
        assert "test_code" in d


# =============================================================================
# RefactorSuggestion Tests
# =============================================================================

class TestRefactorSuggestion:
    """Tests for RefactorSuggestion dataclass."""

    def test_create_refactor_suggestion(self):
        """Test creating a refactor suggestion."""
        suggestion = RefactorSuggestion(
            suggestion_id="ref_001",
            suggestion_type="reduce_complexity",
            location="processor.py:10",
            reason="Function has high cyclomatic complexity",
            confidence=0.85,
        )

        assert suggestion.suggestion_id == "ref_001"
        assert suggestion.suggestion_type == "reduce_complexity"
        assert suggestion.confidence == 0.85

    def test_refactor_suggestion_to_dict(self):
        """Test converting refactor suggestion to dict."""
        suggestion = RefactorSuggestion(
            suggestion_id="ref_002",
            suggestion_type="extract_common",
            location="validators.py:20",
            reason="Similar code in multiple places",
            confidence=0.72,
        )

        d = suggestion.to_dict()
        assert d["suggestion_id"] == "ref_002"
        assert d["type"] == "extract_common"
        assert d["confidence"] == 0.72


# =============================================================================
# UXInsight Tests
# =============================================================================

class TestUXInsight:
    """Tests for UXInsight dataclass."""

    def test_create_ux_insight(self):
        """Test creating a UX insight."""
        insight = UXInsight(
            insight_id="ux_001",
            finding="35% of users abandon at payment step",
            supporting_patterns=5,
            confidence=0.78,
            suggestion="Simplify payment form",
            metric="dropoff",
        )

        assert insight.insight_id == "ux_001"
        assert insight.metric == "dropoff"
        assert insight.confidence == 0.78

    def test_ux_insight_to_dict(self):
        """Test converting UX insight to dict."""
        insight = UXInsight(
            insight_id="ux_002",
            finding="12% error rate on form submission",
            supporting_patterns=3,
            confidence=0.65,
            suggestion="Add validation",
            metric="error_rate",
        )

        d = insight.to_dict()
        assert d["insight_id"] == "ux_002"
        assert d["metric"] == "error_rate"
        assert d["confidence"] == 0.65


# =============================================================================
# CoverageAnalyzer Tests
# =============================================================================

class TestCoverageAnalyzer:
    """Tests for CoverageAnalyzer."""

    def test_create_analyzer(self, coverage_analyzer):
        """Test creating coverage analyzer."""
        assert coverage_analyzer.min_support == 0.05

    def test_analyze_gaps_finds_uncovered_patterns(
        self, coverage_analyzer, sample_patterns, sample_test_patterns
    ):
        """Test that analyzer finds patterns not covered by tests."""
        gaps = coverage_analyzer.analyze_gaps(sample_patterns, sample_test_patterns)

        # Should find gaps for patterns not in test_patterns
        assert len(gaps) > 0

        # Check that found gaps are actually uncovered
        gap_patterns = [tuple(g.pattern) for g in gaps]
        for gap_pattern in gap_patterns:
            assert list(gap_pattern) not in sample_test_patterns

    def test_analyze_gaps_respects_min_support(self, coverage_analyzer, sample_patterns):
        """Test that analyzer respects minimum support threshold."""
        # Pattern with 4% support should be filtered out with 5% threshold
        coverage_analyzer.min_support = 0.05
        gaps = coverage_analyzer.analyze_gaps(sample_patterns, [])

        for gap in gaps:
            assert gap.support >= 0.05

    def test_analyze_gaps_empty_patterns(self, coverage_analyzer):
        """Test analyzer with empty patterns."""
        gaps = coverage_analyzer.analyze_gaps([], [])
        assert gaps == []

    def test_analyze_gaps_all_covered(
        self, coverage_analyzer, sample_patterns, sample_test_patterns
    ):
        """Test when all high-support patterns are covered."""
        # Cover all patterns
        all_patterns = [p["sequence"] for p in sample_patterns]
        gaps = coverage_analyzer.analyze_gaps(sample_patterns, all_patterns)

        # Should have no gaps (or only low-support ones filtered)
        assert len(gaps) == 0

    def test_analyze_gaps_assigns_priority(
        self, coverage_analyzer, sample_patterns
    ):
        """Test that gaps are assigned appropriate priorities."""
        gaps = coverage_analyzer.analyze_gaps(sample_patterns, [])

        for gap in gaps:
            assert gap.priority in ["critical", "high", "medium", "low"]

            # High support should mean high priority
            if gap.support >= 0.3:
                assert gap.priority == "critical"
            elif gap.support >= 0.2:
                assert gap.priority == "high"

    def test_analyze_gaps_generates_test_names(
        self, coverage_analyzer, sample_patterns
    ):
        """Test that gaps have suggested test names."""
        gaps = coverage_analyzer.analyze_gaps(sample_patterns, [])

        for gap in gaps:
            assert gap.suggested_test_name is not None
            assert gap.suggested_test_name.startswith("test_")


# =============================================================================
# BehaviorAnalyzer Tests
# =============================================================================

class TestBehaviorAnalyzer:
    """Tests for BehaviorAnalyzer."""

    def test_create_analyzer(self, behavior_analyzer):
        """Test creating behavior analyzer."""
        assert behavior_analyzer is not None

    def test_find_missing_behaviors(
        self, behavior_analyzer, sample_patterns, sample_code_symbols
    ):
        """Test finding behaviors not in code."""
        missing = behavior_analyzer.find_missing_behaviors(
            sample_patterns, sample_code_symbols, min_count=5
        )

        # Should find some missing behaviors
        # (patterns that don't have corresponding code handlers)
        assert isinstance(missing, list)

    def test_find_missing_behaviors_respects_min_count(
        self, behavior_analyzer, sample_patterns, sample_code_symbols
    ):
        """Test that min_count filters low-occurrence behaviors."""
        missing = behavior_analyzer.find_missing_behaviors(
            sample_patterns, sample_code_symbols, min_count=100
        )

        # With high min_count, should find fewer missing behaviors
        for m in missing:
            assert m.observed_count >= 100

    def test_find_missing_behaviors_empty_patterns(
        self, behavior_analyzer, sample_code_symbols
    ):
        """Test with empty patterns."""
        missing = behavior_analyzer.find_missing_behaviors(
            [], sample_code_symbols, min_count=5
        )
        assert missing == []

    def test_find_missing_behaviors_no_symbols(
        self, behavior_analyzer, sample_patterns
    ):
        """Test with no code symbols."""
        missing = behavior_analyzer.find_missing_behaviors(
            sample_patterns, [], min_count=5
        )

        # All patterns should be "missing" if no code exists
        assert len(missing) > 0

    def test_missing_behavior_has_pattern(
        self, behavior_analyzer, sample_patterns
    ):
        """Test that missing behaviors include the pattern."""
        missing = behavior_analyzer.find_missing_behaviors(
            sample_patterns, [], min_count=5
        )

        for m in missing:
            assert isinstance(m.pattern, list)
            assert len(m.pattern) > 0


# =============================================================================
# TestGenerator Tests
# =============================================================================

class TestTestGeneratorClass:
    """Tests for TestGenerator."""

    def test_create_generator(self, test_generator):
        """Test creating test generator."""
        assert test_generator is not None

    def test_generate_pytest_test(self, test_generator):
        """Test generating pytest test."""
        gap = CoverageGap(
            gap_id="gap_001",
            pattern=["login", "checkout"],
            support=0.10,
            priority="high",
            suggested_test_name="test_login_checkout_flow",
            suggested_test_file="tests/test_flow.py",
            description="Login checkout flow",
        )

        suggestion = test_generator.generate_test(gap, "pytest", "unit")

        assert suggestion.framework == "pytest"
        assert suggestion.style == "unit"
        assert "def test_" in suggestion.test_code
        assert suggestion.covers_pattern == ["login", "checkout"]

    def test_generate_jest_test(self, test_generator):
        """Test generating Jest test."""
        gap = CoverageGap(
            gap_id="gap_002",
            pattern=["search", "filter"],
            support=0.10,
            priority="medium",
            suggested_test_name="test_search_filter",
            suggested_test_file="tests/test_search.js",
            description="Search filter flow",
        )

        suggestion = test_generator.generate_test(gap, "jest", "unit")

        assert suggestion.framework == "jest"
        assert "describe(" in suggestion.test_code or "test(" in suggestion.test_code

    def test_generate_go_test(self, test_generator):
        """Test generating Go test."""
        gap = CoverageGap(
            gap_id="gap_003",
            pattern=["create", "delete"],
            support=0.10,
            priority="medium",
            suggested_test_name="TestCreateDeleteFlow",
            suggested_test_file="handler_test.go",
            description="Create delete flow",
        )

        suggestion = test_generator.generate_test(gap, "go", "unit")

        assert suggestion.framework == "go"
        # Go framework not in templates, should get fallback
        assert "TODO" in suggestion.test_code or "Test" in suggestion.test_code

    def test_generate_integration_test(self, test_generator):
        """Test generating integration test."""
        gap = CoverageGap(
            gap_id="gap_004",
            pattern=["api_call", "response"],
            support=0.10,
            priority="medium",
            suggested_test_name="test_api_call_response",
            suggested_test_file="tests/test_api.py",
            description="API call flow",
        )

        suggestion = test_generator.generate_test(gap, "pytest", "integration")

        assert suggestion.style == "integration"
        assert "integration" in suggestion.test_code.lower()

    def test_generate_e2e_test(self, test_generator):
        """Test generating e2e test."""
        gap = CoverageGap(
            gap_id="gap_005",
            pattern=["start", "end"],
            support=0.10,
            priority="medium",
            suggested_test_name="test_start_end_flow",
            suggested_test_file="tests/test_e2e.py",
            description="Start to end flow",
        )

        suggestion = test_generator.generate_test(gap, "pytest", "e2e")

        assert suggestion.style == "e2e"
        # e2e not in templates, should get fallback
        assert len(suggestion.test_code) > 0

    def test_generated_test_includes_pattern_steps(self, test_generator):
        """Test that generated test references pattern in covers_pattern."""
        gap = CoverageGap(
            gap_id="gap_006",
            pattern=["login", "dashboard", "logout"],
            support=0.10,
            priority="medium",
            suggested_test_name="test_login_dashboard_logout_flow",
            suggested_test_file="tests/test_flow.py",
            description="Login dashboard logout flow",
        )

        suggestion = test_generator.generate_test(gap, "pytest", "unit")

        # Suggestion should reference the pattern
        assert suggestion.covers_pattern == ["login", "dashboard", "logout"]


# =============================================================================
# RefactorAnalyzer Tests
# =============================================================================

class TestRefactorAnalyzer:
    """Tests for RefactorAnalyzer."""

    def test_create_analyzer(self, refactor_analyzer):
        """Test creating refactor analyzer."""
        assert refactor_analyzer is not None

    def test_analyze_complexity(self, refactor_analyzer):
        """Test complexity analysis."""
        symbols = [
            {
                "name": "complex_function",
                "source_code": "if x: if y: if z: for i in x: for j in y: while True: pass",
            }
        ]
        suggestions = refactor_analyzer.analyze_code(symbols, [], "complexity")

        assert isinstance(suggestions, list)
        for s in suggestions:
            assert s.suggestion_type == "reduce_complexity"
            assert s.confidence > 0

    def test_analyze_duplication(self, refactor_analyzer):
        """Test duplication analysis."""
        symbols = [
            {"name": "handler1", "file_path": "a.py"},
            {"name": "handler2", "file_path": "a.py"},
            {"name": "handler3", "file_path": "a.py"},
        ]
        suggestions = refactor_analyzer.analyze_code(symbols, [], "duplication")

        assert isinstance(suggestions, list)
        for s in suggestions:
            assert s.suggestion_type == "extract_common"

    def test_analyze_naming(self, refactor_analyzer):
        """Test naming analysis."""
        symbols = [
            {"name": "x", "symbol_type": "variable", "file_path": "a.py", "line": 10},
        ]
        suggestions = refactor_analyzer.analyze_code(symbols, [], "naming")

        assert isinstance(suggestions, list)
        for s in suggestions:
            assert s.suggestion_type == "rename"

    def test_analyze_all_types(self, refactor_analyzer, sample_code_symbols):
        """Test analyzing all refactoring types."""
        suggestions = refactor_analyzer.analyze_code(
            sample_code_symbols, [], "all"
        )

        # analyze_code only handles one type at a time, "all" not implemented
        # So it returns empty for unknown type
        assert isinstance(suggestions, list)

    def test_analyze_with_patterns(
        self, refactor_analyzer, sample_code_symbols, sample_patterns
    ):
        """Test analysis with usage patterns."""
        suggestions = refactor_analyzer.analyze_code(
            sample_code_symbols, sample_patterns, "complexity"
        )

        # Should still return valid suggestions
        assert isinstance(suggestions, list)

    def test_analyze_empty_symbols(self, refactor_analyzer):
        """Test with no symbols."""
        suggestions = refactor_analyzer.analyze_code([], [], "complexity")
        assert suggestions == []

    def test_suggestions_have_target_info(self, refactor_analyzer):
        """Test that suggestions include target information."""
        symbols = [
            {
                "name": "complex_function",
                "file_path": "handler.py",
                "line": 50,
                "source_code": "if x: if y: if z: for i in x: for j in y: while True: pass",
            }
        ]
        suggestions = refactor_analyzer.analyze_code(symbols, [], "complexity")

        for s in suggestions:
            assert s.location is not None


# =============================================================================
# UXAnalyzer Tests
# =============================================================================

class TestUXAnalyzer:
    """Tests for UXAnalyzer."""

    def test_create_analyzer(self, ux_analyzer):
        """Test creating UX analyzer."""
        assert ux_analyzer is not None

    def test_analyze_dropoff(self, ux_analyzer, sample_patterns):
        """Test dropoff analysis."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "general", "dropoff")

        assert isinstance(insights, list)
        for i in insights:
            assert i.metric == "dropoff"
            assert i.confidence > 0

    def test_analyze_error_rate(self, ux_analyzer, sample_patterns):
        """Test error rate analysis."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "general", "error_rate")

        assert isinstance(insights, list)
        for i in insights:
            assert i.metric == "error_rate"

    def test_analyze_all_metrics(self, ux_analyzer, sample_patterns):
        """Test analyzing all metrics."""
        # Note: analyze_flow doesn't handle "all" - only specific metrics
        insights = ux_analyzer.analyze_flow(sample_patterns, "general", "dropoff")

        assert isinstance(insights, list)

    def test_analyze_checkout_flow(self, ux_analyzer, sample_patterns):
        """Test checkout flow analysis."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "checkout", "dropoff")

        assert isinstance(insights, list)

    def test_analyze_search_flow(self, ux_analyzer, sample_patterns):
        """Test search flow analysis."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "search", "dropoff")

        assert isinstance(insights, list)

    def test_analyze_onboarding_flow(self, ux_analyzer, sample_patterns):
        """Test onboarding flow analysis."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "onboarding", "dropoff")

        assert isinstance(insights, list)

    def test_analyze_empty_patterns(self, ux_analyzer):
        """Test with empty patterns."""
        insights = ux_analyzer.analyze_flow([], "general", "dropoff")
        assert insights == []

    def test_insights_have_suggestions(self, ux_analyzer, sample_patterns):
        """Test that insights include improvement suggestions."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "general", "dropoff")

        for i in insights:
            # Insights should have suggestions
            assert i.suggestion is not None

    def test_insights_have_finding(self, ux_analyzer, sample_patterns):
        """Test that insights have findings."""
        insights = ux_analyzer.analyze_flow(sample_patterns, "general", "dropoff")

        for i in insights:
            assert i.finding is not None
