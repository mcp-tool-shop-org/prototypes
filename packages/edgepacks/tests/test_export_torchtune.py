"""Tests for torchtune exporter."""

import json

from edgepacks.export.torchtune import TorchtuneExporter
from edgepacks.schema.pack import PackSpec


class TestTorchtuneExporter:
    def test_dialogue_format(self, sample_pack: PackSpec, tmp_path):
        exporter = TorchtuneExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        first_line = path.read_text().strip().split("\n")[0]
        data = json.loads(first_line)
        assert "dialogue" in data
        dialogue = data["dialogue"]
        assert len(dialogue) == 3
        assert dialogue[0]["role"] == "system"
        assert dialogue[1]["role"] == "user"
        assert dialogue[2]["role"] == "assistant"
