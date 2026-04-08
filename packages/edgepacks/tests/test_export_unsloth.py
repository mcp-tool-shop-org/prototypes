"""Tests for Unsloth exporter."""

import json

from edgepacks.export.unsloth import UnslothExporter
from edgepacks.schema.pack import PackSpec


class TestUnslothExporter:
    def test_sharegpt_format(self, sample_pack: PackSpec, tmp_path):
        exporter = UnslothExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        first_line = path.read_text().strip().split("\n")[0]
        data = json.loads(first_line)
        assert "conversations" in data
        convs = data["conversations"]
        assert len(convs) == 3
        assert convs[0]["from"] == "system"
        assert convs[1]["from"] == "human"
        assert convs[2]["from"] == "gpt"
