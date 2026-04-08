"""Tests for tool-routing pack."""

import pytest

from edgepacks.packs.tool_routing import ToolRoutingPack
from edgepacks.packs.tool_routing.evaluator import evaluate_tool_routing
from edgepacks.packs.tool_routing.tools import TOOL_NAMES, TOOLS


@pytest.mark.pack
class TestToolRoutingPack:
    def test_spec_valid(self):
        pack = ToolRoutingPack()
        spec = pack.spec()
        assert spec.name == "tool-routing"
        assert spec.task_type == "classification"
        assert len(spec.examples) == 20
        assert spec.label_space == TOOL_NAMES

    def test_seed_examples_cover_all_tools(self):
        pack = ToolRoutingPack()
        spec = pack.spec()
        tools_in_examples = {ex.output["tool"] for ex in spec.examples}
        assert tools_in_examples == set(TOOL_NAMES)

    def test_tools_have_required_fields(self):
        for tool in TOOLS:
            assert "name" in tool
            assert "description" in tool
            assert "args_schema" in tool


@pytest.mark.pack
class TestToolRoutingEvaluator:
    def test_exact_match(self):
        scores = evaluate_tool_routing(
            {"tool": "web_search", "args": {"query": "test"}},
            {"tool": "web_search", "args": {"query": "test"}},
        )
        assert scores["tool_accuracy"] == 1.0
        assert scores["args_f1"] == 1.0

    def test_wrong_tool(self):
        scores = evaluate_tool_routing(
            {"tool": "read_file", "args": {}},
            {"tool": "web_search", "args": {"query": "test"}},
        )
        assert scores["tool_accuracy"] == 0.0

    def test_partial_args(self):
        scores = evaluate_tool_routing(
            {"tool": "web_search", "args": {"query": "test"}},
            {"tool": "web_search", "args": {"query": "test", "max_results": 5}},
        )
        assert scores["tool_accuracy"] == 1.0
        assert 0.0 < scores["args_f1"] < 1.0
