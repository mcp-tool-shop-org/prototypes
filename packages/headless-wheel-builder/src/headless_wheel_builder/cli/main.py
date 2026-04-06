"""CLI entry point for Headless Wheel Builder.

This module provides the main command-line interface using Click.
Actual command logic is delegated to focused modules in the commands package.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import TYPE_CHECKING, cast

import click
from rich.console import Console

from headless_wheel_builder import __version__
from headless_wheel_builder.actions.cli import actions as actions_group
from headless_wheel_builder.cache.cli import cache as cache_group
from headless_wheel_builder.changelog.cli import changelog as changelog_group
from headless_wheel_builder.cli.commands import (
    execute_build,
    execute_inspect,
    run_async,
    validate_build_options,
)
from headless_wheel_builder.cli.commands.publish import (
    execute_publish,
    print_publish_result,
)
from headless_wheel_builder.depgraph.cli import deps as deps_group
from headless_wheel_builder.exceptions import EXIT_RUNTIME, HWBError
from headless_wheel_builder.github.cli import github as github_group
from headless_wheel_builder.metrics.cli import metrics as metrics_group
from headless_wheel_builder.multirepo.cli import multirepo as multirepo_group
from headless_wheel_builder.notify.cli import notify as notify_group
from headless_wheel_builder.pipeline.cli import pipeline as pipeline_group
from headless_wheel_builder.release.cli import release as release_group
from headless_wheel_builder.security.cli import security as security_group

if TYPE_CHECKING:
    from headless_wheel_builder.publish.pypi import RepositoryType

console = Console()
error_console = Console(stderr=True)


@click.group()
@click.version_option(__version__, prog_name="hwb")
@click.option("-v", "--verbose", count=True, help="Increase verbosity")
@click.option("-q", "--quiet", is_flag=True, help="Suppress non-error output")
@click.option("--json", "json_output", is_flag=True, help="Output in JSON format")
@click.option("--no-color", is_flag=True, help="Disable colored output")
@click.pass_context
def cli(
    ctx: click.Context,
    verbose: int,
    quiet: bool,
    json_output: bool,
    no_color: bool,
) -> None:
    """Headless Wheel Builder - Build Python wheels anywhere."""
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose
    ctx.obj["quiet"] = quiet
    ctx.obj["json"] = json_output
    ctx.obj["no_color"] = no_color

    if no_color:
        console.no_color = True


@cli.command()
@click.argument("source", default=".")
@click.option("-o", "--output", "output_dir", default="dist", help="Output directory")
@click.option("--python", default="3.12", help="Python version to use")
@click.option("--wheel/--no-wheel", default=True, help="Build wheel")
@click.option("--sdist/--no-sdist", default=False, help="Build source distribution")
@click.option("--clean", is_flag=True, help="Clean output directory before building")
@click.option(
    "--isolation",
    type=click.Choice(["auto", "venv", "docker", "none"]),
    default="auto",
    help="Build isolation strategy",
)
@click.option(
    "-C",
    "--config-setting",
    multiple=True,
    help="Pass config setting to build backend",
)
@click.option(
    "--platform",
    type=click.Choice(["auto", "manylinux", "musllinux"]),
    default="auto",
    help="Docker platform (only with --isolation docker)",
)
@click.option(
    "--docker-image",
    default=None,
    help="Specific Docker image to use (overrides --platform)",
)
@click.option(
    "--arch",
    type=click.Choice(["x86_64", "aarch64", "i686"]),
    default="x86_64",
    help="Target architecture for Docker builds",
)
@click.option(
    "--no-deps",
    is_flag=True,
    help="Don't install build dependencies (requires pre-installed)",
)
@click.pass_context
def build(
    ctx: click.Context,
    source: str,
    output_dir: str,
    python: str,
    wheel: bool,
    sdist: bool,
    clean: bool,
    isolation: str,
    config_setting: tuple[str, ...],
    platform: str,
    docker_image: str | None,
    arch: str,
    no_deps: bool,
) -> None:
    """Build wheels from a Python project.

    SOURCE is the project directory (default: current directory).
    """
    try:
        # Validate options
        validate_build_options(
            source=source,
            output_dir=output_dir,
            python=python,
            isolation=isolation,
            docker_image=docker_image,
            platform=platform,
        )

        # Execute build
        run_async(
            execute_build(
                source=source,
                output_dir=output_dir,
                python=python,
                wheel=wheel,
                sdist=sdist,
                clean=clean,
                isolation=isolation,
                config_settings=config_setting,
                platform=platform,
                docker_image=docker_image,
                arch=arch,
                no_deps=no_deps,
                verbose=ctx.obj.get("verbose", 0),
            )
        )
    except HWBError as e:
        error_console.print(f"[red]Error [{e.error_code}]: {e}[/red]")
        if e.hint:
            error_console.print(f"[yellow]Hint: {e.hint}[/yellow]")
        raise SystemExit(e.exit_code) from e
    except KeyboardInterrupt as e:
        error_console.print("\n[yellow]Build interrupted by user[/yellow]")
        raise SystemExit(130) from e


@cli.command()
@click.argument("source", default=".")
@click.option(
    "-f",
    "--format",
    "output_format",
    type=click.Choice(["text", "json", "table"]),
    default="text",
    help="Output format",
)
@click.option(
    "--check",
    is_flag=True,
    help="Only check for errors, don't print metadata",
)
@click.pass_context
def inspect(
    _ctx: click.Context,
    source: str,
    output_format: str,
    check: bool,
) -> None:
    """Inspect a Python project and display its metadata.

    SOURCE is the project directory (default: current directory).
    """
    try:
        run_async(execute_inspect(source, output_format, check))
    except HWBError as e:
        error_console.print(f"[red]Error [{e.error_code}]: {e}[/red]")
        if e.hint:
            error_console.print(f"[yellow]Hint: {e.hint}[/yellow]")
        raise SystemExit(e.exit_code) from e


@cli.command("version")
def version() -> None:
    """Show version information."""
    console.print(f"Headless Wheel Builder {__version__}")


@cli.command("images")
@click.option(
    "--check",
    is_flag=True,
    help="Check if images are available",
)
def list_images(check: bool) -> None:
    """List available Docker images for builds."""
    from headless_wheel_builder.isolation.docker_images import MANYLINUX_IMAGES

    if check:
        # Check image availability
        console.print("[cyan]Checking Docker image availability...[/cyan]")
        # This would require Docker to be running
        console.print("[yellow]Docker check requires Docker daemon running[/yellow]")
        return

    console.print("\n[bold cyan]Available Manylinux Images:[/bold cyan]")
    for key, url in sorted(MANYLINUX_IMAGES.items()):
        console.print(f"  {key:<30} {url}")


@cli.command("version-next")
@click.argument("current_version", required=False, default=None)
@click.option(
    "--part",
    type=click.Choice(["major", "minor", "patch"]),
    default=None,
    help="Version part to increment (manual mode)",
)
@click.option(
    "--path",
    "repo_path",
    type=click.Path(exists=True, path_type=Path),
    default=None,
    help="Git repository path (enables git-aware mode)",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="Show what would happen without making changes",
)
@click.option(
    "--json",
    "json_output",
    is_flag=True,
    help="Output as JSON",
)
def version_next(
    current_version: str | None,
    part: str | None,
    repo_path: Path | None,
    dry_run: bool,
    json_output: bool,
) -> None:
    """Calculate next version number.

    Two modes:

      Manual:  hwb version-next 1.0.0 --part minor

      Git-aware: hwb version-next --path .

    In git-aware mode, finds the latest version tag, parses Conventional
    Commits since that tag, and suggests the appropriate version bump.
    """
    if repo_path is not None:
        _version_next_git(repo_path, dry_run, json_output)
    elif current_version is not None:
        _version_next_manual(current_version, part or "patch", json_output)
    else:
        error_console.print("[red]Provide CURRENT_VERSION or --path <repo>[/red]")
        raise SystemExit(1)


def _version_next_manual(current_version: str, part: str, json_output: bool) -> None:
    """Manual version bump from explicit version + part."""
    from headless_wheel_builder.version.semver import parse_version

    try:
        current = parse_version(current_version)
    except Exception as e:
        error_console.print(f"[red]Invalid version: {current_version}[/red]")
        raise SystemExit(1) from e

    next_ver = current.bump(part)

    if json_output:
        import json

        click.echo(json.dumps({"current": str(current), "next": str(next_ver), "bump": part}))
    else:
        console.print(str(next_ver))


def _version_next_git(repo_path: Path, dry_run: bool, json_output: bool) -> None:
    """Git-aware version bump from Conventional Commits."""
    import asyncio
    import json as json_mod

    from headless_wheel_builder.version.conventional import (
        determine_bump_from_commits,
        format_commit,
        parse_commit,
    )
    from headless_wheel_builder.version.git import get_commits_since_tag, get_latest_tag

    async def _detect() -> dict:
        tag = await get_latest_tag(repo_path)

        if tag is None or tag.version is None:
            error_console.print("[red]No version tags found in repository[/red]")
            error_console.print("[yellow]Hint: Create a tag first, e.g. git tag v0.1.0[/yellow]")
            raise SystemExit(1)

        raw_commits = await get_commits_since_tag(repo_path, tag.name)

        if not raw_commits:
            error_console.print(f"[yellow]No commits since {tag.name}[/yellow]")
            raise SystemExit(0)

        commits = [parse_commit(msg, hash=h) for h, msg in raw_commits]
        bump = determine_bump_from_commits(commits)

        if bump is None:
            return {
                "current": str(tag.version),
                "tag": tag.name,
                "next": str(tag.version),
                "bump": None,
                "commits": len(commits),
                "reason": "No version-bumping commits found",
                "details": [format_commit(c) for c in commits],
            }

        next_ver = tag.version.bump(bump)
        return {
            "current": str(tag.version),
            "tag": tag.name,
            "next": str(next_ver),
            "bump": bump.value,
            "commits": len(commits),
            "details": [format_commit(c) for c in commits],
        }

    result = asyncio.run(_detect())

    if json_output:
        click.echo(json_mod.dumps(result, indent=2))
        return

    bump = result["bump"]
    if bump is None:
        console.print(f"[yellow]No bump needed[/yellow] (current: {result['current']})")
        if dry_run:
            for detail in result["details"]:
                console.print(f"  {detail}")
        return

    console.print(result["next"])

    if dry_run:
        console.print(f"\n[dim]Current:[/] {result['current']} ({result['tag']})")
        console.print(f"[dim]Bump:[/]    {bump}")
        console.print(f"[dim]Commits:[/] {result['commits']}")
        for detail in result["details"]:
            console.print(f"  {detail}")


@cli.command()
@click.argument("files", nargs=-1, required=True, type=click.Path(exists=True, path_type=Path))
@click.option(
    "--repository",
    "-r",
    type=click.Choice(["pypi", "testpypi", "custom"]),
    default="pypi",
    help="Target repository",
)
@click.option(
    "--repository-url",
    default=None,
    help="Custom repository URL (required with --repository custom)",
)
@click.option(
    "--token",
    envvar="PYPI_TOKEN",
    default=None,
    help="PyPI API token (or set PYPI_TOKEN env var)",
)
@click.option(
    "--skip-existing",
    is_flag=True,
    help="Don't fail if version already exists",
)
@click.option(
    "--dry-run",
    is_flag=True,
    help="Validate without uploading",
)
@click.option(
    "--attestations",
    is_flag=True,
    help="Enable PEP 740 build attestations",
)
@click.pass_context
def publish(
    ctx: click.Context,
    files: tuple[Path, ...],
    repository: str,
    repository_url: str | None,
    token: str | None,
    skip_existing: bool,
    dry_run: bool,
    attestations: bool,
) -> None:
    """Publish wheels and source distributions to PyPI.

    FILES are the wheel (.whl) and/or sdist (.tar.gz) files to upload.

    Examples:

        hwb publish dist/*.whl

        hwb publish dist/* --repository testpypi --dry-run

        hwb publish dist/*.whl --token pypi-AgEI...
    """
    try:
        if repository == "custom" and not repository_url:
            raise click.BadParameter(
                "Custom repository requires --repository-url",
                param_hint="repository-url",
            )

        verbose = ctx.obj.get("verbose", 0) > 0
        result = run_async(
            execute_publish(
                files=list(files),
                repository=cast("RepositoryType", repository),
                repository_url=repository_url,
                token=token,
                skip_existing=skip_existing,
                dry_run=dry_run,
                attestations=attestations,
                verbose=verbose,
            )
        )

        print_publish_result(result, verbose=verbose or dry_run)

        if not result.success:
            for error in result.errors:
                if "[DRY RUN]" not in error:
                    error_console.print(f"[red]{error}[/red]")
            raise SystemExit(1)

    except HWBError as e:
        error_console.print(f"[red]Error [{e.error_code}]: {e}[/red]")
        if e.hint:
            error_console.print(f"[yellow]Hint: {e.hint}[/yellow]")
        raise SystemExit(e.exit_code) from e
    except KeyboardInterrupt as e:
        error_console.print("\n[yellow]Publish interrupted by user[/yellow]")
        raise SystemExit(130) from e


# Add command groups
cli.add_command(actions_group)
cli.add_command(cache_group)
cli.add_command(changelog_group)
cli.add_command(deps_group)
cli.add_command(github_group)
cli.add_command(metrics_group)
cli.add_command(multirepo_group)
cli.add_command(notify_group)
cli.add_command(pipeline_group)
cli.add_command(release_group)
cli.add_command(security_group)


def main() -> None:
    """Main entry point."""
    try:
        cli(obj={})
    except (BrokenPipeError, KeyboardInterrupt):
        # Handle broken pipe (when output is piped) and Ctrl+C
        sys.exit(130 if isinstance(sys.exc_info()[1], KeyboardInterrupt) else 1)
    except HWBError as e:
        error_console.print(f"[red]Error [{e.error_code}]: {e}[/red]")
        if e.hint:
            error_console.print(f"[yellow]Hint: {e.hint}[/yellow]")
        if "-v" in sys.argv or "--verbose" in sys.argv:
            import traceback

            traceback.print_exc()
        sys.exit(e.exit_code)
    except Exception as e:
        error_console.print(f"[red]Error [RUNTIME_UNEXPECTED]: {e}[/red]")
        error_console.print("[yellow]Hint: Run with --verbose for details.[/yellow]")
        if "-v" in sys.argv or "--verbose" in sys.argv:
            import traceback

            traceback.print_exc()
        sys.exit(EXIT_RUNTIME)


if __name__ == "__main__":
    main()
