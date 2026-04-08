"""CLI — typer app with all commands."""

from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from edgepacks import __version__
from edgepacks.errors import EdgepacksError, PackNotFoundError
from edgepacks.export.base import ExportFormat, get_exporter, get_split_examples
from edgepacks.foundry.balance import BalanceStage, analyze_balance
from edgepacks.foundry.deduplicate import DeduplicateStage
from edgepacks.foundry.generate import GenerateStage
from edgepacks.foundry.mutate import MutateStage
from edgepacks.foundry.pipeline import Pipeline
from edgepacks.foundry.split import SplitStage
from edgepacks.foundry.validate import ValidateStage
from edgepacks.packs import discover_packs

app = typer.Typer(
    name="edgepacks",
    help="Task-dataset foundry for training small models on narrow jobs.",
    no_args_is_help=True,
)
console = Console()
_debug = False


def version_callback(value: bool) -> None:
    if value:
        console.print(f"edgepacks {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: bool | None = typer.Option(  # noqa: UP007
        None, "--version", "-v", callback=version_callback, is_eager=True,
        help="Show version and exit.",
    ),
    debug: bool = typer.Option(False, "--debug", help="Show full tracebacks on error."),
) -> None:
    """edgepacks — task-dataset foundry."""
    global _debug  # noqa: PLW0603
    _debug = debug
    if debug:
        import logging

        logging.basicConfig(level=logging.DEBUG)


def _get_pack(pack_name: str) -> object:
    """Resolve a pack by name or exit with structured error."""
    packs = discover_packs()
    if pack_name not in packs:
        err = PackNotFoundError(pack_name, list(packs.keys()))
        console.print(f"[red]{err.message}[/red]")
        if err.hint:
            console.print(f"[dim]{err.hint}[/dim]")
        raise typer.Exit(1)
    return packs[pack_name]


def _handle_error(err: Exception) -> None:
    """Print a structured error and exit."""
    if isinstance(err, EdgepacksError):
        console.print(f"[red]{err.code}: {err.message}[/red]")
        if err.hint:
            console.print(f"[dim]Hint: {err.hint}[/dim]")
    else:
        console.print(f"[red]Error: {err}[/red]")
    if _debug:
        traceback.print_exc(file=sys.stderr)
    raise typer.Exit(2)


@app.command()
def list_packs() -> None:
    """List all available dataset packs."""
    packs = discover_packs()
    table = Table(title="Available Packs")
    table.add_column("Name", style="cyan")
    table.add_column("Task", style="green")
    table.add_column("Examples", justify="right")
    table.add_column("Labels", justify="right")
    table.add_column("Description")

    for name, pack_obj in sorted(packs.items()):
        spec = pack_obj.spec()
        label_count = str(len(spec.label_space)) if spec.label_space else "-"
        table.add_row(
            name,
            spec.task_type,
            str(len(spec.examples)),
            label_count,
            spec.description[:60] + "..." if len(spec.description) > 60 else spec.description,
        )

    console.print(table)


@app.command()
def info(pack_name: str = typer.Argument(help="Pack name")) -> None:
    """Show detailed information about a pack."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()

    console.print(f"\n[bold cyan]{spec.name}[/bold cyan] v{spec.version}")
    console.print(f"[dim]{spec.description}[/dim]\n")

    table = Table(show_header=False, box=None)
    table.add_column("Field", style="bold")
    table.add_column("Value")
    table.add_row("Task type", spec.task_type)
    table.add_row("Generation mode", spec.generation_mode.value)
    table.add_row("Seed examples", str(len(spec.examples)))
    table.add_row("Hard negatives", str(len(spec.hard_negatives)))
    table.add_row("Labels", str(len(spec.label_space)) if spec.label_space else "N/A")
    table.add_row("Min examples", str(spec.min_examples))
    table.add_row("Target examples", str(spec.target_examples))
    table.add_row("License", spec.license)
    table.add_row("Recommended models", ", ".join(spec.recommended_model_classes) or "Any")
    console.print(table)

    if spec.label_space:
        console.print(f"\n[bold]Label space[/bold] ({len(spec.label_space)}):")
        for label in spec.label_space:
            console.print(f"  - {label}")

    console.print(f"\n[bold]Eval protocol:[/bold] {spec.eval_protocol.description}")
    for metric in spec.eval_protocol.metrics:
        console.print(f"  - {metric.name}: threshold={metric.threshold}, weight={metric.weight}")


@app.command()
def preview(
    pack_name: str = typer.Argument(help="Pack name"),
    n: int = typer.Option(3, "--n", "-n", help="Number of examples to show"),
) -> None:
    """Show sample examples from a pack."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()
    examples = spec.examples[:n]

    for i, ex in enumerate(examples, 1):
        console.print(f"\n[bold]Example {i}[/bold]")
        console.print(f"  [cyan]Input:[/cyan]  {json.dumps(ex.input, indent=2)}")
        console.print(f"  [green]Output:[/green] {json.dumps(ex.output, indent=2)}")
        if ex.source != "curated":
            console.print(f"  [dim]Source: {ex.source}[/dim]")


