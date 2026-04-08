"""Tests for foundry validation stage."""

from edgepacks.foundry.validate import ValidateStage, validate_example, validate_set
from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec


class TestValidateExample:
    def test_valid_example(self, sample_pack: PackSpec):
        ex = sample_pack.examples[0]
        errors = validate_example(ex, sample_pack)
        assert errors == []

    def test_invalid_schema(self, sample_pack: PackSpec):
        ex = Example(
            input={"wrong_field": "value"},
            output={"tool": "tool_0", "args": {}},
        )
        errors = validate_example(ex, sample_pack)
        assert any("input_schema" in e for e in errors)

    def test_empty_input(self, sample_pack: PackSpec):
        ex = Example(
            input={"request": ""},
            output={"tool": "tool_0", "args": {}},
        )
        errors = validate_example(ex, sample_pack)
        assert any("input" in e for e in errors)

    def test_label_not_in_space(self, sample_pack: PackSpec):
        ex = Example(
            input={"request": "test"},
            output={"tool": "nonexistent_tool", "args": {}},
        )
        errors = validate_example(ex, sample_pack)
        assert any("label_in_space" in e for e in errors)


class TestValidateSet:
    def test_sufficient_examples(self, sample_pack: PackSpec):
        warnings = validate_set(sample_pack)
        assert not any("Only" in w for w in warnings)

    def test_insufficient_examples(self, sample_pack: PackSpec):
        pack = sample_pack.model_copy(update={"min_examples": 1000})
        warnings = validate_set(pack)
        assert any("Only" in w for w in warnings)


class TestValidateStage:
    def test_removes_invalid(self, sample_pack: PackSpec):
        bad_ex = Example(
            input={"wrong": "field"},
            output={"tool": "tool_0", "args": {}},
        )
        pack = sample_pack.model_copy(
            update={"examples": list(sample_pack.examples) + [bad_ex]}
        )
        stage = ValidateStage()
        result = stage(pack)
        assert len(result.examples) == len(sample_pack.examples)

    def test_keeps_valid(self, sample_pack: PackSpec):
        stage = ValidateStage()
        result = stage(sample_pack)
        assert len(result.examples) == len(sample_pack.examples)
