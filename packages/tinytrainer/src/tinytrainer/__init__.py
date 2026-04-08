"""tinytrainer — Desktop training foundry + mobile personalization export pipeline."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("tinytrainer")
except PackageNotFoundError:
    __version__ = "0.1.0"