@app.command()
def generate(
    pack_name: str = typer.Argument(help="Pack name"),
    count: int = typer.Option(100, "--count", "-c", help="Examples to generate"),
    model: str = typer.Option("qwen2.5:7b", "--model", "-m", help="Ollama model"),
    temperature: float = typer.Option(0.8, "--temperature", "-t"),
    output: Path = typer.Option("./output", "--output", "-o", help="Output directory"),
    seed: int = typer.Option(42, "--seed", "-s"),
) -> None:
    """Generate synthetic examples using Ollama."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()
    stage = GenerateStage()
    config = {"count": count, "model": model, "temperature": temperature, "seed": seed}

    try:
        with console.status(f"Generating {count} examples..."):
            result = stage(spec, config)
    except EdgepacksError as e:
        _handle_error(e)

    new_count = len(result.examples) - len(spec.examples)
    console.print(f"[green]Generated {new_count} new examples[/green]")

    # Save intermediate result
    output.mkdir(parents=True, exist_ok=True)
    out_path = output / f"{pack_name}_generated.json"
    with open(out_path, "w") as f:
        json.dump(result.model_dump(mode="json"), f, indent=2)
    console.print(f"Saved to {out_path}")


@app.command()
def mutate(
    pack_name: str = typer.Argument(help="Pack name"),
    count: int = typer.Option(50, "--count", "-c", help="Hard negatives to generate"),
    strategies: str = typer.Option(
        "swap_label,partial_input", "--strategies", help="Comma-separated strategies"
    ),
    model: str = typer.Option("qwen2.5:7b", "--model", "-m"),
) -> None:
    """Generate hard negatives from existing examples."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()
    stage = MutateStage()
    config = {"count": count, "strategies": strategies.split(","), "model": model}

    try:
        with console.status(f"Generating {count} hard negatives..."):
            result = stage(spec, config)
    except EdgepacksError as e:
        _handle_error(e)

    new_count = len(result.hard_negatives) - len(spec.hard_negatives)
    console.print(f"[green]Generated {new_count} hard negatives[/green]")


