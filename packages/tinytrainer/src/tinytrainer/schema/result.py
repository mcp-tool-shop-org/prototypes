"""Training and evaluation result models."""

from pathlib import Path

from pydantic import BaseModel, Field


class TrainResult(BaseModel):
    """Output of a training run."""

    model_dir: Path
    epochs_run: int
    best_epoch: int
    best_val_loss: float
    train_losses: list[float] = Field(default_factory=list)
    val_losses: list[float] = Field(default_factory=list)
    label_map: dict[str, int] = Field(default_factory=dict)


class EvalResult(BaseModel):
    """Output of an evaluation run."""

    pack_name: str
    metrics: dict[str, float] = Field(default_factory=dict)
    per_class: dict[str, dict[str, float]] = Field(default_factory=dict)
    num_examples: int = 0
    passed: bool = False
    threshold_report: list[dict] = Field(default_factory=list)
