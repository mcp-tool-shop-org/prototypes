"""Main training function — the core of TinyTrainer."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from tinytrainer.data.prepare import prepare_dataset
from tinytrainer.models import get_model
from tinytrainer.schema.config import TrainConfig
from tinytrainer.schema.result import TrainResult
from tinytrainer.training.early_stopping import EarlyStopping
from tinytrainer.training.metrics import MetricsAccumulator

if TYPE_CHECKING:
    from tinytrainer.backbone.embedder import SentenceEmbedder

logger = logging.getLogger(__name__)


def _make_optimizer(model: nn.Module, config: TrainConfig) -> torch.optim.Optimizer:
    if config.optimizer == "adam":
        return torch.optim.Adam(model.parameters(), lr=config.learning_rate)
    return torch.optim.SGD(model.parameters(), lr=config.learning_rate)


def _train_epoch(
    model: nn.Module,
    loader: DataLoader,
    optimizer: torch.optim.Optimizer,
    criterion: nn.Module,
    device: str,
) -> float:
    model.train()
    total_loss = 0.0
    n_batches = 0
    for embeddings, labels in loader:
        embeddings = embeddings.to(device)
        labels = labels.to(device)
        optimizer.zero_grad()
        logits = model(embeddings)
        loss = criterion(logits, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        n_batches += 1
    return total_loss / max(n_batches, 1)


def _eval_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: str,
) -> tuple[float, float]:
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0
    n_batches = 0
    with torch.no_grad():
        for embeddings, labels in loader:
            embeddings = embeddings.to(device)
            labels = labels.to(device)
            logits = model(embeddings)
            loss = criterion(logits, labels)
            total_loss += loss.item()
            preds = logits.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            n_batches += 1
    avg_loss = total_loss / max(n_batches, 1)
    accuracy = correct / max(total, 1)
    return avg_loss, accuracy


def train_model(
    config: TrainConfig,
    texts: list[str],
    labels: list[str],
    embedder: SentenceEmbedder,
    output_dir: Path = Path("./model"),
    val_texts: list[str] | None = None,
    val_labels: list[str] | None = None,
    label_space: list[str] | None = None,
) -> TrainResult:
    """Full training pipeline.

    1. Encode labels
    2. Embed texts (one-time, backbone is frozen)
    3. Split if no val set provided
    4. Train with early stopping
    5. Save best checkpoint
    """
    torch.manual_seed(config.seed)
    np.random.seed(config.seed)
    device = config.device

    # Build label space from all data (train + val) to avoid unknown labels
    all_labels = list(labels)
    if val_labels:
        all_labels.extend(val_labels)
    effective_space = label_space or sorted(set(all_labels))

    # Prepare datasets
    train_ds, label_encoder = prepare_dataset(
        texts, labels, embedder, label_space=effective_space
    )

    if val_texts and val_labels:
        val_ds, _ = prepare_dataset(val_texts, val_labels, embedder, label_encoder=label_encoder)
    else:
        # Split train into train/val (85/15)
        n = len(train_ds)
        n_val = max(1, int(n * 0.15))
        n_train = n - n_val
        train_ds, val_ds = torch.utils.data.random_split(train_ds, [n_train, n_val])

    train_loader = DataLoader(train_ds, batch_size=config.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=config.batch_size, shuffle=False)

    # Create model
    model = get_model(
        head_type=config.head_type,
        input_dim=embedder.embedding_dim,
        num_labels=label_encoder.num_labels,
        mlp_hidden=config.mlp_hidden,
    )
    model.to(device)

    optimizer = _make_optimizer(model, config)
    criterion = nn.CrossEntropyLoss()
    stopper = EarlyStopping(patience=config.patience)
    metrics = MetricsAccumulator()

    best_state = None
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    for epoch in range(config.max_epochs):
        train_loss = _train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = _eval_epoch(model, val_loader, criterion, device)
        metrics.update(epoch, train_loss, val_loss, val_acc)

        logger.info(
            "Epoch %d: train_loss=%.4f val_loss=%.4f val_acc=%.3f",
            epoch, train_loss, val_loss, val_acc,
        )

        if val_loss <= stopper.best_loss:
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        if stopper.step(val_loss, epoch):
            logger.info("Early stopping at epoch %d", epoch)
            break

    # Save best model
    if best_state:
        torch.save(best_state, output_dir / "model.pt")

    # Save config and metadata
    with open(output_dir / "config.json", "w") as f:
        json.dump(config.model_dump(mode="json"), f, indent=2)

    with open(output_dir / "label_map.json", "w") as f:
        json.dump(label_encoder.label_map, f, indent=2)

    summary = metrics.summary()
    result = TrainResult(
        model_dir=output_dir,
        epochs_run=summary.get("epochs", 0),
        best_epoch=stopper.best_epoch,
        best_val_loss=stopper.best_loss,
        train_losses=metrics.train_losses,
        val_losses=metrics.val_losses,
        label_map=label_encoder.label_map,
    )

    with open(output_dir / "train_result.json", "w") as f:
        json.dump(result.model_dump(mode="json"), f, indent=2, default=str)

    logger.info(
        "Training complete: %d epochs, best_val_loss=%.4f (epoch %d)",
        result.epochs_run, result.best_val_loss, result.best_epoch,
    )
    return result
