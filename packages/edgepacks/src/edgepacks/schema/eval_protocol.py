"""Evaluation protocol — what metrics to use, thresholds, stratification."""

from pydantic import BaseModel, Field


class EvalMetric(BaseModel):
    """A single evaluation metric with weight and threshold."""

    name: str
    weight: float = 1.0
    threshold: float = 0.0
    description: str = ""


class EvalProtocol(BaseModel):
    """How to evaluate a fine-tuned model against this pack's eval set."""

    metrics: list[EvalMetric] = Field(min_length=1)
    min_eval_samples: int = Field(default=50, ge=1)
    stratify_by: str | None = None
    description: str = ""
