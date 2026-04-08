"""Tests for structured-extraction pack."""

import pytest

from edgepacks.packs.structured_extraction import StructuredExtractionPack
from edgepacks.packs.structured_extraction.evaluator import evaluate_extraction
from edgepacks.packs.structured_extraction.schemas import EXTRACTION_SCHEMAS


@pytest.mark.pack
class TestStructuredExtractionPack:
    def test_spec_valid(self):
        pack = StructuredExtractionPack()
        spec = pack.spec()
        assert spec.name == "structured-extraction"
        assert spec.task_type == "extraction"
        assert len(spec.examples) >= 8

    def test_all_schema_types_covered(self):
        pack = StructuredExtractionPack()
        spec = pack.spec()
        schema_types = {ex.input["schema_type"] for ex in spec.examples}
        assert schema_types == set(EXTRACTION_SCHEMAS.keys())


@pytest.mark.pack
class TestExtractionEvaluator:
    def test_perfect_dict_extraction(self):
        scores = evaluate_extraction(
            {"extracted": {"name": "Alice", "email": "a@b.com"}, "confidence": 0.9},
            {"extracted": {"name": "Alice", "email": "a@b.com"}, "confidence": 0.9},
        )
        assert scores["f1"] == 1.0

    def test_partial_extraction(self):
        scores = evaluate_extraction(
            {"extracted": {"name": "Alice"}, "confidence": 0.5},
            {"extracted": {"name": "Alice", "email": "a@b.com"}, "confidence": 0.9},
        )
        assert 0.0 < scores["f1"] < 1.0
        assert scores["field_recall"] == 0.5

    def test_list_extraction(self):
        scores = evaluate_extraction(
            {"extracted": [{"key": "a"}, {"key": "b"}], "confidence": 0.8},
            {"extracted": [{"key": "a"}, {"key": "b"}, {"key": "c"}], "confidence": 0.9},
        )
        assert 0.0 < scores["f1"] < 1.0
