"""Shared fixtures — mock embedder (16-dim), tiny training data."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pytest
import torch

from tinytrainer.models.classifier import ClassifierHead
from tinytrainer.schema.config import HeadType, TrainConfig
from tinytrainer.schema.kit import TokenizerRef


class MockEmbedder:
    """Fake embedder that returns 16-dim random vectors. No model download."""

    def __init__(self, dim: int = 16) -> None:
        self._dim = dim
        self._rng = np.random.RandomState(42)

    @property
    def embedding_dim(self) -> int:
        return self._dim

    @property
    def max_seq_length(self) -> int:
        return 128

    def embed(self, texts: list[str], batch_size: int = 64) -> np.ndarray:
        return self._rng.randn(len(texts), self._dim).astype(np.float32)

    def embed_single(self, text: str) -> np.ndarray:
        return self.embed([text])[0]

    def tokenizer_ref(self) -> TokenizerRef:
        return TokenizerRef(
            model_name="mock-embedder",
            embedding_dim=self._dim,
            max_seq_length=128,
        )


@pytest.fixture()
def mock_embedder() -> MockEmbedder:
    return MockEmbedder(dim=16)


@pytest.fixture()
def sample_texts_labels() -> tuple[list[str], list[str]]:
    """20 (text, label) pairs across 3 labels."""
    texts = [f"Sample text number {i}" for i in range(20)]
    labels = ["cat_a"] * 7 + ["cat_b"] * 7 + ["cat_c"] * 6
    return texts, labels


@pytest.fixture()
def tiny_head() -> ClassifierHead:
    return ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)


@pytest.fixture()
def tiny_config() -> TrainConfig:
    return TrainConfig(
        backbone="all-MiniLM-L6-v2",
        head_type=HeadType.LINEAR,
        learning_rate=0.01,
        batch_size=8,
        max_epochs=3,
        patience=2,
        seed=42,
    )


@pytest.fixture()
def trained_model_dir(tmp_path: Path, tiny_head: ClassifierHead, tiny_config: TrainConfig):
    """Pre-saved model checkpoint in tmp_path."""
    torch.save(tiny_head.state_dict(), tmp_path / "model.pt")
    with open(tmp_path / "config.json", "w") as f:
        json.dump(tiny_config.model_dump(mode="json"), f)
    with open(tmp_path / "label_map.json", "w") as f:
        json.dump({"cat_a": 0, "cat_b": 1, "cat_c": 2}, f)
    with open(tmp_path / "train_result.json", "w") as f:
        json.dump({"model_dir": str(tmp_path), "epochs_run": 3, "best_epoch": 1,
                    "best_val_loss": 0.5, "label_map": {"cat_a": 0, "cat_b": 1, "cat_c": 2}}, f)
    return tmp_path
