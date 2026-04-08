"""Training and export configuration."""

from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, Field


class BackboneChoice(StrEnum):
    MINILM_L6 = "all-MiniLM-L6-v2"
    MINILM_L12 = "all-MiniLM-L12-v2"


BACKBONE_DIMS: dict[str, int] = {
    "all-MiniLM-L6-v2": 384,
    "all-MiniLM-L12-v2": 384,
}


class HeadType(StrEnum):
    LINEAR = "linear"
    MLP = "mlp"


class TrainConfig(BaseModel):
    """Configuration for a training run."""

    backbone: BackboneChoice = BackboneChoice.MINILM_L6
    head_type: HeadType = HeadType.LINEAR
    mlp_hidden: int = Field(default=128, ge=16)
    learning_rate: float = Field(default=1e-3, gt=0)
    batch_size: int = Field(default=32, ge=1)
    max_epochs: int = Field(default=50, ge=1)
    patience: int = Field(default=5, ge=1)
    optimizer: Literal["adam", "sgd"] = "adam"
    seed: int = 42
    device: str = "cpu"
    label_field: str | None = None


class ExportFormat(StrEnum):
    ONNX = "onnx"
    COREML = "coreml"


class ExportConfig(BaseModel):
    """Configuration for model export."""

    format: ExportFormat = ExportFormat.ONNX
    quantize: bool = False
    mark_updatable: bool = True
