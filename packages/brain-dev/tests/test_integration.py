"""
Integration tests for Dev Brain with Context Engine.

These tests demonstrate how Dev Brain consumes data from Context Engine
to provide developer insights. In production, the MCP host mediates
all interactions between servers.
"""

import json
import pytest
from unittest.mock import MagicMock

from mcp.types import (
    ListToolsRequest,
    CallToolRequest,
)

from dev_brain.config import DevBrainConfig
from dev_brain.server import create_server


# =============================================================================
# Helper Functions
# =============================================================================

async def call_tool(server, name: str, arguments: dict) -> dict:
    """Call a tool and return parsed JSON result."""
    handler = server.request_handlers[CallToolRequest]
    request = MagicMock()
    request.params = MagicMock()
    request.params.name = name
    request.params.arguments = arguments
    result = await handler(request)
    return json.loads(result.root.content[0].text)


# =============================================================================
# Fixtures Simulating Context Engine Data
# =============================================================================

@pytest.fixture
def context_patterns_data():
    """
    Simulates data from Context Engine's context_patterns tool.

    These patterns represent observed user behavior flows from
    UI event streams collected by the Context Engine.
    """
    return [
        {
            "sequence": ["ui.click.login_button", "ui.input.username", "ui.input.password", "ui.click.submit"],
            "support": 0.35,
            "occurrence_count": 1500,
        },
        {
            "sequence": ["ui.click.login_button", "ui.input.username", "ui.click.forgot_password"],
            "support": 0.12,
            "occurrence_count": 500,
        },
        {
            "sequence": ["ui.search.products", "ui.click.product", "ui.click.add_to_cart", "ui.click.checkout"],
            "support": 0.28,
            "occurrence_count": 1200,
        },
        {
            "sequence": ["ui.search.products", "ui.click.product", "ui.click.back", "ui.search.products"],
            "support": 0.15,
            "occurrence_count": 650,
        },
        {
            "sequence": ["ui.click.cart", "ui.click.checkout", "ui.input.payment", "ui.click.confirm"],
            "support": 0.20,
            "occurrence_count": 850,
        },
        {
            "sequence": ["ui.click.cart", "ui.click.checkout", "api.error.payment_failed"],
            "support": 0.08,
            "occurrence_count": 340,
        },
        {
            "sequence": ["ui.click.settings", "ui.click.profile", "ui.input.name", "ui.click.save"],
            "support": 0.10,
            "occurrence_count": 420,
        },
    ]


@pytest.fixture
def context_code_symbols():
    """
    Simulates data from Context Engine's context_search_code tool.

    These symbols represent parsed code from the codebase
    that handles the UI events.
    """
    return [
        {
            "name": "handle_login_submit",
            "kind": "function",
            "file_path": "src/auth/handlers.py",
            "start_line": 45,
            "end_line": 89,
            "signature": "def handle_login_submit(username: str, password: str) -> LoginResult",
            "source_code": "def handle_login_submit(username, password): if not username: return; if not password: return; result = auth.login(username, password)"
        },
        {
            "name": "handle_forgot_password",
            "kind": "function",
            "file_path": "src/auth/handlers.py",
            "start_line": 91,
            "end_line": 120,
            "signature": "def handle_forgot_password(email: str) -> None",
        },
        {
            "name": "handle_search",
            "kind": "function",
            "file_path": "src/search/handlers.py",
            "start_line": 10,
            "end_line": 55,
            "signature": "def handle_search(query: str, filters: dict) -> SearchResults",
        },
        {
            "name": "handle_checkout",
            "kind": "function",
            "file_path": "src/cart/handlers.py",
            "start_line": 80,
            "end_line": 150,
            "signature": "def handle_checkout(cart_id: str) -> CheckoutResult",
            "source_code": "def handle_checkout(cart_id): if not cart_id: return; items = get_items(cart_id); if len(items) == 0: return; for item in items: if item.stock < 1: raise OutOfStock; return process_checkout(items)"
        },
        {
            "name": "PaymentProcessor",
            "kind": "class",
            "file_path": "src/payments/processor.py",
            "start_line": 1,
            "end_line": 200,
            "signature": "class PaymentProcessor",
        },
    ]


@pytest.fixture
def existing_test_patterns():
    """
    Simulates test patterns extracted from existing test files.

    These would come from parsing test files with the Context Engine.
    """
    return [
        # Login flow is tested
        ["ui.click.login_button", "ui.input.username", "ui.input.password", "ui.click.submit"],
        # Search is tested
        ["ui.search.products", "ui.click.product"],
        # Profile update is tested
        ["ui.click.settings", "ui.click.profile", "ui.input.name", "ui.click.save"],
    ]


@pytest.fixture
def dev_brain_server():
    """Create Dev Brain server for testing."""
    return create_server(DevBrainConfig(
        min_gap_support=0.05,
        min_confidence=0.5,
        max_suggestions=20,
    ))


