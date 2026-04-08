"""Tests for data loading and preparation."""

import json
from pathlib import Path

import pytest

from tinytrainer.data.loader import load_from_jsonl
from tinytrainer.data.prepare import LabelEncoder, prepare_dataset


class TestLabelEncoder:
    def test_fit_and_encode(self):
        enc = LabelEncoder()
        enc.fit(["cat", "dog", "bird"])
        assert enc.num_labels == 3
        assert enc.encode("cat") != enc.encode("dog")

    def test_decode(self):
        enc = LabelEncoder()
        enc.fit(["a", "b", "c"])
        for label in ["a", "b", "c"]:
            assert enc.decode(enc.encode(label)) == label

    def test_unknown_label_raises(self):
        enc = LabelEncoder()
        enc.fit(["a", "b"])
        with pytest.raises(ValueError, match="Unknown label"):
            enc.encode("z")

    def test_fit_with_space(self):
        enc = LabelEncoder()
        enc.fit_with_space(["a", "b"], ["a", "b", "c", "d"])
        assert enc.num_labels == 4

    def test_encode_batch(self):
        enc = LabelEncoder()
        enc.fit(["x", "y"])
        batch = enc.encode_batch(["x", "y", "x"])
        assert len(batch) == 3


class TestLoadFromJsonl:
    def test_load(self, tmp_path: Path):
        data = [
            {"text": "hello", "label": "greeting"},
            {"text": "bye", "label": "farewell"},
        ]
        path = tmp_path / "data.jsonl"
        with open(path, "w") as f:
            for item in data:
                f.write(json.dumps(item) + "\n")

        texts, labels = load_from_jsonl(path)
        assert texts == ["hello", "bye"]
        assert labels == ["greeting", "farewell"]

    def test_missing_field(self, tmp_path: Path):
        path = tmp_path / "bad.jsonl"
        with open(path, "w") as f:
            f.write('{"text": "hi"}\n')  # missing label

        texts, labels = load_from_jsonl(path)
        assert len(texts) == 0


class TestPrepareDataset:
    def test_prepare(self, mock_embedder, sample_texts_labels):
        texts, labels = sample_texts_labels
        ds, enc = prepare_dataset(texts, labels, mock_embedder)
        assert len(ds) == 20
        assert enc.num_labels == 3

    def test_with_label_space(self, mock_embedder, sample_texts_labels):
        texts, labels = sample_texts_labels
        ds, enc = prepare_dataset(
            texts, labels, mock_embedder, label_space=["cat_a", "cat_b", "cat_c", "cat_d"]
        )
        assert enc.num_labels == 4


class TestEmbeddingDataset:
    def test_getitem(self, mock_embedder, sample_texts_labels):
        texts, labels = sample_texts_labels
        ds, _ = prepare_dataset(texts, labels, mock_embedder)
        emb, label = ds[0]
        assert emb.shape == (16,)
        assert label.shape == ()
