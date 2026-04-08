"""Tests for split stage and leakage detection."""

from edgepacks.foundry.split import SplitStage, check_leakage, split_examples
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec
from edgepacks.schema.splits import SplitResult


class TestSplitExamples:
    def test_split_ratios(self, sample_examples):
        result = split_examples(sample_examples, train_ratio=0.7, val_ratio=0.15)
        total = len(result.train) + len(result.val) + len(result.test)
        assert total == len(sample_examples)

    def test_reproducible_with_seed(self, sample_examples):
        r1 = split_examples(sample_examples, seed=42)
        r2 = split_examples(sample_examples, seed=42)
        assert [e.input for e in r1.train] == [e.input for e in r2.train]

    def test_different_seeds_differ(self, sample_examples):
        r1 = split_examples(sample_examples, seed=42)
        r2 = split_examples(sample_examples, seed=99)
        assert [e.input for e in r1.train] != [e.input for e in r2.train]

    def test_empty_input(self):
        result = split_examples([])
        assert result.train == []
        assert result.val == []
        assert result.test == []


class TestLeakageDetection:
    def test_detects_leak(self):
        shared = Example(input={"request": "shared"}, output={"tool": "x", "args": {}})
        unique = Example(input={"request": "unique"}, output={"tool": "y", "args": {}})

        result = SplitResult(
            train=[shared],
            val=[shared, unique],
            test=[],
        )
        cleaned, leaks = check_leakage(result)
        assert leaks == 1
        assert len(cleaned.val) == 1

    def test_no_leak(self, sample_examples):
        result = split_examples(sample_examples)
        _, leaks = check_leakage(result)
        assert leaks == 0


class TestSplitStage:
    def test_stage_splits(self, sample_pack: PackSpec):
        stage = SplitStage()
        result = stage(sample_pack)
        # All examples should still be present
        assert len(result.examples) == len(sample_pack.examples)
        # Split info should be stored
        assert "_split_result" in result.generation_config
