"""CLI — typer app with all commands."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from tinytrainer import __version__
from tinytrainer.schema.config import BackboneChoice, ExportFormat, HeadType, TrainConfig

app = typer.Typer(
    name="tinytrainer",
    help="Desktop training foundry + mobile personalization export pipeline.",
    no_args_is_help=True,
)
console = Console()


def _version_callback(value: bool) -> None:
    if value:
        console.print(f"tinytrainer {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: bool | None = typer.Option(
        None, "--version", "-v", callback=_version_callback, is_eager=True,
    ),
    debug: bool = typer.Option(False, "--debug", help="Show full stack traces on error"),
) -> None:
    """tinytrainer — desktop training + mobile export."""
    if debug:
        import tinytrainer.errors as err

        err.DEBUG_MODE = True


@app.command()
def train(
    pack: str | None = typer.Option(None, "--pack", "-p", help="edgepacks pack name"),
    data: Path | None = typer.Option(None, "--data", "-d", help="JSONL data file"),
    output: Path = typer.Option(Path("./model"), "--output", "-o"),
    backbone: BackboneChoice = typer.Option(BackboneChoice.MINILM_L6, "--backbone", "-b"),
    head: HeadType = typer.Option(HeadType.LINEAR, "--head"),
    lr: float = typer.Option(1e-3, "--lr"),
    epochs: int = typer.Option(50, "--epochs"),
    patience: int = typer.Option(5, "--patience"),
    batch_size: int = typer.Option(32, "--batch-size"),
    seed: int = typer.Option(42, "--seed"),
    label_field: str | None = typer.Option(None, "--label-field"),
) -> None:
    """Train a classifier from an edgepacks pack or JSONL data."""
    if not pack and not data:
        console.print("[red]Provide --pack or --data[/red]")
        raise typer.Exit(1)

    from tinytrainer.backbone.embedder import SentenceEmbedder
    from tinytrainer.training.loop import train_model

    config = TrainConfig(
        backbone=backbone,
        head_type=head,
        learning_rate=lr,
        batch_size=batch_size,
        max_epochs=epochs,
        patience=patience,
        seed=seed,
        label_field=label_field,
    )

    # Load data
    if pack:
        from tinytrainer.data.loader import load_from_pack

        texts, labels = load_from_pack(pack, split="train", label_field=label_field)
        val_texts, val_labels = load_from_pack(pack, split="val", label_field=label_field)
        if not val_texts:
            val_texts, val_labels = None, None

        # Get label space from pack
        from edgepacks.packs import discover_packs

        label_space = discover_packs()[pack].spec().label_space
    else:
        from tinytrainer.data.loader import load_from_jsonl

        texts, labels = load_from_jsonl(data)
        val_texts, val_labels = None, None
        label_space = None

    if not texts:
        console.print("[red]No training data loaded[/red]")
        raise typer.Exit(1)

    console.print(f"[bold]Training[/bold]: {len(texts)} examples, backbone={backbone}")

    with console.status("Loading backbone..."):
        embedder = SentenceEmbedder(backbone)

    result = train_model(
        config=config,
        texts=texts,
        labels=labels,
        embedder=embedder,
        output_dir=output,
        val_texts=val_texts,
        val_labels=val_labels,
        label_space=label_space,
    )

    console.print("\n[bold green]Training complete[/bold green]")
    console.print(f"  Epochs: {result.epochs_run}")
    console.print(f"  Best val loss: {result.best_val_loss:.4f} (epoch {result.best_epoch})")
    console.print(f"  Labels: {list(result.label_map.keys())}")
    console.print(f"  Saved to: {result.model_dir}")


@app.command(name="eval")
def eval_cmd(
    model: Path = typer.Argument(help="Model directory"),
    pack: str = typer.Option(..., "--pack", "-p", help="Pack name for eval"),
    split: str = typer.Option("test", "--split"),
) -> None:
    """Evaluate a trained model against a pack's eval protocol."""
    from tinytrainer.eval.report import print_eval_report
    from tinytrainer.eval.runner import run_eval

    with console.status("Evaluating..."):
        result = run_eval(model, pack, split=split)

    print_eval_report(result, console)
    if not result.passed:
        raise typer.Exit(1)