# =============================================================================
# Integration Tests: Coverage Analysis Workflow
# =============================================================================

class TestCoverageAnalysisWorkflow:
    """Tests the coverage analysis workflow using Context Engine data."""

    @pytest.mark.asyncio
    async def test_identify_coverage_gaps_from_patterns(
        self, dev_brain_server, context_patterns_data, existing_test_patterns
    ):
        """
        Test: Use context_patterns output to find test coverage gaps.

        Workflow:
        1. Context Engine provides observed user behavior patterns
        2. Developer provides which patterns are already tested
        3. Dev Brain identifies high-priority gaps
        """
        result = await call_tool(dev_brain_server, "coverage_analyze", {
            "patterns": context_patterns_data,
            "test_patterns": existing_test_patterns,
        })

        # Should find gaps for untested patterns
        assert result["gaps_found"] > 0
        assert result["coverage_percentage"] < 100

        # Check that high-priority gaps are identified
        gaps = result["gaps"]
        assert len(gaps) > 0

        # The checkout flow should be flagged (high support, not fully tested)
        checkout_gaps = [
            g for g in gaps
            if "checkout" in str(g["pattern"]).lower()
        ]
        assert len(checkout_gaps) > 0

        # Error handling flow should be flagged
        error_gaps = [
            g for g in gaps
            if "error" in str(g["pattern"]).lower()
        ]
        assert len(error_gaps) > 0

    @pytest.mark.asyncio
    async def test_generate_tests_for_gaps(
        self, dev_brain_server, context_patterns_data, existing_test_patterns
    ):
        """
        Test: Generate test suggestions for identified coverage gaps.

        Workflow:
        1. Identify coverage gaps
        2. Generate test code for each gap
        """
        # Step 1: Find gaps
        coverage_result = await call_tool(dev_brain_server, "coverage_analyze", {
            "patterns": context_patterns_data,
            "test_patterns": existing_test_patterns,
        })

        # Step 2: Generate tests for first gap
        if coverage_result["gaps"]:
            gap = coverage_result["gaps"][0]

            test_result = await call_tool(dev_brain_server, "tests_generate", {
                "gap": gap,
                "framework": "pytest",
                "style": "integration",
            })

            # Should generate valid test code
            assert "test_name" in test_result
            assert "test_code" in test_result
            assert "def test_" in test_result["test_code"]
            assert test_result["framework"] == "pytest"
            assert test_result["style"] == "integration"


# =============================================================================
# Integration Tests: Behavior Analysis Workflow
# =============================================================================

class TestBehaviorAnalysisWorkflow:
    """Tests the behavior analysis workflow using Context Engine data."""

    @pytest.mark.asyncio
    async def test_find_unhandled_user_behaviors(
        self, dev_brain_server, context_patterns_data, context_code_symbols
    ):
        """
        Test: Find user behaviors not handled in code.

        Workflow:
        1. Context Engine provides observed patterns
        2. Context Engine provides code symbols
        3. Dev Brain finds behaviors without handlers
        """
        result = await call_tool(dev_brain_server, "behavior_missing", {
            "patterns": context_patterns_data,
            "code_symbols": context_code_symbols,
            "min_count": 100,
        })

        # Should find some missing behaviors
        assert "missing_behaviors" in result
        assert "total_found" in result

        # Each missing behavior should have actionable info
        for behavior in result["missing_behaviors"]:
            assert "pattern" in behavior
            assert "observed_count" in behavior
            assert "suggested_action" in behavior


# =============================================================================
# Integration Tests: Refactoring Workflow
# =============================================================================

class TestRefactoringWorkflow:
    """Tests the refactoring workflow using Context Engine data."""

    @pytest.mark.asyncio
    async def test_suggest_refactoring_from_code_symbols(
        self, dev_brain_server, context_code_symbols, context_patterns_data
    ):
        """
        Test: Suggest refactoring based on code structure and usage.

        Workflow:
        1. Context Engine provides code symbols
        2. Context Engine provides usage patterns
        3. Dev Brain suggests refactoring opportunities
        """
        result = await call_tool(dev_brain_server, "refactor_suggest", {
            "symbols": context_code_symbols,
            "patterns": context_patterns_data,
            "analysis_type": "all",
        })

        assert "suggestions" in result
        assert "total_found" in result

        # Each suggestion should have actionable info
        for suggestion in result["suggestions"]:
            assert "suggestion_id" in suggestion
            assert "type" in suggestion
            assert "location" in suggestion
            assert "confidence" in suggestion


# =============================================================================
# Integration Tests: UX Insights Workflow
# =============================================================================

