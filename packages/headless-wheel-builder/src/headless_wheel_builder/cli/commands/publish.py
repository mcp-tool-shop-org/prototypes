"""Publish command implementation for Headless Wheel Builder CLI.

This module handles the 'publish' command which uploads Python wheels
and source distributions to PyPI or compatible registries.
"""

from __future__ import annotations

import asyncio
from collections.abc import Coroutine  # noqa: TC003
from pathlib import Path  # noqa: TC003
from typing import Any, TypeVar

from rich.console import Console

from headless_wheel_builder.publish.base import PublishConfig, PublishResult
from headless_wheel_builder.publish.pypi import PyPIConfig, PyPIPublisher, RepositoryType

console = Console()
error_console = Console(stderr=True)

T = TypeVar("T")


def run_async(coro: Coroutine[Any, Any, T]) -> T:
    """Run an async function synchronously."""
    return asyncio.run(coro)


async def execute_publish(
    files: list[Path],
    repository: RepositoryType,
    repository_url: str | None,
    token: str | None,
    skip_existing: bool,
    dry_run: bool,
    attestations: bool,
    verbose: bool,
) -> PublishResult:
    """Execute the publish operation.

    Args:
        files: Wheel/sdist files to publish
        repository: Target repository (pypi, testpypi, custom)
        repository_url: Custom repository URL
        token: API token
        skip_existing: Skip already-published versions
        dry_run: Validate without uploading
        attestations: Enable PEP 740 attestations
        verbose: Verbose output

    Returns:
        PublishResult with status and any errors
    """
    pypi_config = PyPIConfig(
        repository=repository,
        repository_url=repository_url,
        token=token,
        attestations=attestations,
    )
    publisher = PyPIPublisher(pypi_config)

    publish_config = PublishConfig(
        files=files,
        skip_existing=skip_existing,
        dry_run=dry_run,
        verbose=verbose,
    )

    return await publisher.publish(publish_config)


def print_publish_result(result: PublishResult, verbose: bool) -> None:
    """Print publish results to console.

    Args:
        result: PublishResult from the publisher
        verbose: Show detailed output
    """
    from rich.panel import Panel
    from rich.table import Table

    if result.success or result.files_published:
        table = Table(title="Publish Summary", show_header=True, header_style="bold cyan")
        table.add_column("File", style="green")
        table.add_column("Status", justify="center")
        table.add_column("URL")

        for i, path in enumerate(result.files_published):
            url = result.urls[i] if i < len(result.urls) else ""
            table.add_row(path.name, "[green]published[/]", url)

        for path in result.files_skipped:
            table.add_row(path.name, "[yellow]skipped[/]", "")

        for path in result.files_failed:
            table.add_row(path.name, "[red]failed[/]", "")

        console.print(Panel(table, title="Publish Complete"))

    if result.errors and verbose:
        for error in result.errors:
            if "[DRY RUN]" in error:
                console.print(f"[cyan]{error}[/]")
            else:
                error_console.print(f"[yellow]{error}[/]")
