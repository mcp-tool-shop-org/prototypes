"""Run evaluation against an edgepacks pack's eval protocol."""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from pathlib import Path

import torch

from tinytrainer.backbone.embedder import SentenceEmbedder
from tinytrainer.data.loader import load_from_pack
from tinytrainer.data.prepare import LabelEncoder
from tinytrainer.models import get_model
from tinytrainer.schema.config import HeadType, TrainConfig
from tinytrainer.schema.result import EvalResult

logger = logging.getLogger(__name__)


def run_eval(
    model_dir: Path,
    pack_name: str,
    split: str = "test",
    device: str = "cpu",
) -> EvalResult:
    """Evaluate a trained model against a pack's eval protocol.

    1. Load model and config from model_dir
    2. Load test examples from pack
    3. Embed and predict
    4. Compute metrics from pack's eval_protocol
    5. Return EvalResult with per-class breakdown
    """
    model_dir = Path(model_dir)

    # Load config and label map
    with open(model_dir / "config.json") as f:
        config = TrainConfig.model_validate(json.load(f))
    with open(model_dir / "label_map.json") as f:
        label_map: dict[str, int] = json.load(f)

    # Load pack
    from edgepacks.packs import discover_packs

    packs = discover_packs()
    if pack_name not in packs:
        msg = f"Pack '{pack_name}' not found"
        raise ValueError(msg)

    pack = packs[pack_name]
    spec = pack.spec()

    # Load test data
    texts, labels = load_from_pack(pack_name, split=split, label_field=config.label_field)
    if not texts:
        return EvalResult(pack_name=pack_name, num_examples=0, passed=False)

    # Embed
    embedder = SentenceEmbedder(config.backbone)
    embeddings = embedder.embed(texts)

    # Build label encoder from saved map
    label_encoder = LabelEncoder()
    label_encoder._label_to_idx = label_map
    label_encoder._idx_to_label = {v: k for k, v in label_map.items()}

    # Load model
    model = get_model(
        head_type=HeadType(config.head_type),
        input_dim=embedder.embedding_dim,
        num_labels=label_encoder.num_labels,
        mlp_hidden=config.mlp_hidden,
    )
    model.load_state_dict(torch.load(model_dir / "model.pt", weights_only=True))
    model.to(device)
    model.eval()

    # Predict
    with torch.no_grad():
        input_tensor = torch.from_numpy(embeddings).float().to(device)
        logits = model(input_tensor)
        preds = logits.argmax(dim=1).cpu().numpy()

    pred_labels = [label_encoder.decode(int(p)) for p in preds]

    # Compute per-class metrics
    per_class: dict[str, dict[str, float]] = {}
    tp_map: dict[str, int] = defaultdict(int)
    fp_map: dict[str, int] = defaultdict(int)
    fn_map: dict[str, int] = defaultdict(int)

    for pred, true in zip(pred_labels, labels):
        if pred == true:
            tp_map[true] += 1
        else:
            fp_map[pred] += 1
            fn_map[true] += 1

    all_labels = sorted(set(labels) | set(pred_labels))
    for label in all_labels:
        tp = tp_map[label]
        fp = fp_map[label]
        fn = fn_map[label]
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        per_class[label] = {"precision": precision, "recall": recall, "f1": f1}

    # Overall metrics
    correct = sum(1 for p, t in zip(pred_labels, labels) if p == t)
    accuracy = correct / len(labels) if labels else 0.0

    metrics = {"accuracy": accuracy}
    macro_f1 = sum(c["f1"] for c in per_class.values()) / max(len(per_class), 1)
    metrics["macro_f1"] = macro_f1

    # Check thresholds from pack eval protocol
    threshold_report = []
    all_passed = True
    for metric_spec in spec.eval_protocol.metrics:
        actual = metrics.get(metric_spec.name, 0.0)
        passed = actual >= metric_spec.threshold
        if not passed:
            all_passed = False
        threshold_report.append({
            "metric": metric_spec.name,
            "threshold": metric_spec.threshold,
            "actual": actual,
            "passed": passed,
        })

    return EvalResult(
        pack_name=pack_name,
        metrics=metrics,
        per_class=per_class,
        num_examples=len(labels),
        passed=all_passed,
        threshold_report=threshold_report,
    )
