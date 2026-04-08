"""Hard-negative mutation engine."""

from __future__ import annotations

import json
import logging
import random
from typing import Any

from edgepacks.foundry.ollama_client import OllamaClient
from edgepacks.schema.example import Example, HardNegative
from edgepacks.schema.pack import PackSpec

logger = logging.getLogger(__name__)


def swap_label(example: Example, pack: PackSpec, rng: random.Random) -> HardNegative | None:
    """Pick a plausible-but-wrong label from the label space."""
    if not pack.label_space:
        return None

    correct_label = None
    label_key = None
    for k, v in example.output.items():
        if isinstance(v, str) and v in pack.label_space:
            correct_label = v
            label_key = k
            break

    if correct_label is None or label_key is None:
        return None

    other_labels = [lb for lb in pack.label_space if lb != correct_label]
    if not other_labels:
        return None

    wrong_label = rng.choice(other_labels)
    wrong_output = {**example.output, label_key: wrong_label}

    return HardNegative(
        input=example.input,
        expected_output=example.output,
        plausible_wrong=wrong_output,
        confusion_reason=f"Swapped '{correct_label}' → '{wrong_label}'",
        source="augmented",
    )


def partial_input(example: Example, rng: random.Random) -> HardNegative | None:
    """Remove a required input field to create an incomplete example."""
    if len(example.input) < 2:
        return None

    keys = list(example.input.keys())
    drop_key = rng.choice(keys)
    partial = {k: v for k, v in example.input.items() if k != drop_key}

    return HardNegative(
        input=partial,
        expected_output=example.output,
        plausible_wrong={"error": "incomplete_input", "missing": drop_key},
        confusion_reason=f"Removed input field '{drop_key}'",
        source="augmented",
    )


def ambiguous_rephrase(
    example: Example,
    pack: PackSpec,
    client: OllamaClient,
) -> HardNegative | None:
    """Use Ollama to rephrase input so it becomes ambiguous across labels."""
    if not pack.label_space or len(pack.label_space) < 2:
        return None

    correct_label = None
    for v in example.output.values():
        if isinstance(v, str) and v in pack.label_space:
            correct_label = v
            break

    if correct_label is None:
        return None

    other_labels = [lb for lb in pack.label_space if lb != correct_label]
    decoy = random.choice(other_labels)

    prompt = (
        f"Rephrase this input so it could plausibly match EITHER "
        f"'{correct_label}' OR '{decoy}':\n\n"
        f"Original input: {json.dumps(example.input)}\n\n"
        f"Return only a JSON object with the same keys as the original input, "
        f"but with rephrased values that are ambiguous between the two labels."
    )

    try:
        response = client.generate(prompt=prompt, json_mode=True, temperature=0.9)
        data = json.loads(response.strip())
        return HardNegative(
            input=data,
            expected_output=example.output,
            plausible_wrong={**example.output, next(
                k for k, v in example.output.items()
                if isinstance(v, str) and v in pack.label_space
            ): decoy},
            confusion_reason=f"Ambiguous rephrase between '{correct_label}' and '{decoy}'",
            source="synthetic",
        )
    except Exception:
        logger.debug("Ambiguous rephrase failed", exc_info=True)
        return None


STRATEGY_MAP = {
    "swap_label": swap_label,
    "partial_input": partial_input,
    "ambiguous_rephrase": ambiguous_rephrase,
}


def mutate_examples(
    pack: PackSpec,
    count: int = 50,
    strategies: list[str] | None = None,
    client: OllamaClient | None = None,
    seed: int = 42,
) -> list[HardNegative]:
    """Generate hard negatives from existing examples."""
    rng = random.Random(seed)
    strategies = strategies or ["swap_label", "partial_input"]
    negatives: list[HardNegative] = []

    if not pack.examples:
        return negatives

    for i in range(count * 3):  # Over-generate, then trim
        if len(negatives) >= count:
            break

        example = rng.choice(pack.examples)
        strategy_name = rng.choice(strategies)

        result: HardNegative | None = None
        if strategy_name == "swap_label":
            result = swap_label(example, pack, rng)
        elif strategy_name == "partial_input":
            result = partial_input(example, rng)
        elif strategy_name == "ambiguous_rephrase" and client:
            result = ambiguous_rephrase(example, pack, client)

        if result:
            negatives.append(result)

    logger.info("Generated %d/%d hard negatives", len(negatives), count)
    return negatives


class MutateStage:
    """Foundry stage: generate hard negatives from existing examples."""

    name = "mutate"

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec:
        config = config or {}
        count = config.get("count", 50)
        strategies = config.get("strategies", ["swap_label", "partial_input"])
        seed = config.get("seed", 42)

        client = None
        if "ambiguous_rephrase" in strategies:
            model = config.get("model", pack.generation_config.get("ollama_model", "qwen2.5:7b"))
            client = OllamaClient(model=model)

        negatives = mutate_examples(
            pack, count=count, strategies=strategies, client=client, seed=seed
        )

        all_negatives = list(pack.hard_negatives) + negatives
        return pack.model_copy(update={"hard_negatives": all_negatives})
