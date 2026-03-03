# NameOps Permissions & Cross-Repo Access

## Architecture

NameOps uses a "Scheduler in Marketing, Logic in NameOps" model:

- **`mcp-tool-shop-org/nameops`** (org repo): owns code, configs, tests
- **`mcp-tool-shop/mcp-tool-shop`** (marketing repo): owns schedules, Pages deploy, PR automation

## Token Requirements

### Marketing Repo Scheduled Workflow

The `nameops-scheduled.yml` workflow in the marketing repo needs:

| Token | Scope | Purpose |
|-------|-------|---------|
| `GITHUB_TOKEN` | `contents: write`, `pull-requests: write` | Push branch + create PR in marketing repo |
| `NAMEOPS_PAT` (optional) | `repo` (read) on org repos | Checkout `mcp-tool-shop-org/nameops` |

**If `NAMEOPS_PAT` is not set**, the workflow falls back to `GITHUB_TOKEN`. This works if:
- The nameops repo is public, OR
- The marketing repo has access to org repos via GitHub App installation

### NameOps Repo Workflow

The `nameops.yml` workflow in the org repo needs:

| Token | Scope | Purpose |
|-------|-------|---------|
| `GITHUB_TOKEN` | `contents: write` | Upload artifacts |

No cross-repo access needed — this workflow only runs COE and uploads artifacts.

## Setting Up the PAT

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Create a fine-grained token with:
   - **Repository access**: `mcp-tool-shop-org/nameops` (read-only)
   - **Permissions**: Contents (read)
3. Add as `NAMEOPS_PAT` secret in `mcp-tool-shop/mcp-tool-shop` repo settings

## Security Notes

- The PAT only needs **read** access to the nameops repo
- The marketing repo's `GITHUB_TOKEN` handles all write operations (PRs, commits)
- No secrets cross the org boundary — nameops never writes to marketing
- The COE is installed globally via npm — no private registry access needed
