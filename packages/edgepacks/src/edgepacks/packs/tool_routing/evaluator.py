"""Evaluation logic for tool-routing pack."""

from typing import Any


def evaluate_tool_routing(predicted: dict[str, Any], expected: dict[str, Any]) -> dict[str, float]:
    """Evaluate a tool-routing prediction.

    Returns dict with:
        tool_accuracy: 1.0 if exact match, 0.0 otherwise
        args_f1: F1 score on argument keys
        combined: weighted combination
    """
    tool_match = 1.0 if predicted.get("tool") == expected.get("tool") else 0.0

    pred_args = set(predicted.get("args", {}).keys())
    exp_args = set(expected.get("args", {}).keys())

    if not exp_args:
        args_f1 = 1.0 if not pred_args else 0.0
    else:
        tp = len(pred_args & exp_args)
        precision = tp / len(pred_args) if pred_args else 0.0
        recall = tp / len(exp_args)
        args_f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    combined = 0.7 * tool_match + 0.3 * args_f1

    return {
        "tool_accuracy": tool_match,
        "args_f1": args_f1,
        "combined": combined,
    }
