"""Tests for training loop — tiny mock, 2-3 epochs, 16-dim."""

from tinytrainer.schema.config import TrainConfig
from tinytrainer.training.early_stopping import EarlyStopping
from tinytrainer.training.loop import train_model
from tinytrainer.training.metrics import MetricsAccumulator


class TestEarlyStopping:
    def test_stops_after_patience(self):
        es = EarlyStopping(patience=3)
        assert not es.step(1.0, 0)
        assert not es.step(0.9, 1)  # improvement
        assert not es.step(0.95, 2)  # worse (1)
        assert not es.step(0.95, 3)  # worse (2)
        assert es.step(0.95, 4)  # worse (3) → stop

    def test_resets_on_improvement(self):
        es = EarlyStopping(patience=2)
        es.step(1.0, 0)
        es.step(1.1, 1)  # worse (1)
        es.step(0.5, 2)  # improvement → reset
        assert not es.step(0.6, 3)  # worse (1)
        assert es.step(0.6, 4)  # worse (2) → stop

    def test_best_tracking(self):
        es = EarlyStopping(patience=5)
        es.step(1.0, 0)
        es.step(0.5, 1)
        es.step(0.8, 2)
        assert es.best_loss == 0.5
        assert es.best_epoch == 1


class TestMetrics:
    def test_accumulator(self):
        acc = MetricsAccumulator()
        acc.update(0, 1.0, 0.8, 0.7)
        acc.update(1, 0.5, 0.4, 0.85)
        assert len(acc.train_losses) == 2
        assert acc.best_val_loss == 0.4

    def test_summary(self):
        acc = MetricsAccumulator()
        acc.update(0, 1.0, 0.8, 0.7)
        acc.update(1, 0.5, 0.4, 0.85)
        summary = acc.summary()
        assert summary["best_epoch"] == 1
        assert summary["epochs"] == 2


class TestTrainModel:
    def test_trains_and_saves(self, mock_embedder, sample_texts_labels, tmp_path):
        texts, labels = sample_texts_labels
        config = TrainConfig(
            max_epochs=3, patience=2, batch_size=8, learning_rate=0.01, seed=42,
        )
        result = train_model(
            config=config,
            texts=texts,
            labels=labels,
            embedder=mock_embedder,
            output_dir=tmp_path / "model",
        )
        assert result.epochs_run > 0
        assert (tmp_path / "model" / "model.pt").exists()
        assert (tmp_path / "model" / "config.json").exists()
        assert (tmp_path / "model" / "label_map.json").exists()
        assert len(result.label_map) == 3

    def test_with_val_set(self, mock_embedder, sample_texts_labels, tmp_path):
        texts, labels = sample_texts_labels
        config = TrainConfig(max_epochs=2, patience=2, batch_size=8)
        result = train_model(
            config=config,
            texts=texts[:14],
            labels=labels[:14],
            embedder=mock_embedder,
            output_dir=tmp_path / "model",
            val_texts=texts[14:],
            val_labels=labels[14:],
        )
        assert result.epochs_run > 0
