"""Tests for mutation engine."""

from edgepacks.foundry.mutate import MutateStage, mutate_examples, partial_input, swap_label
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class TestSwapLabel:
    def test_swaps_label(self, sample_pack: PackSpec):
        ex = sample_pack.examples[0]
        import random

        rng = random.Random(42)
        result = swap_label(ex, sample_pack, rng)
        assert result is not None
        assert result.expected_output == ex.output
        assert result.plausible_wrong != ex.output
        assert "Swapped" in result.confusion_reason

    def test_no_label_space(self, sample_pack: PackSpec):
        pack = sample_pack.model_copy(update={"label_space": None})
        import random

        result = swap_label(pack.examples[0], pack, random.Random(42))
        assert result is None


class TestPartialInput:
    def test_removes_field(self):
        import random

        ex = Example(
            input={"field_a": "val1", "field_b": "val2"},
            output={"label": "x"},
        )
        result = partial_input(ex, random.Random(42))
        assert result is not None
        assert len(result.input) == 1

    def test_single_field_returns_none(self):
        import random

        ex = Example(input={"only": "field"}, output={"label": "x"})
        result = partial_input(ex, random.Random(42))
        assert result is None


class TestMutateExamples:
    def test_generates_negatives(self, sample_pack: PackSpec):
        negatives = mutate_examples(sample_pack, count=5)
        assert len(negatives) > 0
        assert len(negatives) <= 5


class TestMutateStage:
    def test_stage_adds_negatives(self, sample_pack: PackSpec):
        stage = MutateStage()
        original_count = len(sample_pack.hard_negatives)
        result = stage(sample_pack, config={"count": 3})
        assert len(result.hard_negatives) > original_count
