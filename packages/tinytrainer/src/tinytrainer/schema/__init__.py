"""Schema layer — data contracts for training, export, and kits."""

from tinytrainer.schema.config import BackboneChoice, ExportConfig, HeadType, TrainConfig
from tinytrainer.schema.kit import KitManifest, Recipe, TokenizerRef
from tinytrainer.schema.result import EvalResult, TrainResult

__all__ = [
    "BackboneChoice",
    "EvalResult",
    "ExportConfig",
    "HeadType",
    "KitManifest",
    "Recipe",
    "TokenizerRef",
    "TrainConfig",
    "TrainResult",
]