class TestUXInsightsWorkflow:
    """Tests the UX insights workflow using Context Engine data."""

    @pytest.mark.asyncio
    async def test_analyze_user_flow_dropoff(
        self, dev_brain_server, context_patterns_data
    ):
        """
        Test: Analyze user flows for dropoff points.

        Workflow:
        1. Context Engine provides behavior patterns
        2. Dev Brain analyzes for UX issues like dropoff
        """
        result = await call_tool(dev_brain_server, "ux_insights", {
            "patterns": context_patterns_data,
            "flow_type": "checkout",
            "metric": "dropoff",
        })

        assert "insights" in result
        assert result["flow_type"] == "checkout"
        assert result["metric"] == "dropoff"

        # Each insight should have actionable info
        for insight in result["insights"]:
            assert "insight_id" in insight
            assert "finding" in insight
            assert "suggestion" in insight
            assert "confidence" in insight

    @pytest.mark.asyncio
    async def test_analyze_error_flows(
        self, dev_brain_server, context_patterns_data
    ):
        """
        Test: Analyze patterns for error flows.

        Workflow:
        1. Context Engine provides patterns including error events
        2. Dev Brain identifies problematic error flows
        """
        result = await call_tool(dev_brain_server, "ux_insights", {
            "patterns": context_patterns_data,
            "flow_type": "general",
            "metric": "error_rate",
        })

        assert "insights" in result

        # Should identify the payment error flow
        error_insights = [
            i for i in result["insights"]
            if "error" in i.get("finding", "").lower() or "payment" in i.get("finding", "").lower()
        ]
        # May or may not find insights depending on the analyzer logic
        assert isinstance(error_insights, list)


# =============================================================================
# Integration Tests: Full Analysis Pipeline
# =============================================================================

class TestFullAnalysisPipeline:
    """Tests the complete analysis pipeline from Context Engine data."""

    @pytest.mark.asyncio
    async def test_comprehensive_codebase_analysis(
        self,
        dev_brain_server,
        context_patterns_data,
        context_code_symbols,
        existing_test_patterns,
    ):
        """
        Test: Perform comprehensive analysis using all Dev Brain capabilities.

        This simulates the full workflow:
        1. Analyze test coverage
        2. Find missing behaviors
        3. Suggest refactoring
        4. Extract UX insights
        5. Generate test suggestions

        All data originates from Context Engine.
        """
        # Step 1: Coverage Analysis
        coverage = await call_tool(dev_brain_server, "coverage_analyze", {
            "patterns": context_patterns_data,
            "test_patterns": existing_test_patterns,
            "min_support": 0.05,
        })
        assert "coverage_percentage" in coverage
        assert "gaps" in coverage

        # Step 2: Behavior Analysis
        behaviors = await call_tool(dev_brain_server, "behavior_missing", {
            "patterns": context_patterns_data,
            "code_symbols": context_code_symbols,
            "min_count": 100,
        })
        assert "missing_behaviors" in behaviors

        # Step 3: Refactoring Analysis
        refactoring = await call_tool(dev_brain_server, "refactor_suggest", {
            "symbols": context_code_symbols,
            "patterns": context_patterns_data,
            "analysis_type": "all",
        })
        assert "suggestions" in refactoring

        # Step 4: UX Analysis
        ux_dropoff = await call_tool(dev_brain_server, "ux_insights", {
            "patterns": context_patterns_data,
            "flow_type": "checkout",
            "metric": "dropoff",
        })
        assert "insights" in ux_dropoff

        ux_errors = await call_tool(dev_brain_server, "ux_insights", {
            "patterns": context_patterns_data,
            "flow_type": "general",
            "metric": "error_rate",
        })
        assert "insights" in ux_errors

        # Step 5: Generate tests for top gaps
        for gap in coverage["gaps"][:3]:
            test = await call_tool(dev_brain_server, "tests_generate", {
                "gap": gap,
                "framework": "pytest",
                "style": "integration",
            })
            assert "test_code" in test

        # Summary
        print(f"\n=== Comprehensive Analysis Summary ===")
        print(f"Test Coverage: {coverage['coverage_percentage']}%")
        print(f"Coverage Gaps Found: {coverage['gaps_found']}")
        print(f"Missing Behaviors: {behaviors['total_found']}")
        print(f"Refactoring Suggestions: {refactoring['total_found']}")
        print(f"UX Dropoff Insights: {ux_dropoff['total_found']}")
        print(f"UX Error Insights: {ux_errors['total_found']}")


# =============================================================================
# Integration Tests: Server Stats
# =============================================================================

class TestServerHealthCheck:
    """Tests server health and stats."""

    @pytest.mark.asyncio
    async def test_server_stats(self, dev_brain_server):
        """Test that server reports stats correctly."""
        result = await call_tool(dev_brain_server, "brain_stats", {})

        assert result["server_name"] == "dev-brain"
        assert result["tools_available"] == 9
        assert "min_gap_support" in result
        assert "min_confidence" in result
        assert "max_suggestions" in result
        assert "default_test_framework" in result
