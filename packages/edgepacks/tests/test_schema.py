"""Tests for schema layer — PackSpec validation and serialization."""

import pytest

from edgepacks.schema.eval_protocol import EvalMetric, EvalProtocol
from edgepacks.schema.example import Example, HardNegative
from edgepacks.schema.pack import GenerationMode, PackSpec, QualityCheck
from edgepacks.schema.splits import SplitConfig


class TestSplitConfig:
    def test_valid_ratios(self):
        sc = SplitConfig(train_ratio=0.8, val_ratio=0.1, test_ratio=0.1)
        assert sc.train_ratio == 0.8

    def test_invalid_ratios_sum(self):
        with pytest.raises(ValueError, match="sum to 1.0"):
            SplitConfig(train_ratio=0.5, val_ratio=0.1, test_ratio=0.1)

    def test_default_ratios(self):
        sc = SplitConfig()
        assert sc.train_ratio + sc.val_ratio + sc.test_ratio == pytest.approx(1.0)


class TestExample:
    def test_create_example(self):
        ex = Example(
            input={"text": "hello"},
            output={"label": "greeting"},
        )
        assert ex.source == "curated"
        assert ex.quality_score is None

    def test_synthetic_example(self):
        ex = Example(
            input={"text": "test"},
            output={"label": "other"},
            source="synthetic",
            quality_score=0.95,
        )
        assert ex.source == "synthetic"
        assert ex.quality_score == 0.95


class TestHardNegative:
    def test_create_hard_negative(self):
        hn = HardNegative(
            input={"text": "ambiguous"},
            expected_output={"label": "A"},
            plausible_wrong={"label": "B"},
            confusion_reason="A and B are similar",
        )
        assert hn.confusion_reason == "A and B are similar"


class TestEvalProtocol:
    def test_create_protocol(self):
        proto = EvalProtocol(
            metrics=[EvalMetric(name="accuracy", threshold=0.9)],
        )
        assert len(proto.metrics) == 1

    def test_empty_metrics_rejected(self):
        with pytest.raises(ValueError):
            EvalProtocol(metrics=[])


class TestPackSpec:
    def test_create_minimal(self, sample_pack):
        assert sample_pack.name == "test-pack"
        assert len(sample_pack.examples) == 20

    def test_serialization_roundtrip(self, sample_pack):
        json_str = sample_pack.model_dump_json()
        restored = PackSpec.model_validate_json(json_str)
        assert restored.name == sample_pack.name
        assert len(restored.examples) == len(sample_pack.examples)
        assert restored.task_type == sample_pack.task_type

    def test_generation_mode_enum(self):
        assert GenerationMode.HYBRID == "hybrid"
        assert GenerationMode.SYNTHETIC == "synthetic"

    def test_quality_check_enum(self):
        assert QualityCheck.SCHEMA_VALID == "schema_valid"

    def test_default_quality_checks(self):
        pack = PackSpec(
            name="test",
            description="test",
            task_type="classification",
            input_schema={"type": "object"},
            output_schema={"type": "object"},
            instruction_template="test",
            eval_protocol=EvalProtocol(
                metrics=[EvalMetric(name="acc")]
            ),
        )
        assert QualityCheck.SCHEMA_VALID in pack.quality_checks
