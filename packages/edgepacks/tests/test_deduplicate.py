"""Tests for deduplication stage."""

from edgepacks.foundry.deduplicate import DeduplicateStage, dedup_exact, dedup_fuzzy
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class TestExactDedup:
    def test_removes_exact_duplicates(self):
        ex = Example(input={"request": "same"}, output={"tool": "a", "args": {}})
        kept, removed = dedup_exact([ex, ex, ex])
        assert len(kept) == 1
        assert removed == 2

    def test_keeps_unique(self, sample_examples):
        kept, removed = dedup_exact(sample_examples)
        assert len(kept) == len(sample_examples)
        assert removed == 0


class TestFuzzyDedup:
    def test_removes_near_duplicates(self):
        ex1 = Example(
            input={"request": "find all files in the current directory"},
            output={"tool": "a", "args": {}},
        )
        ex2 = Example(
            input={"request": "find all files in the current directory please"},
            output={"tool": "a", "args": {}},
        )
        kept, removed = dedup_fuzzy([ex1, ex2], threshold=0.8)
        assert removed >= 1

    def test_keeps_distinct(self):
        ex1 = Example(
            input={"request": "search the web for python tutorials"},
            output={"tool": "search", "args": {}},
        )
        ex2 = Example(
            input={"request": "compile and deploy the docker container"},
            output={"tool": "deploy", "args": {}},
        )
        kept, removed = dedup_fuzzy([ex1, ex2], threshold=0.8)
        assert len(kept) == 2
        assert removed == 0


class TestDeduplicateStage:
    def test_stage_dedup(self, sample_pack: PackSpec):
        # Add a duplicate
        dup = sample_pack.examples[0].model_copy()
        pack = sample_pack.model_copy(
            update={"examples": list(sample_pack.examples) + [dup]}
        )
        stage = DeduplicateStage()
        result = stage(pack, config={"skip_fuzzy": True})
        assert len(result.examples) == len(sample_pack.examples)
