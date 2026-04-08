"""Rich-formatted evaluation report."""

from __future__ import annotations

from rich.console import Console
from rich.table import Table

from tinytrainer.schema.result import EvalResult


def print_eval_report(result: EvalResult, console: Console | None = None) -> None:
    """Display a formatted eval report."""
    if console is None:
        console = Console()

    status = "[green]PASSED[/green]" if result.passed else "[red]FAILED[/red]"
    console.print(f"\n[bold]Eval: {result.pack_name}[/bold] — {status}")
    console.print(f"Examples: {result.num_examples}\n")

    # Overall metrics
    for name, value in result.metrics.items():
        console.print(f"  {name}: {value:.4f}")

    # Per-class table
    if result.per_class:
        table = Table(title="\nPer-Class Metrics")
        table.add_column("Label", style="cyan")
        table.add_column("Precision", justify="right")
        table.add_column("Recall", justify="right")
        table.add_column("F1", justify="right")

        for label, scores in sorted(result.per_class.items()):
            table.add_row(
                label,
                f"{scores['precision']:.3f}",
                f"{scores['recall']:.3f}",
                f"{scores['f1']:.3f}",
            )
        console.print(table)

    # Threshold report
    if result.threshold_report:
        console.print("\n[bold]Threshold Report[/bold]")
        for item in result.threshold_report:
            icon = "[green]pass[/green]" if item["passed"] else "[red]FAIL[/red]"
            console.print(
                f"  {icon} {item['metric']}: {item['actual']:.4f} "
                f"(threshold: {item['threshold']})"
            )
