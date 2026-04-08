"""Evaluation logic for structured-extraction pack."""

from typing import Any


def evaluate_extraction(
    predicted: dict[str, Any], expected: dict[str, Any]
) -> dict[str, float]:
    """Evaluate a structured extraction prediction.

    Returns dict with:
        field_recall: fraction of expected fields correctly extracted
        field_precision: fraction of predicted fields that are correct
        f1: harmonic mean of precision and recall
        confidence_error: abs(predicted_confidence - actual_accuracy)
    """
    pred_ext = predicted.get("extracted", {})
    exp_ext = expected.get("extracted", {})

    # Handle list-type extractions (config)
    if isinstance(exp_ext, list):
        exp_keys = {item.get("key") for item in exp_ext if isinstance(item, dict)}
        pred_keys = {
            item.get("key")
            for item in (pred_ext if isinstance(pred_ext, list) else [])
            if isinstance(item, dict)
        }
    elif isinstance(exp_ext, dict):
        exp_keys = set(exp_ext.keys())
        pred_keys = set(pred_ext.keys()) if isinstance(pred_ext, dict) else set()
    else:
        return {"field_recall": 0.0, "field_precision": 0.0, "f1": 0.0, "confidence_error": 1.0}

    if not exp_keys:
        recall = 1.0
        precision = 1.0 if not pred_keys else 0.0
    else:
        tp = len(pred_keys & exp_keys)
        recall = tp / len(exp_keys)
        precision = tp / len(pred_keys) if pred_keys else 0.0

    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    # Confidence calibration
    pred_conf = predicted.get("confidence", 0.5)
    confidence_error = abs(pred_conf - f1)

    return {
        "field_recall": recall,
        "field_precision": precision,
        "f1": f1,
        "confidence_error": confidence_error,
    }
