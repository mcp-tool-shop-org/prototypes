"""Label distribution analysis and optional resampling."""

from __future__ import annotations

import logging
from collections import Counter
from dataclasses import dataclass, field
from typing import Any

from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec

logger = logging.getLogger(__name__)


@dataclass
class BalanceReport:
    """Label distribution analysis results."""

    label_counts: dict[str, int] = field(default_factory=dict)
    total: int = 0
    underrepresented: list[str] = field(default_factory=list)
    overrepresented: list[str] = field(default_factory=list)
    balance_ratio: float = 0.0  # min_count / max_count


def _get_label(example: Example, label_space: list[str] | None) -> str | None:
    """Extract the label from an example's output."""
    if not label_space:
        return None
    for v in example.output.values():
        if isinstance(v, str) and v in label_space:
            return v
    return None


def analyze_balance(pack: PackSpec) -> BalanceReport:
    """Analyze label distribution across examples."""
    if not pack.label_space:
        return BalanceReport(total=len(pack.examples))

    counter: Counter[str] = Counter()
    for ex in pack.examples:
        label = _get_label(ex, pack.label_space)
        if label:
            counter[label] = counter.get(label, 0) + 1

    report = BalanceReport(
        label_counts=dict(counter),
        total=len(pack.examples),
    )

    if not counter:
        return report

    n_labels = len(pack.label_space)
    expected = report.total / n_labels if n_labels > 0 else 1
    low_threshold = expected * 0.5
    high_threshold = expected * 2.0

    for label in pack.label_space:
        count = counter.get(label, 0)
        if count < low_threshold:
            report.underrepresented.append(label)
        elif count > high_threshold:
            report.overrepresented.append(label)

    counts = list(counter.values())
    if counts:
        report.balance_ratio = min(counts) / max(counts) if max(counts) > 0 else 0.0

    return report


class BalanceStage:
    """Foundry stage: analyze and optionally rebalance label distribution."""

    name = "balance"

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec:
        report = analyze_balance(pack)

        if report.underrepresented:
            logger.warning("Underrepresented labels: %s", report.underrepresented)
        if report.overrepresented:
            logger.warning("Overrepresented labels: %s", report.overrepresented)

        logger.info(
            "Balance: %d labels, ratio=%.2f, %d under, %d over",
            len(report.label_counts),
            report.balance_ratio,
            len(report.underrepresented),
            len(report.overrepresented),
        )

        # Store balance report in generation_config for downstream use
        return pack.model_copy(
            update={
                "generation_config": {
                    **pack.generation_config,
                    "_balance_report": {
                        "label_counts": report.label_counts,
                        "balance_ratio": report.balance_ratio,
                        "underrepresented": report.underrepresented,
                        "overrepresented": report.overrepresented,
                    },
                }
            }
        )
