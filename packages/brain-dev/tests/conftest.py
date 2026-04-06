"""
Pytest configuration and fixtures for Dev Brain tests.
"""

import pytest
from dev_brain.config import DevBrainConfig
from dev_brain.server import create_server
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


@pytest.fixture
def config():
    """Create test configuration."""
    return DevBrainConfig(
        min_gap_support=0.05,
        min_confidence=0.5,
        max_suggestions=10,
    )


@pytest.fixture
def server(config):
    """Create test server."""
    return create_server(config)


@pytest.fixture
def coverage_analyzer():
    """Create coverage analyzer."""
    return CoverageAnalyzer(min_support=0.05)


@pytest.fixture
def behavior_analyzer():
    """Create behavior analyzer."""
    return BehaviorAnalyzer()


@pytest.fixture
def test_generator():
    """Create test generator."""
    return TestGenerator()


@pytest.fixture
def refactor_analyzer():
    """Create refactor analyzer."""
    return RefactorAnalyzer()


@pytest.fixture
def ux_analyzer():
    """Create UX analyzer."""
    return UXAnalyzer()


@pytest.fixture
def sample_patterns():
    """Sample behavior patterns for testing."""
    return [
        {"sequence": ["login", "dashboard", "logout"], "support": 0.25, "occurrence_count": 50},
        {"sequence": ["login", "search", "view_item"], "support": 0.15, "occurrence_count": 30},
        {"sequence": ["login", "search", "add_to_cart", "checkout"], "support": 0.10, "occurrence_count": 20},
        {"sequence": ["register", "verify_email", "login"], "support": 0.08, "occurrence_count": 16},
        {"sequence": ["login", "settings", "update_profile"], "support": 0.06, "occurrence_count": 12},
        {"sequence": ["login", "search", "view_item", "error"], "support": 0.04, "occurrence_count": 8},
    ]


@pytest.fixture
def sample_test_patterns():
    """Sample test coverage patterns."""
    return [
        ["login", "dashboard", "logout"],
        ["login", "search", "view_item"],
        ["register", "verify_email", "login"],
    ]


@pytest.fixture
def sample_code_symbols():
    """Sample code symbols for testing."""
    return [
        {
            "name": "login",
            "kind": "function",
            "file_path": "auth.py",
            "start_line": 10,
            "end_line": 25,
            "signature": "def login(username: str, password: str) -> bool",
        },
        {
            "name": "logout",
            "kind": "function",
            "file_path": "auth.py",
            "start_line": 30,
            "end_line": 40,
            "signature": "def logout(session_id: str) -> None",
        },
        {
            "name": "search",
            "kind": "function",
            "file_path": "search.py",
            "start_line": 5,
            "end_line": 50,
            "signature": "def search(query: str, filters: dict) -> list",
        },
        {
            "name": "UserController",
            "kind": "class",
            "file_path": "controllers.py",
            "start_line": 1,
            "end_line": 100,
            "signature": "class UserController",
        },
    ]


@pytest.fixture
def sample_gap():
    """Sample coverage gap for testing."""
    return {
        "gap_id": "gap_001",
        "pattern": ["login", "search", "add_to_cart", "checkout"],
        "support": 0.10,
        "priority": "high",
        "description": "Checkout flow not covered",
        "suggested_test": "test_checkout_flow",
        "suggested_file": "tests/test_checkout.py",
    }
