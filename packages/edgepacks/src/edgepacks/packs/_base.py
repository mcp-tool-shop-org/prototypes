"""BasePack — abstract base class every pack must implement."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from edgepacks.foundry.ollama_client import OllamaClient
from edgepacks.schema.example import Example, HardNegative
from edgepacks.schema.pack import PackSpec


class BasePack(ABC):
    """Interface for a dataset pack.

    Each pack provides its own spec, generation logic, mutation rules,
    and evaluation protocol.
    """

    @abstractmethod
    def spec(self) -> PackSpec:
        """Return the pack's full specification with seed examples."""

    def generate_prompt(self, seed: Example) -> str:
        """Create a generation prompt from a seed example.

        Override for pack-specific prompt engineering.
        """
        import json

        return (
            f"Generate a new example similar to this one:\n"
            f"Input: {json.dumps(seed.input)}\n"
            f"Output: {json.dumps(seed.output)}\n\n"
            f"Respond with a JSON object containing 'input' and 'output' keys."
        )

    def mutate(
        self,
        example: Example,
        strategy: str,
        client: OllamaClient | None = None,
    ) -> HardNegative | None:
        """Create a hard negative from an example. Override for pack-specific mutations."""
        return None

    def evaluate(self, predicted: dict[str, Any], expected: dict[str, Any]) -> float:
        """Score a prediction against expected output. Returns 0.0-1.0.

        Override for pack-specific evaluation logic.
        """
        return 1.0 if predicted == expected else 0.0
