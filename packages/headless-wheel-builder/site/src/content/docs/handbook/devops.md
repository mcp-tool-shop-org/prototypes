---
title: DevOps
description: Pipeline orchestration, GitHub Actions generation, multi-repo operations, notifications, and metrics.
sidebar:
  order: 4
---

Headless Wheel Builder is designed to run unattended. Everything on this page works identically on a developer laptop and inside CI.

## Pipeline orchestration

Run a full build-to-release pipeline that chains build, test, release creation, and publishing:

```bash
# Full pipeline: build + create GitHub release
hwb pipeline release v1.0.0 -r owner/repo -s ./my-project

# Build only (no release)
hwb pipeline build-only -s ./my-project

# Check pipeline status
hwb pipeline status
```

The `release` pipeline builds your package, creates a GitHub release with the built wheel, and optionally publishes to PyPI.

## GitHub Actions generator

Generate a ready-to-commit CI workflow from your project:

```bash
hwb actions generate ./my-project --output .github/workflows/ci.yml
```

The generator reads your `pyproject.toml` and produces a workflow with build matrices, caching, and publish steps already configured.

## Multi-repo operations

When you manage a family of packages, coordinate them as a group using a manifest file:

```bash
# initialize a manifest
hwb multirepo init repos.json

# add repositories
hwb multirepo add repos.json -r owner/repo-a
hwb multirepo add repos.json -r owner/repo-b

# build all repos in the manifest
hwb multirepo build repos.json

# compute build order from dependency graph
hwb multirepo order repos.json

# sync versions across repos
hwb multirepo sync repos.json --version 2.0.0
```

## Notifications

Send build results to your team via Slack, Discord, or generic webhooks:

```bash
# Send a Slack notification
hwb notify send -u $SLACK_URL -p slack \
    -t "Release v1.0.0" -m "Published successfully" --status success

# Send a Discord notification
hwb notify send -u $DISCORD_URL -p discord \
    -t "Build Complete" -d version=1.0.0 -d package=myapp

# Test a webhook before wiring it into CI
hwb notify test -u $WEBHOOK_URL -p webhook

# List available providers
hwb notify providers

# List available event types
hwb notify events
```

Providers: `slack`, `discord`, and `webhook` (generic HTTP POST).

## Artifact caching

Built wheels are cached locally using an LRU strategy:

```bash
# show cache statistics
hwb cache stats

# list cached artifacts
hwb cache list

# list cached package names
hwb cache packages

# prune to a maximum size
hwb cache prune --max-size 1G

# remove a specific entry
hwb cache remove my-package 1.0.0

# clear the entire cache
hwb cache clear
```

Cache hits skip the entire build step, cutting repeat builds from minutes to seconds.

## Metrics and analytics

Track your build health over time:

```bash
# show build summary
hwb metrics summary

# detailed report
hwb metrics report

# analyze trends over time
hwb metrics trends --period 30d

# list individual build records
hwb metrics list --limit 20

# export to file for dashboards
hwb metrics export metrics.json --format json
```

Metrics include build success rates, average duration, cache hit ratios, and failure breakdowns by error type. Export supports `json` and `csv` formats.
