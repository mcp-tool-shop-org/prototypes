---
title: Beginners Guide
description: New to Python packaging? Learn what wheels are, why they matter, and how to build your first one with Headless Wheel Builder.
sidebar:
  order: 99
---

This page is for developers who are new to Python packaging or have never built a wheel before. It covers the core concepts and walks through a real build from start to finish.

## What is a Python wheel?

A wheel is the standard binary distribution format for Python packages. When you run `pip install something`, pip downloads a `.whl` file (if one exists) and installs it directly -- no compilation step needed.

Wheels are ZIP archives with a `.whl` extension containing your code, metadata, and dependency declarations. They replaced the older `.egg` format and are defined by PEP 427.

Building wheels matters because it makes installation faster for your users, removes the need for a compiler on their machine, and ensures reproducible installs.

## What is Headless Wheel Builder?

Headless Wheel Builder (`hwb`) is a CLI tool that builds Python wheels from source and keeps going past the build step. It handles the entire lifecycle: build, inspect, draft a release, get approvals, publish to PyPI, and notify your team -- all from the command line or CI.

The "headless" part means it works without a browser or GUI. Every operation that would normally require clicking through GitHub or PyPI can be done from a terminal script.

## Prerequisites

Before you start, make sure you have:

- **Python 3.10 or later** installed and on your PATH. Check with `python --version`.
- **pip** or **uv** for installing packages. uv is recommended for speed but not required.
- **Git** installed (needed if you want to build from git URLs or use changelog generation).
- **A Python project** with a `pyproject.toml` file. If you do not have one yet, any project with a `setup.py` or `setup.cfg` will also work.

Optional:
- **Docker** if you want to build manylinux/musllinux wheels for maximum Linux compatibility.
- **A PyPI account** if you want to publish packages.

## Installation

Install from PyPI:

```bash
pip install headless-wheel-builder
```

Or with uv (faster):

```bash
uv pip install headless-wheel-builder
```

To include all optional features (notifications, security scanning, metrics, S3 publishing):

```bash
pip install headless-wheel-builder[all]
```

Verify the installation:

```bash
hwb --version
```

## Your first build

Navigate to a Python project that has a `pyproject.toml` and run:

```bash
hwb build .
```

This will:
1. Detect your project layout and build backend (hatchling, setuptools, flit, etc.)
2. Create an isolated build environment
3. Build a wheel into the `dist/` directory

You can inspect the result:

```bash
hwb inspect .
```

This shows your project metadata, dependencies, and entry points without opening any files manually.

### Building from a git URL

You do not need the source code on your machine. Build directly from a repository:

```bash
hwb build https://github.com/user/repo
```

Pin to a specific tag or branch:

```bash
hwb build https://github.com/user/repo@v1.0.0
hwb build https://github.com/user/repo@main
```

### Choosing a Python version

By default, hwb uses Python 3.12. To target a different version:

```bash
hwb build . --python 3.11
```

### Using Docker isolation

For maximum compatibility on Linux, build inside a manylinux container:

```bash
hwb build . --isolation docker
```

This ensures your wheel works across different Linux distributions. Docker must be running on your machine.

## Common workflows

### Build and publish

The most common workflow is build, then publish to PyPI:

```bash
# Build
hwb build .

# Publish (requires PYPI_TOKEN environment variable)
hwb publish dist/*.whl
```

For testing, publish to TestPyPI first:

```bash
hwb publish dist/*.whl --repository testpypi
```

Use `--dry-run` to validate everything without actually uploading:

```bash
hwb publish dist/*.whl --dry-run
```

### Build and release on GitHub

Create a GitHub release with your built wheel attached:

```bash
hwb build .
hwb github release v1.0.0 --repo owner/repo --files dist/*.whl
```

### Draft release with approval

For teams that need review before publishing:

```bash
# Create a draft
hwb release create -n "v1.0.0 Release" -v 1.0.0 -p my-package --template simple

# Submit for review
hwb release submit rel-abc123

# Reviewer approves
hwb release approve rel-abc123 -a reviewer-name

# Publish
hwb release publish rel-abc123
```

### Check dependencies for problems

Before shipping, check for security vulnerabilities and license issues:

```bash
# Vulnerability scan
hwb security scan -p .

# Dependency tree
hwb deps tree my-package

# License compliance check
hwb deps licenses my-package --check
```

## Troubleshooting

### "No pyproject.toml found"

hwb expects a `pyproject.toml` in the project root. If your project uses `setup.py` only, create a minimal `pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"
```

### "Docker daemon not running"

If you specified `--isolation docker` but Docker is not running, either start Docker or switch to venv isolation:

```bash
hwb build . --isolation venv
```

### "Permission denied" on publish

Publishing to PyPI requires authentication. Set your API token:

```bash
export PYPI_TOKEN=pypi-AgEI...
hwb publish dist/*.whl
```

Or pass it directly (less secure, not recommended in CI):

```bash
hwb publish dist/*.whl --token pypi-AgEI...
```

### Build fails with dependency errors

If the build fails because a dependency cannot be installed, try building without isolation to see the raw error:

```bash
hwb build . --isolation none
```

Then install the missing dependency and retry with isolation enabled.

### Getting more detail

Add `-v` for verbose output, or `--json` for machine-readable diagnostics:

```bash
hwb build . -v
hwb inspect . --format json
```

All errors follow a structured format with an error code and a hint for next steps.
