<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/headless-wheel-builder/readme.png" alt="Headless Wheel Builder" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/headless-wheel-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/headless-wheel-builder/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/headless-wheel-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/headless-wheel-builder/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="https://pypi.org/project/headless-wheel-builder/"><img src="https://img.shields.io/pypi/v/headless-wheel-builder" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/headless-wheel-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

A universal, headless Python wheel builder with integrated GitHub operations, release management, and full CI/CD pipeline automation. Build wheels, manage releases with approval workflows, analyze dependencies, and orchestrate multi-repository operations — all without touching the web UI.

Part of [MCP Tool Shop](https://mcp-tool-shop.github.io/) -- practical developer tools that stay out of your way.

## Why Headless Wheel Builder?

Most Python build tools stop at `python -m build`. Headless Wheel Builder keeps going: draft releases with approval workflows, dependency analysis with license compliance, multi-repo coordination, and registry publishing -- all from a single CLI. If you run CI/CD pipelines for Python packages, this replaces a patchwork of scripts with one tool.

## What's New in v1.0.0+

- **Release Management**: Draft releases with multi-stage approval workflows
- **Dependency Analysis**: Full dependency graph with license compliance checking
- **CI/CD Pipelines**: Build-to-release pipeline orchestration
- **Multi-Repo Operations**: Coordinate builds across repositories
- **Notifications**: Slack, Discord, and webhook integrations
- **Security Scanning**: Vulnerability detection and code security analysis
- **Metrics & Analytics**: Build performance tracking and reporting
- **Artifact Caching**: LRU cache with registry integration

## Features

### Core Building
- **Build from anywhere**: Local paths, git URLs (with branch/tag), tarballs
- **Build isolation**: venv (uv-powered, 10-100x faster) or Docker (manylinux/musllinux)
- **Multi-platform**: Python 3.10-3.13, Linux/macOS/Windows
- **Publishing**: PyPI Trusted Publishers (OIDC), DevPi, Artifactory, S3

### Release Management
- **Draft releases**: Create, review, and approve releases before publishing
- **Approval workflows**: Simple, two-stage, or enterprise (QA → Security → Release)
- **Rollback support**: Easily revert published releases
- **Changelog generation**: Auto-generate from Conventional Commits

### DevOps & CI/CD
- **Pipeline orchestration**: Chain build → test → release → publish
- **GitHub Actions generator**: Create optimized CI workflows
- **Multi-repo operations**: Coordinate releases across repositories
- **Artifact caching**: Reduce build times with intelligent caching

### Analysis & Security
- **Dependency graphs**: Visualize and analyze package dependencies
- **License compliance**: Detect GPL in permissive projects, unknown licenses
- **Security scanning**: Vulnerability detection, SBOM generation
- **Metrics dashboard**: Track build times, success rates, cache hits

### Integrations
- **Notifications**: Slack, Discord, Microsoft Teams, custom webhooks
- **Headless GitHub**: Releases, PRs, issues, workflows — fully scriptable
- **Registry support**: PyPI, TestPyPI, private registries, S3

## Installation

```bash
# With pip
pip install headless-wheel-builder

# With uv (recommended - faster)
uv pip install headless-wheel-builder

# With all optional dependencies
pip install headless-wheel-builder[all]
```

## Quick Start

### Build Wheels

```bash
# Build from current directory
hwb build

# Build from git repository
hwb build https://github.com/user/repo

# Build specific version with Docker isolation
hwb build https://github.com/user/repo@v2.0.0 --isolation docker

# Build for a specific Python version
hwb build --python 3.11
```

### Release Management

```bash
# Create a draft release
hwb release create -n "v1.0.0 Release" -v 1.0.0 -p my-package \
    --template two-stage --changelog CHANGELOG.md

# Submit for approval
hwb release submit rel-abc123

# Approve the release
hwb release approve rel-abc123 -a alice

# Publish when approved
hwb release publish rel-abc123

# View pending approvals
hwb release pending
```

### Dependency Analysis

```bash
# Show dependency tree
hwb deps tree requests

# Check for license issues
hwb deps licenses numpy --check

# Detect circular dependencies
hwb deps cycles ./my-project

# Get build order
hwb deps order ./my-project
```

### Pipeline Automation

```bash
# Run a build-to-release pipeline
hwb pipeline release v1.0.0 -r owner/repo -s ./my-project

# Build only (no release)
hwb pipeline build-only -s ./my-project

# Generate GitHub Actions workflow
hwb actions generate ./my-project --output .github/workflows/ci.yml
```

### Notifications

```bash
# Send a Slack notification
hwb notify send -u https://hooks.slack.com/... -p slack \
    -t "Build Complete" -m "Built mypackage 1.0.0"

# Test a webhook
hwb notify test -u https://hooks.slack.com/... -p slack

# List available providers
hwb notify providers
```

### Security Scanning

```bash
# Full security scan (vulnerabilities + code analysis)
hwb security scan -p ./my-project

# Quick vulnerability check only
hwb security check -p ./my-project

# Fail CI on critical issues
hwb security scan -p ./my-project --fail-critical
```

### Multi-Repo Operations

```bash
# Initialize a multi-repo manifest
hwb multirepo init my-manifest.json

# Add repositories
hwb multirepo add my-manifest.json -r owner/repo

# Build all repos in the manifest
hwb multirepo build my-manifest.json

# Sync versions across repos
hwb multirepo sync my-manifest.json --version 2.0.0
```

### Metrics & Analytics

```bash
# Show build metrics summary
hwb metrics summary

# Export metrics to file
hwb metrics export metrics.json --format json

# Analyze build trends
hwb metrics trends --period 30d
```

### Cache Management

```bash
# Show cache statistics
hwb cache stats

# List cached packages
hwb cache list

# Prune old entries
hwb cache prune --max-size 1G
```

## Headless GitHub Operations

```bash
# Create a release with assets
hwb github release v1.0.0 --repo owner/repo --files dist/*.whl

# Trigger a workflow
hwb github workflow run build.yml --repo owner/repo --ref main

# Create a pull request
hwb github pr create --repo owner/repo --head feature --base main \
    --title "Add new feature" --body "Description here"

# Create an issue
hwb github issue create --repo owner/repo --title "Bug report" --body "Details..."
```

## Python API

```python
import asyncio
from headless_wheel_builder import build_wheel
from headless_wheel_builder.release.manager import ReleaseManager
from headless_wheel_builder.depgraph import DependencyAnalyzer

# Build a wheel
async def build():
    result = await build_wheel(source=".", output_dir="dist", python="3.12")
    print(f"Built: {result.wheel_path}")

# Create and manage releases
def manage_releases():
    manager = ReleaseManager()

    # Create draft
    draft = manager.create_draft(
        name="v1.0.0",
        version="1.0.0",
        package="my-package",
        template="two-stage",
    )

    # Submit and approve
    manager.submit_for_approval(draft.id)
    manager.approve(draft.id, "alice")
    manager.publish(draft.id, "publisher")

# Analyze dependencies
async def analyze_deps():
    analyzer = DependencyAnalyzer()
    graph = await analyzer.build_graph("requests")

    print(f"Dependencies: {len(graph.nodes)}")
    print(f"Conflicts: {graph.conflicts}")

asyncio.run(build())
```

## Configuration

Configure in `pyproject.toml`:

```toml
[tool.hwb]
output-dir = "dist"
python = "3.12"

[tool.hwb.build]
sdist = true
checksum = true

[tool.hwb.release]
require-approval = true
default-template = "two-stage"
auto-publish = false

[tool.hwb.notifications]
slack-webhook = "${SLACK_WEBHOOK_URL}"
on-success = true
on-failure = true

[tool.hwb.cache]
max-size = "1G"
max-age = "30d"
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `hwb build` | Build wheels from source |
| `hwb publish` | Publish to PyPI/registries |
| `hwb inspect` | Analyze project configuration |
| `hwb github` | GitHub operations (releases, PRs, issues) |
| `hwb release` | Draft release management |
| `hwb pipeline` | Build-to-release pipeline orchestration |
| `hwb deps` | Dependency graph analysis |
| `hwb actions` | GitHub Actions generator |
| `hwb multirepo` | Multi-repository operations |
| `hwb notify` | Notification management |
| `hwb security` | Security scanning |
| `hwb metrics` | Build metrics & analytics |
| `hwb cache` | Artifact cache management |
| `hwb changelog` | Changelog generation |

## Requirements

- Python 3.10+
- Git (for git source support)
- Docker (optional, for manylinux builds)
- uv (optional, for faster builds)

## Documentation

See the [docs/](docs/) directory for comprehensive documentation:

- [ROADMAP.md](docs/ROADMAP.md) - Development phases and milestones
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design and components
- [API.md](docs/API.md) - CLI and Python API reference
- [SECURITY.md](docs/SECURITY.md) - Security model and best practices
- [PUBLISHING.md](docs/PUBLISHING.md) - Registry publishing workflows
- [ISOLATION.md](docs/ISOLATION.md) - Build isolation strategies
- [VERSIONING.md](docs/VERSIONING.md) - Semantic versioning and changelog
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Development guidelines

## Security & Privacy

**Data touched:** Python source code (read-only for analysis), build artifacts (dist/), pyproject.toml, git history, Docker containers, package registry APIs.

**Data NOT touched:** user credentials directly (uses environment variables and OIDC tokens), system files outside the project. No telemetry is collected or sent. Tokens are read from environment variables only and never logged.

**Permissions:** filesystem read/write for builds, Docker socket (optional), network for registry publishing and GitHub API. See [SECURITY.md](SECURITY.md) for the full policy.

## License

MIT License -- see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
