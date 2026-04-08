"""edgepacks — Task-dataset foundry for training small models on narrow jobs."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("edgepacks")
except PackageNotFoundError:
    __version__ = "1.0.0"

from edgepacks.errors import EdgepacksError, OllamaError, PackNotFoundError, ValidationError
from edgepacks.schema import EvalMetric, EvalProtocol, Example, HardNegative, PackSpec, SplitConfig

__all__ = [
    "EdgepacksError",
    "EvalMetric",
    "EvalProtocol",
    "Example",
    "HardNegative",
    "OllamaError",
    "PackNotFoundError",
    "PackSpec",
    "SplitConfig",
    "ValidationError",
    "__version__",
]