@app.command()
def export(
    model: Path = typer.Argument(help="Model directory"),
    fmt: ExportFormat = typer.Option(ExportFormat.ONNX, "--format", "-f"),
    output: Path = typer.Option(Path("./export"), "--output", "-o"),
    updatable: bool = typer.Option(True, "--updatable/--no-updatable"),
) -> None:
    """Export trained model to ONNX or Core ML."""
    import torch

    from tinytrainer.models import get_model
    from tinytrainer.schema.config import HeadType

    with open(model / "config.json") as f:
        config = TrainConfig.model_validate(json.load(f))
    with open(model / "label_map.json") as f:
        label_map = json.load(f)

    from tinytrainer.schema.config import BACKBONE_DIMS

    input_dim = BACKBONE_DIMS.get(config.backbone, 384)

    head = get_model(
        head_type=HeadType(config.head_type),
        input_dim=input_dim,
        num_labels=len(label_map),
        mlp_hidden=config.mlp_hidden,
    )
    head.load_state_dict(torch.load(model / "model.pt", weights_only=True))

    output.mkdir(parents=True, exist_ok=True)

    if fmt == ExportFormat.ONNX:
        from tinytrainer.export.onnx import export_to_onnx

        path = export_to_onnx(head, input_dim, output / "model.onnx")
        console.print(f"[green]Exported ONNX[/green] → {path}")

    elif fmt == ExportFormat.COREML:
        # Need ONNX first as intermediate
        from tinytrainer.export.coreml import export_to_coreml
        from tinytrainer.export.onnx import export_to_onnx

        onnx_path = output / "model.onnx"
        export_to_onnx(head, input_dim, onnx_path)
        coreml_path = export_to_coreml(
            onnx_path, output / "model.mlpackage", label_map, mark_updatable=updatable,
        )
        console.print(f"[green]Exported Core ML[/green] → {coreml_path}")


@app.command()
def kit(
    model: Path = typer.Argument(help="Model directory"),
    output: Path = typer.Option(Path("./model.kit.zip"), "--output", "-o"),
    formats: str = typer.Option("onnx", "--formats", help="Comma-separated: onnx,coreml"),
    pack_name: str | None = typer.Option(None, "--pack"),
) -> None:
    """Package model + exports into a .kit.zip training kit."""
    import torch

    from tinytrainer.export.kit import package_kit
    from tinytrainer.models import get_model
    from tinytrainer.schema.config import BACKBONE_DIMS, HeadType

    with open(model / "config.json") as f:
        config = TrainConfig.model_validate(json.load(f))
    with open(model / "label_map.json") as f:
        label_map = json.load(f)

    input_dim = BACKBONE_DIMS.get(config.backbone, 384)
    head = get_model(
        head_type=HeadType(config.head_type),
        input_dim=input_dim,
        num_labels=len(label_map),
        mlp_hidden=config.mlp_hidden,
    )
    head.load_state_dict(torch.load(model / "model.pt", weights_only=True))

    # Export to requested formats
    export_paths: dict[str, Path] = {}
    export_dir = model / "_kit_export"
    export_dir.mkdir(exist_ok=True)

    for fmt in formats.split(","):
        fmt = fmt.strip()
        if fmt == "onnx":
            from tinytrainer.export.onnx import export_to_onnx

            path = export_to_onnx(head, input_dim, export_dir / "model.onnx")
            export_paths["onnx"] = path

    # Get tokenizer ref (without downloading model if possible)
    from tinytrainer.schema.kit import TokenizerRef

    tok_ref = TokenizerRef(
        model_name=config.backbone,
        embedding_dim=input_dim,
        max_seq_length=256,
    )

    path = package_kit(
        model_dir=model,
        output_path=output,
        tokenizer_ref=tok_ref,
        export_paths=export_paths,
        pack_name=pack_name,
    )
    console.print(f"[green]Packaged kit[/green] → {path}")


@app.command()
def info(kit_path: Path = typer.Argument(help="Path to .kit.zip")) -> None:
    """Show training kit contents and metadata."""
    from tinytrainer.export.kit import read_kit_manifest

    manifest = read_kit_manifest(kit_path)

    console.print(f"\n[bold cyan]Training Kit[/bold cyan]: {kit_path.name}")
    table = Table(show_header=False, box=None)
    table.add_column("Field", style="bold")
    table.add_column("Value")
    table.add_row("Task", manifest.task_type)
    table.add_row("Labels", ", ".join(manifest.label_space))
    table.add_row("Num labels", str(manifest.num_labels))
    table.add_row("Backbone", manifest.backbone)
    table.add_row("Head", manifest.head_type)
    table.add_row("Trained", str(manifest.trained_at)[:19])
    table.add_row("Pack", manifest.pack_name or "N/A")
    table.add_row("Targets", ", ".join(manifest.device_targets) or "N/A")
    console.print(table)

    if manifest.eval_scores:
        console.print("\n[bold]Eval Scores[/bold]")
        for name, score in manifest.eval_scores.items():
            console.print(f"  {name}: {score:.4f}")

    # Show zip contents
    with zipfile.ZipFile(kit_path) as zf:
        console.print(f"\n[bold]Contents[/bold] ({len(zf.namelist())} files)")
        for name in sorted(zf.namelist()):
            info_obj = zf.getinfo(name)
            size = info_obj.file_size
            console.print(f"  {name} ({size:,} bytes)")


@app.command()
def list_models() -> None:
    """Show available backbones and head architectures."""
    from tinytrainer.schema.config import BACKBONE_DIMS

    console.print("\n[bold]Backbones[/bold]")
    for name, dim in BACKBONE_DIMS.items():
        console.print(f"  {name} ({dim}-dim)")

    console.print("\n[bold]Head Types[/bold]")
    console.print("  linear — single nn.Linear layer (~1.5KB exported)")
    console.print("  mlp — Linear → ReLU → Dropout → Linear (~50KB exported)")
