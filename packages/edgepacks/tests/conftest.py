"""Shared fixtures for edgepacks tests."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

from edgepacks.schema.eval_protocol import EvalMetric, EvalProtocol
from edgepacks.schema.example import Example
from edgepacks.schema.pack import GenerationMode, PackSpec, QualityCheck
from edgepacks.schema.splits import SplitConfig


@pytest.fixture()
def sample_examples() -> list[Example]:
    """Minimal set of valid examples for testing."""
    return [
        Example(
            input={"request": f"Do task {i}"},
            output={"tool": f"tool_{i % 3}", "args": {"x": i}},
            source="curated",
        )
        for i in range(20)
    ]


@pytest.fixture()
def sample_pack(sample_examples: list[Example]) -> PackSpec:
    """Minimal valid PackSpec for testing."""
    return PackSpec(
        name="test-pack",
        description="A test pack",
        task_type="classification",
        input_schema={
            "type": "object",
            "properties": {"request": {"type": "string"}},
            "required": ["request"],
        },
        output_schema={
            "type": "object",
            "properties": {
                "tool": {"type": "string"},
                "args": {"type": "object"},
            },
            "required": ["tool", "args"],
        },
        instruction_template="Select the right tool for: {request}",
        label_space=["tool_0", "tool_1", "tool_2"],
        generation_mode=GenerationMode.CURATED,
        quality_checks=[
            QualityCheck.SCHEMA_VALID,
            QualityCheck.INPUT_NONEMPTY,
            QualityCheck.OUTPUT_NONEMPTY,
            QualityCheck.LABEL_IN_SPACE,
        ],
        eval_protocol=EvalProtocol(
            metrics=[EvalMetric(name="accuracy", threshold=0.8)],
        ),
        split_config=SplitConfig(train_ratio=0.7, val_ratio=0.15, test_ratio=0.15),
        examples=sample_examples,
        min_examples=5,
        target_examples=100,
    )


@pytest.fixture()
def mock_ollama(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Replace OllamaClient with a mock that returns canned responses."""
    import json

    mock_client = MagicMock()
    mock_client.health.return_value = True
    mock_client.generate.return_value = json.dumps({
        "input": {"request": "Generated task"},
        "output": {"tool": "tool_0", "args": {"x": 99}},
    })
    mock_client.chat.return_value = json.dumps({
        "input": {"request": "Generated task"},
        "output": {"tool": "tool_1", "args": {"y": 42}},
    })

    return mock_client
