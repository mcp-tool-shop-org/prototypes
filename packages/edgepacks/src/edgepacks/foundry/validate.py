"""Row-level and set-level validation for dataset packs."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import jsonschema

from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec, QualityCheck

logger = logging.getLogger(__name__)


@dataclass
class ValidationReport:
    """Results of validating a pack's examples."""

    total: int = 0
    passed: int = 0
    failed: int = 0
    rejection_reasons: dict[str, int] = field(default_factory=dict)
    set_level_warnings: list[str] = field(default_factory=list)

    @property
    def pass_rate(self) -> float:
        return self.passed / self.total if self.total > 0 else 0.0


def _check_schema(example: Example, pack: PackSpec) -> list[str]:
    """Validate input/output against pack schemas."""
    errors = []
    try:
        jsonschema.validate(example.input, pack.input_schema)
    except jsonschema.ValidationError as e:
        errors.append(f"input_schema: {e.message}")
    try:
        jsonschema.validate(example.output, pack.output_schema)
    except jsonschema.ValidationError as e:
        errors.append(f"output_schema: {e.message}")
    return errors


def _check_nonempty(data: dict[str, Any], label: str) -> list[str]:
    """Check that at least one value in the dict is non-empty."""
    for v in data.values():
        if v is not None and v != "" and v != [] and v != {}:
            return []
    return [f"{label}: all values are empty"]


def _check_label_in_space(example: Example, pack: PackSpec) -> list[str]:
    """Check that output labels are in the pack's label space."""
    if pack.label_space is None:
        return []
    label_val = example.output.get("label") or example.output.get("tool") or None
    if label_val is None:
        # Try first string value in output
        for v in example.output.values():
            if isinstance(v, str):
                label_val = v
                break
    if label_val is not None and label_val not in pack.label_space:
        return [f"label_in_space: '{label_val}' not in label_space"]
    return []


def validate_example(example: Example, pack: PackSpec) -> list[str]:
    """Run all configured quality checks on a single example. Returns list of errors."""
    errors: list[str] = []
    checks = pack.quality_checks

    if QualityCheck.SCHEMA_VALID in checks:
        errors.extend(_check_schema(example, pack))
    if QualityCheck.INPUT_NONEMPTY in checks:
        errors.extend(_check_nonempty(example.input, "input"))
    if QualityCheck.OUTPUT_NONEMPTY in checks:
        errors.extend(_check_nonempty(example.output, "output"))
    if QualityCheck.LABEL_IN_SPACE in checks:
        errors.extend(_check_label_in_space(example, pack))

    return errors


def validate_set(pack: PackSpec) -> list[str]:
    """Run set-level checks on the pack. Returns list of warnings."""
    warnings: list[str] = []
    count = len(pack.examples)

    if count < pack.min_examples:
        warnings.append(
            f"Only {count} examples, minimum is {pack.min_examples}"
        )

    if pack.label_space:
        seen_labels: set[str] = set()
        for ex in pack.examples:
            for v in ex.output.values():
                if isinstance(v, str) and v in pack.label_space:
                    seen_labels.add(v)
        missing = set(pack.label_space) - seen_labels
        if missing:
            warnings.append(f"Labels with no examples: {sorted(missing)}")

    return warnings


class ValidateStage:
    """Foundry stage: validate examples and remove failures."""

    name = "validate"

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec:
        report = ValidationReport(total=len(pack.examples))
        kept: list[Example] = []

        for ex in pack.examples:
            errors = validate_example(ex, pack)
            if errors:
                report.failed += 1
                for err in errors:
                    report.rejection_reasons[err] = report.rejection_reasons.get(err, 0) + 1
                logger.debug("Rejected example: %s", errors)
            else:
                report.passed += 1
                kept.append(ex)

        report.set_level_warnings = validate_set(pack)

        logger.info(
            "Validation: %d/%d passed (%.1f%%), %d warnings",
            report.passed,
            report.total,
            report.pass_rate * 100,
            len(report.set_level_warnings),
        )

        return pack.model_copy(update={"examples": kept})