@app.command()
def validate(
    pack_name: str = typer.Argument(help="Pack name"),
    strict: bool = typer.Option(False, "--strict", help="Fail on any warning"),
) -> None:
    """Validate pack data quality."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()
    stage = ValidateStage()
    result = stage(spec)

    passed = len(result.examples)
    total = len(spec.examples)
    console.print(f"Validation: {passed}/{total} examples passed")

    if passed < total:
        console.print(f"[yellow]Removed {total - passed} invalid examples[/yellow]")

    if strict and passed < total:
        raise typer.Exit(1)


@app.command()
def build(
    pack_name: str = typer.Argument(help="Pack name"),
    count: int = typer.Option(100, "--count", "-c", help="Target example count"),
    model: str = typer.Option("qwen2.5:7b", "--model", "-m", help="Ollama model"),
    output: Path = typer.Option("./output", "--output", "-o", help="Output directory"),
    seed: int = typer.Option(42, "--seed", "-s"),
    skip_generate: bool = typer.Option(False, "--skip-generate", help="Skip Ollama generation"),
) -> None:
    """Full pipeline: generate + mutate + validate + dedup + split + balance."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()

    pipeline = Pipeline()
    if not skip_generate:
        pipeline.add(GenerateStage())
        pipeline.add(MutateStage())
    pipeline.add(ValidateStage())
    pipeline.add(DeduplicateStage())
    pipeline.add(SplitStage())
    pipeline.add(BalanceStage())

    config = {"count": count, "model": model, "seed": seed, "skip_fuzzy": True}

    console.print(f"[bold]Building {pack_name}[/bold]")
    console.print(f"Pipeline: {pipeline}")

    def on_stage(name: str, _pack: object) -> None:
        console.print(f"  [green]done[/green] {name}")

    try:
        result = pipeline.run(spec, config=config, on_stage_complete=on_stage)
    except EdgepacksError as e:
        _handle_error(e)

    output.mkdir(parents=True, exist_ok=True)
    out_path = output / f"{pack_name}_built.json"
    with open(out_path, "w") as f:
        json.dump(result.model_dump(mode="json"), f, indent=2)

    console.print("\n[bold green]Build complete[/bold green]")
    console.print(f"  Examples: {len(result.examples)}")
    console.print(f"  Hard negatives: {len(result.hard_negatives)}")
    console.print(f"  Saved to: {out_path}")


@app.command()
def export(
    pack_name: str = typer.Argument(help="Pack name"),
    fmt: ExportFormat = typer.Option(ExportFormat.JSONL, "--format", "-f", help="Export format"),
    output: Path = typer.Option("./export", "--output", "-o", help="Output directory"),
    split: str = typer.Option("all", "--split", help="Split: train, val, test, or all"),
) -> None:
    """Export pack data for training."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()
    exporter = get_exporter(fmt)

    if split == "all":
        splits = ["train", "val", "test"]
    else:
        splits = [split]

    for split_name in splits:
        examples = get_split_examples(spec, split_name)
        if not examples:
            console.print(f"[yellow]No examples for split '{split_name}'[/yellow]")
            continue

        out_dir = output / fmt.value
        path = exporter.export(spec, examples, out_dir, split_name)
        console.print(f"[green]Exported[/green] {len(examples)} examples \u2192 {path}")


@app.command()
def stats(pack_name: str = typer.Argument(help="Pack name")) -> None:
    """Show label balance, token stats, and split sizes."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()
    report = analyze_balance(spec)

    console.print(f"\n[bold]{spec.name}[/bold] \u2014 {len(spec.examples)} examples\n")

    if report.label_counts:
        table = Table(title="Label Distribution")
        table.add_column("Label", style="cyan")
        table.add_column("Count", justify="right")
        table.add_column("Pct", justify="right")

        for label, count in sorted(report.label_counts.items(), key=lambda x: -x[1]):
            pct = f"{count / report.total * 100:.1f}%" if report.total > 0 else "0%"
            style = ""
            if label in report.underrepresented:
                style = "yellow"
            elif label in report.overrepresented:
                style = "red"
            table.add_row(label, str(count), pct, style=style)

        console.print(table)
        console.print(f"\nBalance ratio: {report.balance_ratio:.2f} (1.0 = perfect)")
    else:
        console.print("[dim]No label distribution data (no label_space defined)[/dim]")


@app.command()
def check_leakage(pack_name: str = typer.Argument(help="Pack name")) -> None:
    """Check for data leakage between splits."""
    pack_obj = _get_pack(pack_name)
    spec = pack_obj.spec()

    from edgepacks.foundry.split import check_leakage as _check
    from edgepacks.foundry.split import split_examples

    result = split_examples(
        spec.examples,
        train_ratio=spec.split_config.train_ratio,
        val_ratio=spec.split_config.val_ratio,
        seed=spec.split_config.seed,
    )
    _, leaks = _check(result)

    if leaks > 0:
        console.print(f"[red]Found {leaks} leaked examples between splits[/red]")
        raise typer.Exit(1)
    else:
        console.print("[green]No leakage detected[/green]")
