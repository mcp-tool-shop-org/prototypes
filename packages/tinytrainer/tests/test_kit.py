"""Tests for training kit packaging."""

import zipfile

from tinytrainer.export.kit import package_kit, read_kit_manifest
from tinytrainer.export.onnx import export_to_onnx
from tinytrainer.models.classifier import ClassifierHead
from tinytrainer.schema.config import HeadType
from tinytrainer.schema.kit import TokenizerRef


class TestKit:
    def test_package_creates_zip(self, trained_model_dir, tmp_path):
        tok_ref = TokenizerRef(model_name="mock", embedding_dim=16, max_seq_length=128)
        kit_path = tmp_path / "test.kit.zip"
        package_kit(trained_model_dir, kit_path, tok_ref)
        assert kit_path.exists()

    def test_kit_contains_required_files(self, trained_model_dir, tmp_path):
        tok_ref = TokenizerRef(model_name="mock", embedding_dim=16, max_seq_length=128)
        kit_path = tmp_path / "test.kit.zip"
        package_kit(trained_model_dir, kit_path, tok_ref)

        with zipfile.ZipFile(kit_path) as zf:
            names = zf.namelist()
            assert "manifest.json" in names
            assert "config.json" in names
            assert "label_map.json" in names
            assert "recipe.json" in names
            assert "tokenizer_ref.json" in names

    def test_kit_with_onnx(self, trained_model_dir, tmp_path):
        head = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)
        onnx_path = export_to_onnx(head, 16, tmp_path / "model.onnx")

        tok_ref = TokenizerRef(model_name="mock", embedding_dim=16, max_seq_length=128)
        kit_path = tmp_path / "test.kit.zip"
        package_kit(
            trained_model_dir, kit_path, tok_ref,
            export_paths={"onnx": onnx_path},
        )

        with zipfile.ZipFile(kit_path) as zf:
            assert "model.onnx" in zf.namelist()

    def test_read_manifest(self, trained_model_dir, tmp_path):
        tok_ref = TokenizerRef(model_name="mock", embedding_dim=16, max_seq_length=128)
        kit_path = tmp_path / "test.kit.zip"
        package_kit(trained_model_dir, kit_path, tok_ref)

        manifest = read_kit_manifest(kit_path)
        assert manifest.task_type == "classification"
        assert manifest.num_labels == 3
        assert "cat_a" in manifest.label_space
