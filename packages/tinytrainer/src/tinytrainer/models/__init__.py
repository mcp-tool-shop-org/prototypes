"""Model registry — small trainable heads."""

from __future__ import annotations

import torch.nn as nn

from tinytrainer.models.classifier import ClassifierHead
from tinytrainer.schema.config import HeadType

MODEL_REGISTRY: dict[str, type[nn.Module]] = {
    "classifier": ClassifierHead,
}


def get_model(
    head_type: HeadType,
    input_dim: int,
    num_labels: int,
    mlp_hidden: int = 128,
) -> nn.Module:
    """Create a classifier head with the given configuration."""
    return ClassifierHead(
        input_dim=input_dim,
        num_labels=num_labels,
        head_type=head_type,
        mlp_hidden=mlp_hidden,
    )


def list_models() -> list[str]:
    return list(MODEL_REGISTRY.keys())


__all__ = ["ClassifierHead", "get_model", "list_models"]
