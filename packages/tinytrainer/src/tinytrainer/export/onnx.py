"""PyTorch → ONNX export for classifier heads."""

from __future__ import annotations

import logging
from pathlib import Path

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


def export_to_onnx(
    model: nn.Module,
    input_dim: int,
    output_path: Path,
    opset_version: int = 17,
) -> Path:
    """Export classifier head to ONNX.

    Input: (batch, embedding_dim) float32
    Output: (batch, num_labels) float32 logits
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    model.eval()
    dummy_input = torch.randn(1, input_dim)

    torch.onnx.export(
        model,
        dummy_input,
        str(output_path),
        opset_version=opset_version,
        input_names=["embeddings"],
        output_names=["logits"],
        dynamic_axes={
            "embeddings": {0: "batch_size"},
            "logits": {0: "batch_size"},
        },
    )

    logger.info("Exported ONNX model to %s", output_path)
    return output_path
