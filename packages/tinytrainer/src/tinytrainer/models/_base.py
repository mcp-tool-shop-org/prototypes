"""BaseHead protocol for trainable heads."""

from typing import Protocol

import torch


class BaseHead(Protocol):
    """Protocol for trainable classifier heads."""

    def forward(self, embeddings: torch.Tensor) -> torch.Tensor: ...

    @property
    def updatable_param_names(self) -> list[str]: ...
