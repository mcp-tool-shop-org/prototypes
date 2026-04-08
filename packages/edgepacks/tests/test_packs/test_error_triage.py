"""Tests for error-triage pack."""

import pytest

from edgepacks.packs.error_triage import ErrorTriagePack
from edgepacks.packs.error_triage.categories import ERROR_CATEGORIES, SEVERITY_LEVELS
from edgepacks.packs.error_triage.evaluator import evaluate_error_triage


@pytest.mark.pack
class TestErrorTriagePack:
    def test_spec_valid(self):
        pack = ErrorTriagePack()
        spec = pack.spec()
        assert spec.name == "error-triage"
        assert spec.task_type == "classification"
        assert len(spec.examples) >= 12

    def test_categories_covered(self):
        pack = ErrorTriagePack()
        spec = pack.spec()
        categories = {ex.output["category"] for ex in spec.examples}
        # Not all 20 need seed data, but should have good coverage
        assert len(categories) >= 8

    def test_valid_severities(self):
        pack = ErrorTriagePack()
        spec = pack.spec()
        for ex in spec.examples:
            assert ex.output["severity"] in SEVERITY_LEVELS

    def test_valid_categories(self):
        pack = ErrorTriagePack()
        spec = pack.spec()
        for ex in spec.examples:
            assert ex.output["category"] in ERROR_CATEGORIES


@pytest.mark.pack
class TestErrorTriageEvaluator:
    def test_perfect_match(self):
        scores = evaluate_error_triage(
            {"category": "null_reference", "severity": "medium", "next_step": "fix_code"},
            {"category": "null_reference", "severity": "medium", "next_step": "fix_code"},
        )
        assert scores["combined"] == 1.0

    def test_wrong_category(self):
        scores = evaluate_error_triage(
            {"category": "type_error", "severity": "medium", "next_step": "fix_code"},
            {"category": "null_reference", "severity": "medium", "next_step": "fix_code"},
        )
        assert scores["category_accuracy"] == 0.0
        assert scores["severity_accuracy"] == 1.0
        assert scores["combined"] == 0.5  # 0.3 + 0.2

    def test_all_wrong(self):
        scores = evaluate_error_triage(
            {"category": "a", "severity": "b", "next_step": "c"},
            {"category": "x", "severity": "y", "next_step": "z"},
        )
        assert scores["combined"] == 0.0
