"""Training kit manifest, recipe, and tokenizer reference."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class TokenizerRef(BaseModel):
    """Which sentence-transformers model to use for embedding on device."""

    model_name: str
    embedding_dim: int
    max_seq_length: int


class Recipe(BaseModel):
    """On-device personalization recipe — what's trainable and bounds."""

    updatable_layers: list[str] = Field(default_factory=list)
    learning_rate_min: float = 1e-5
    learning_rate_max: float = 1e-2
    max_epochs: int = 10
    min_examples_to_retrain: int = 5


class KitManifest(BaseModel):
    """Metadata for a training kit bundle."""

    kit_version: str = "1.0"
    task_type: str
    label_space: list[str]
    num_labels: int
    backbone: str
    head_type: str
    training_config: dict[str, Any] = Field(default_factory=dict)
    pack_name: str | None = None
    pack_version: str | None = None
    trained_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    eval_scores: dict[str, float] = Field(default_factory=dict)
    device_targets: list[str] = Field(default_factory=list)
