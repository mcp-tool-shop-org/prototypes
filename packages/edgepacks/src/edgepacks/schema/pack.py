"""PackSpec — the complete specification for a dataset pack."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

from edgepacks.schema.eval_protocol import EvalProtocol
from edgepacks.schema.example import Example, HardNegative
from edgepacks.schema.splits import SplitConfig


class GenerationMode(StrEnum):
    CURATED = "curated"
    SYNTHETIC = "synthetic"
    HYBRID = "hybrid"


class QualityCheck(StrEnum):
    SCHEMA_VALID = "schema_valid"
    INPUT_NONEMPTY = "input_nonempty"
    OUTPUT_NONEMPTY = "output_nonempty"
    LABEL_IN_SPACE = "label_in_space"
    NO_TRUNCATION = "no_truncation"
    MIN_TOKEN_COUNT = "min_token_count"
    CUSTOM = "custom"


class PackSpec(BaseModel):
    """The complete specification for a dataset pack.

    This is the central data structure. Every layer — foundry, export, CLI —
    operates on PackSpec instances.
    """

    # Identity
    name: str
    version: str = "0.1.0"
    description: str
    author: str = "mcp-tool-shop"
    license: str = "MIT"
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Task definition
    task_type: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    instruction_template: str
    label_space: list[str] | None = None

    # Generation
    generation_mode: GenerationMode = GenerationMode.HYBRID
    generation_config: dict[str, Any] = Field(default_factory=dict)

    # Quality
    quality_checks: list[QualityCheck] = Field(
        default_factory=lambda: [
            QualityCheck.SCHEMA_VALID,
            QualityCheck.INPUT_NONEMPTY,
            QualityCheck.OUTPUT_NONEMPTY,
        ]
    )
    min_quality_score: float = Field(default=0.7, ge=0.0, le=1.0)

    # Evaluation
    eval_protocol: EvalProtocol

    # Splits
    split_config: SplitConfig = Field(default_factory=SplitConfig)

    # Data
    examples: list[Example] = Field(default_factory=list)
    hard_negatives: list[HardNegative] = Field(default_factory=list)

    # Recommendations
    recommended_model_classes: list[str] = Field(default_factory=list)

    # Metadata
    tags: list[str] = Field(default_factory=list)
    min_examples: int = Field(default=500, ge=1)
    target_examples: int = Field(default=2000, ge=1)
