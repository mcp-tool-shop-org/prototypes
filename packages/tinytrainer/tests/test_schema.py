"""Tests for schema models."""

import pytest

from tinytrainer.schema.config import BackboneChoice, HeadType, TrainConfig
from tinytrainer.schema.kit import KitManifest, Recipe, TokenizerRef
from tinytrainer.schema.result import EvalResult, TrainResult


class TestTrainConfig:
    def test_defaults(self):
        config = TrainConfig()
        assert config.backbone == BackboneChoice.MINILM_L6
        assert config.head_type == HeadType.LINEAR
        assert config.max_epochs == 50

    def test_serialization_roundtrip(self):
        config = TrainConfig(learning_rate=0.005, max_epochs=10)
        restored = TrainConfig.model_validate_json(config.model_dump_json())
        assert restored.learning_rate == 0.005
        assert restored.max_epochs == 10

    def test_invalid_lr(self):
        with pytest.raises(ValueError):
            TrainConfig(learning_rate=-1)


class TestKitManifest:
    def test_create(self):
        manifest = KitManifest(
            task_type="classification",
            label_space=["a", "b"],
            num_labels=2,
            backbone="test",
            head_type="linear",
        )
        assert manifest.num_labels == 2

    def test_roundtrip(self):
        manifest = KitManifest(
            task_type="classification",
            label_space=["x", "y", "z"],
            num_labels=3,
            backbone="all-MiniLM-L6-v2",
            head_type="linear",
        )
        restored = KitManifest.model_validate_json(manifest.model_dump_json())
        assert restored.label_space == ["x", "y", "z"]


class TestRecipe:
    def test_defaults(self):
        recipe = Recipe()
        assert recipe.max_epochs == 10
        assert recipe.min_examples_to_retrain == 5


class TestTokenizerRef:
    def test_create(self):
        ref = TokenizerRef(model_name="test", embedding_dim=384, max_seq_length=256)
        assert ref.embedding_dim == 384


class TestResults:
    def test_train_result(self, tmp_path):
        result = TrainResult(
            model_dir=tmp_path, epochs_run=5, best_epoch=3,
            best_val_loss=0.1, label_map={"a": 0, "b": 1},
        )
        assert result.best_val_loss == 0.1

    def test_eval_result(self):
        result = EvalResult(pack_name="test", metrics={"accuracy": 0.95}, passed=True)
        assert result.passed
