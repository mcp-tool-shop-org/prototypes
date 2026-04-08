"""Schema layer — formal spec for what a dataset pack IS."""

from edgepacks.schema.eval_protocol import EvalMetric, EvalProtocol
from edgepacks.schema.example import Example, HardNegative
from edgepacks.schema.pack import GenerationMode, PackSpec, QualityCheck
from edgepacks.schema.splits import SplitConfig, SplitResult

__all__ = [
    "EvalMetric",
    "EvalProtocol",
    "Example",
    "GenerationMode",
    "HardNegative",
    "PackSpec",
    "QualityCheck",
    "SplitConfig",
    "SplitResult",
]
