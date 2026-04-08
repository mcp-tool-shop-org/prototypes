"""Tests for JSONL exporter."""

import json

from edgepacks.export.jsonl import JsonlExporter
from edgepacks.schema.pack import PackSpec


class TestJsonlExporter:
    def test_export_creates_file(self, sample_pack: PackSpec, tmp_path):
        exporter = JsonlExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        assert path.exists()
        assert path.name == "train.jsonl"

    def test_export_correct_count(self, sample_pack: PackSpec, tmp_path):
        exporter = JsonlExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        lines = path.read_text().strip().split("\n")
        assert len(lines) == len(sample_pack.examples)

    def test_export_valid_json(self, sample_pack: PackSpec, tmp_path):
        exporter = JsonlExporter()
        path = exporter.export(sample_pack, sample_pack.examples, tmp_path, "train")
        for line in path.read_text().strip().split("\n"):
            data = json.loads(line)
            assert "instruction" in data
            assert "input" in data
            assert "output" in data
