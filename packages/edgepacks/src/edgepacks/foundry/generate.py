"""Synthetic example generation via Ollama."""

from __future__ import annotations

import json
import logging
from typing import Any

from edgepacks.foundry.ollama_client import OllamaClient
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec

logger = logging.getLogger(__name__)


def _default_system_prompt(pack: PackSpec) -> str:
    """Build a system prompt from the pack spec."""
    parts = [
        f"You are a training data generator for the task: {pack.task_type}.",
        f"Task description: {pack.description}",
        "",
        "You must generate diverse, realistic examples that match the required schemas.",
        "",
        f"Input schema: {json.dumps(pack.input_schema, indent=2)}",
        f"Output schema: {json.dumps(pack.output_schema, indent=2)}",
    ]
    if pack.label_space:
        parts.append(f"\nValid labels: {pack.label_space}")
    parts.append(
        "\nRespond with a JSON object containing 'input' and 'output' keys "
        "that conform to the schemas above. Nothing else."
    )
    return "\n".join(parts)


def _expand_prompt(seed: Example, pack: PackSpec) -> str:
    """Create a generation prompt from a seed example."""
    return (
        f"Here is an example of the task:\n"
        f"Input: {json.dumps(seed.input)}\n"
        f"Output: {json.dumps(seed.output)}\n\n"
        f"Generate a NEW, different example for the same task. "
        f"The input should be realistic and diverse. "
        f"The output must be correct for the input you generate. "
        f"Respond with only a JSON object containing 'input' and 'output' keys."
    )


def _parse_response(text: str) -> Example | None:
    """Parse Ollama response into an Example, or None on failure."""
    try:
        # Try to extract JSON from response
        text = text.strip()
        if "```" in text:
            # Extract from code block
            start = text.index("```") + 3
            if text[start:].startswith("json"):
                start = text.index("\n", start) + 1
            end = text.index("```", start)
            text = text[start:end].strip()

        data = json.loads(text)
        if "input" not in data or "output" not in data:
            return None
        return Example(
            input=data["input"],
            output=data["output"],
            source="synthetic",
            metadata={"generator": "ollama"},
        )
    except (json.JSONDecodeError, ValueError, KeyError):
        logger.debug("Failed to parse generation response: %s", text[:200])
        return None


def generate_examples(
    pack: PackSpec,
    count: int = 100,
    client: OllamaClient | None = None,
    temperature: float = 0.8,
) -> list[Example]:
    """Generate synthetic examples using Ollama.

    Uses seed examples from the pack as few-shot prompts. Cycles through
    seeds to maintain diversity.
    """
    if client is None:
        model = pack.generation_config.get("ollama_model", "qwen2.5:7b")
        client = OllamaClient(model=model)

    if not client.health():
        logger.error("Ollama is not reachable. Start Ollama first.")
        return []

    seeds = pack.examples
    if not seeds:
        logger.error("No seed examples to generate from")
        return []

    system = pack.generation_config.get("system_prompt") or _default_system_prompt(pack)
    generated: list[Example] = []
    failures = 0
    max_failures = count * 2  # Stop if too many failures

    for i in range(count + max_failures):
        if len(generated) >= count:
            break
        if failures >= max_failures:
            logger.warning("Too many generation failures (%d), stopping", failures)
            break

        seed = seeds[i % len(seeds)]
        prompt = _expand_prompt(seed, pack)

        try:
            response = client.generate(
                prompt=prompt,
                system=system,
                temperature=temperature,
                json_mode=True,
            )
            example = _parse_response(response)
            if example:
                generated.append(example)
            else:
                failures += 1
        except Exception:
            logger.debug("Generation call failed", exc_info=True)
            failures += 1

    logger.info("Generated %d/%d examples (%d failures)", len(generated), count, failures)
    return generated


class GenerateStage:
    """Foundry stage: generate synthetic examples via Ollama."""

    name = "generate"

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec:
        config = config or {}
        count = config.get("count", 100)
        model = config.get("model", pack.generation_config.get("ollama_model", "qwen2.5:7b"))
        temperature = config.get("temperature", 0.8)

        client = OllamaClient(model=model)
        new_examples = generate_examples(
            pack, count=count, client=client, temperature=temperature
        )

        all_examples = list(pack.examples) + new_examples
        return pack.model_copy(update={"examples": all_examples})
