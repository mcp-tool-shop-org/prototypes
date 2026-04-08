"""Metrics accumulator for tracking training progress."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class EpochMetrics:
    epoch: int
    train_loss: float
    val_loss: float
    val_accuracy: float


class MetricsAccumulator:
    """Tracks per-epoch training and validation metrics."""

    def __init__(self) -> None:
        self._history: list[EpochMetrics] = []

    def update(
        self, epoch: int, train_loss: float, val_loss: float, val_accuracy: float
    ) -> None:
        self._history.append(
            EpochMetrics(
                epoch=epoch,
                train_loss=train_loss,
                val_loss=val_loss,
                val_accuracy=val_accuracy,
            )
        )

    @property
    def train_losses(self) -> list[float]:
        return [m.train_loss for m in self._history]

    @property
    def val_losses(self) -> list[float]:
        return [m.val_loss for m in self._history]

    @property
    def val_accuracies(self) -> list[float]:
        return [m.val_accuracy for m in self._history]

    @property
    def best_val_loss(self) -> float:
        return min(m.val_loss for m in self._history) if self._history else float("inf")

    def summary(self) -> dict:
        if not self._history:
            return {}
        best = min(self._history, key=lambda m: m.val_loss)
        return {
            "epochs": len(self._history),
            "best_epoch": best.epoch,
            "best_val_loss": best.val_loss,
            "best_val_accuracy": best.val_accuracy,
            "final_train_loss": self._history[-1].train_loss,
        }
