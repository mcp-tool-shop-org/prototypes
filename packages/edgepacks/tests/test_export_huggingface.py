"""Tests for HuggingFace exporter."""

import json

from edgepacks.export.huggingface import HuggingFaceExporter
from edgepacks.schema.pack import PackSpec


class TestHuggingFaceExporter:
    def test_export_creates_files(self, sample_pack: PackSpec, tmp_path):
        exporter = HuggingFaceExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        assert path.exists()
        assert (tmp_path / "dataset_info.json").exists()

    def test_messages_format(self, sample_pack: PackSpec, tmp_path):
        exporter = HuggingFaceExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        first_line = path.read_text().strip().split("\n")[0]
        data = json.loads(first_line)
        assert "messages" in data
        messages = data["messages"]
        assert len(messages) == 3
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"
        assert messages[2]["role"] == "assistant"
