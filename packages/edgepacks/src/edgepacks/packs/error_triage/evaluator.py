"""Evaluation logic for error-triage pack."""

from typing import Any


def evaluate_error_triage(
    predicted: dict[str, Any], expected: dict[str, Any]
) -> dict[str, float]:
    """Evaluate an error triage prediction.

    Returns dict with:
        category_accuracy: 1.0 if exact match, 0.0 otherwise
        severity_accuracy: 1.0 if exact match, 0.0 otherwise
        next_step_accuracy: 1.0 if exact match, 0.0 otherwise
        combined: weighted combination
    """
    cat_match = 1.0 if predicted.get("category") == expected.get("category") else 0.0
    sev_match = 1.0 if predicted.get("severity") == expected.get("severity") else 0.0
    step_match = 1.0 if predicted.get("next_step") == expected.get("next_step") else 0.0

    combined = 0.5 * cat_match + 0.3 * sev_match + 0.2 * step_match

    return {
        "category_accuracy": cat_match,
        "severity_accuracy": sev_match,
        "next_step_accuracy": step_match,
        "combined": combined,
    }
