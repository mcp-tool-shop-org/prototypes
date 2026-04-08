"""Tests for CLI commands."""

from typer.testing import CliRunner

from tinytrainer.cli import app
from tinytrainer.export.kit import package_kit
from tinytrainer.schema import config as cfg
from tinytrainer.schema.kit import TokenizerRef

runner = CliRunner()


class TestCLI:
    def test_version(self):
        result = runner.invoke(app, ["--version"])
        assert result.exit_code == 0
        assert "tinytrainer" in result.output

    def test_list_models(self):
        result = runner.invoke(app, ["list-models"])
        assert result.exit_code == 0
        assert "MiniLM" in result.output
        assert "linear" in result.output

    def test_info(self, trained_model_dir, tmp_path):
        tok_ref = TokenizerRef(model_name="mock", embedding_dim=16, max_seq_length=128)
        kit_path = tmp_path / "test.kit.zip"
        package_kit(trained_model_dir, kit_path, tok_ref)

        result = runner.invoke(app, ["info", str(kit_path)])
        assert result.exit_code == 0
        assert "classification" in result.output

    def test_train_requires_input(self):
        result = runner.invoke(app, ["train"])
        assert result.exit_code == 1

    def test_export_onnx(self, trained_model_dir, tmp_path):
        original = cfg.BACKBONE_DIMS.copy()
        cfg.BACKBONE_DIMS["all-MiniLM-L6-v2"] = 16

        try:
            result = runner.invoke(app, [
                "export", str(trained_model_dir),
                "--format", "onnx",
                "--output", str(tmp_path / "export"),
            ])
            assert result.exit_code == 0
            assert "ONNX" in result.output
        finally:
            cfg.BACKBONE_DIMS.update(original)
