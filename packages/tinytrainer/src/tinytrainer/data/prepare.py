"""Label encoding and dataset preparation."""

from __future__ import annotations

from typing import TYPE_CHECKING

import numpy as np

from tinytrainer.data.dataset import EmbeddingDataset

if TYPE_CHECKING:
    from tinytrainer.backbone.embedder import SentenceEmbedder


class LabelEncoder:
    """Bidirectional label <-> int mapping."""

    def __init__(self) -> None:
        self._label_to_idx: dict[str, int] = {}
        self._idx_to_label: dict[int, str] = {}

    def fit(self, labels: list[str]) -> LabelEncoder:
        """Build mapping from unique sorted labels."""
        unique = sorted(set(labels))
        self._label_to_idx = {label: idx for idx, label in enumerate(unique)}
        self._idx_to_label = {idx: label for label, idx in self._label_to_idx.items()}
        return self

    def fit_with_space(self, labels: list[str], label_space: list[str]) -> LabelEncoder:
        """Build mapping using a predefined label space (ensures all labels are present)."""
        all_labels = sorted(set(label_space) | set(labels))
        self._label_to_idx = {label: idx for idx, label in enumerate(all_labels)}
        self._idx_to_label = {idx: label for label, idx in self._label_to_idx.items()}
        return self

    def encode(self, label: str) -> int:
        if label not in self._label_to_idx:
            msg = f"Unknown label: '{label}'. Known: {list(self._label_to_idx.keys())}"
            raise ValueError(msg)
        return self._label_to_idx[label]

    def encode_batch(self, labels: list[str]) -> np.ndarray:
        return np.array([self.encode(lb) for lb in labels], dtype=np.int64)

    def decode(self, idx: int) -> str:
        return self._idx_to_label[idx]

    @property
    def label_map(self) -> dict[str, int]:
        return dict(self._label_to_idx)

    @property
    def num_labels(self) -> int:
        return len(self._label_to_idx)


def prepare_dataset(
    texts: list[str],
    labels: list[str],
    embedder: SentenceEmbedder,
    label_encoder: LabelEncoder | None = None,
    label_space: list[str] | None = None,
) -> tuple[EmbeddingDataset, LabelEncoder]:
    """Embed texts and encode labels into a ready-to-train dataset.

    Embeddings are computed once (backbone is frozen).
    """
    if label_encoder is None:
        label_encoder = LabelEncoder()
        if label_space:
            label_encoder.fit_with_space(labels, label_space)
        else:
            label_encoder.fit(labels)

    embeddings = embedder.embed(texts)
    encoded_labels = label_encoder.encode_batch(labels)

    dataset = EmbeddingDataset(embeddings, encoded_labels)
    return dataset, label_encoder
