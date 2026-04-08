"""Tests for ONNX export."""

import numpy as np
import onnx
import onnxruntime as ort

from tinytrainer.export.onnx import export_to_onnx
from tinytrainer.models.classifier import ClassifierHead
from tinytrainer.schema.config import HeadType


class TestOnnxExport:
    def test_export_creates_file(self, tmp_path):
        head = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)
        path = export_to_onnx(head, 16, tmp_path / "model.onnx")
        assert path.exists()
        assert path.stat().st_size > 0

    def test_export_valid_onnx(self, tmp_path):
        head = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)
        path = export_to_onnx(head, 16, tmp_path / "model.onnx")
        model = onnx.load(str(path))
        onnx.checker.check_model(model)

    def test_export_correct_io(self, tmp_path):
        head = ClassifierHead(input_dim=16, num_labels=4, head_type=HeadType.MLP, mlp_hidden=32)
        path = export_to_onnx(head, 16, tmp_path / "model.onnx")

        session = ort.InferenceSession(str(path))
        dummy = np.random.randn(3, 16).astype(np.float32)
        outputs = session.run(None, {"embeddings": dummy})
        assert outputs[0].shape == (3, 4)
