"""Example and HardNegative — the atomic units of a dataset pack."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class Example(BaseModel):
    """A single training example with structured input and output."""

    input: dict[str, Any]
    output: dict[str, Any]
    metadata: dict[str, Any] = Field(default_factory=dict)
    source: Literal["curated", "synthetic", "augmented"] = "curated"
    quality_score: float | None = None


class HardNegative(BaseModel):
    """An example designed to expose model confusion boundaries."""

    input: dict[str, Any]
    expected_output: dict[str, Any]
    plausible_wrong: dict[str, Any]
    confusion_reason: str
    source: Literal["curated", "synthetic", "augmented"] = "curated"
