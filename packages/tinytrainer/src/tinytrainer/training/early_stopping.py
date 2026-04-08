"""Early stopping monitor."""

from __future__ import annotations


class EarlyStopping:
    """Stop training when validation loss stops improving."""

    def __init__(self, patience: int = 5, min_delta: float = 0.0) -> None:
        self.patience = patience
        self.min_delta = min_delta
        self._best_loss = float("inf")
        self._best_epoch = 0
        self._counter = 0

    def step(self, val_loss: float, epoch: int) -> bool:
        """Returns True if training should stop."""
        if val_loss < self._best_loss - self.min_delta:
            self._best_loss = val_loss
            self._best_epoch = epoch
            self._counter = 0
            return False
        self._counter += 1
        return self._counter >= self.patience

    @property
    def best_loss(self) -> float:
        return self._best_loss

    @property
    def best_epoch(self) -> int:
        return self._best_epoch
