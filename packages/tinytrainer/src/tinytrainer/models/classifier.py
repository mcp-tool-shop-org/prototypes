"""ClassifierHead — Linear or MLP on top of frozen embeddings."""

from __future__ import annotations

import torch
import torch.nn as nn

from tinytrainer.schema.config import HeadType


class ClassifierHead(nn.Module):
    """Small classifier head for text classification.

    LINEAR: single nn.Linear(input_dim, num_labels)
    MLP: Linear → ReLU → Dropout → Linear
    """

    def __init__(
        self,
        input_dim: int,
        num_labels: int,
        head_type: HeadType = HeadType.LINEAR,
        mlp_hidden: int = 128,
        dropout: float = 0.1,
    ) -> None:
        super().__init__()
        self.input_dim = input_dim
        self.num_labels = num_labels
        self.head_type = head_type

        if head_type == HeadType.LINEAR:
            self.classifier = nn.Linear(input_dim, num_labels)
        else:
            self.classifier = nn.Sequential(
                nn.Linear(input_dim, mlp_hidden),
                nn.ReLU(),
                nn.Dropout(dropout),
                nn.Linear(mlp_hidden, num_labels),
            )

    def forward(self, embeddings: torch.Tensor) -> torch.Tensor:
        return self.classifier(embeddings)

    @property
    def updatable_param_names(self) -> list[str]:
        return [name for name, _ in self.named_parameters()]
