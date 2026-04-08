"""Tests for pipeline orchestrator."""

from edgepacks.foundry.deduplicate import DeduplicateStage
from edgepacks.foundry.pipeline import Pipeline
from edgepacks.foundry.split import SplitStage
from edgepacks.foundry.validate import ValidateStage
from edgepacks.schema.pack import PackSpec


class TestPipeline:
    def test_dry_run(self):
        pipeline = Pipeline()
        pipeline.add(ValidateStage())
        pipeline.add(DeduplicateStage())
        pipeline.add(SplitStage())
        assert pipeline.dry_run() == ["validate", "deduplicate", "split"]

    def test_run_preserves_examples(self, sample_pack: PackSpec):
        pipeline = Pipeline()
        pipeline.add(ValidateStage())
        pipeline.add(DeduplicateStage())
        pipeline.add(SplitStage())

        result = pipeline.run(sample_pack, config={"skip_fuzzy": True})
        assert len(result.examples) == len(sample_pack.examples)

    def test_empty_pipeline(self, sample_pack: PackSpec):
        pipeline = Pipeline()
        result = pipeline.run(sample_pack)
        assert result.name == sample_pack.name

    def test_len(self):
        pipeline = Pipeline()
        assert len(pipeline) == 0
        pipeline.add(ValidateStage())
        assert len(pipeline) == 1

    def test_repr(self):
        pipeline = Pipeline()
        pipeline.add(ValidateStage())
        pipeline.add(SplitStage())
        assert "validate → split" in repr(pipeline)

    def test_stage_callback(self, sample_pack: PackSpec):
        pipeline = Pipeline()
        pipeline.add(ValidateStage())

        completed = []

        def on_complete(name, _pack):
            completed.append(name)

        pipeline.run(sample_pack, on_stage_complete=on_complete)
        assert completed == ["validate"]
