---
title: Release Management
description: Draft releases, run approval workflows, generate changelogs, and roll back with Headless Wheel Builder.
sidebar:
  order: 2
---

Headless Wheel Builder treats releases as first-class objects with a full lifecycle: draft, submit, approve, publish — with optional rollback at any stage.

## Draft a release

```bash
hwb release create -n "v1.0.0 Release" -v 1.0.0 -p my-package
```

This creates a release record with status `draft`. Nothing is published yet. The `-n` flag sets the release name, `-v` sets the version, and `-p` names the package.

## Approval workflows

Three built-in workflow templates control who can approve a release and when:

### Simple

One approver, one step. Good for solo projects:

```bash
hwb release create -n "v1.0.0 Release" -v 1.0.0 -p my-package --template simple
hwb release submit rel-abc123
hwb release approve rel-abc123 -a alice
hwb release publish rel-abc123
```

### Two-stage

Requires two independent approvals (Code Review, then Release Approval) before publishing:

```bash
hwb release create -n "v2.0.0 Release" -v 2.0.0 -p my-package --template two-stage
hwb release submit rel-def456
hwb release approve rel-def456 -a alice --step "Code Review"
hwb release approve rel-def456 -a bob --step "Release Approval"
hwb release publish rel-def456
```

### Enterprise

A three-stage pipeline: QA Review, Security Review, and Release Approval. The final stage requires two approvals:

```bash
hwb release create -n "v3.0.0 Release" -v 3.0.0 -p my-package --template enterprise
hwb release submit rel-ghi789
hwb release approve rel-ghi789 -a qa-lead --step "QA Review"
hwb release approve rel-ghi789 -a security-lead --step "Security Review"
hwb release approve rel-ghi789 -a release-mgr --step "Release Approval"
hwb release approve rel-ghi789 -a release-lead --step "Release Approval"
hwb release publish rel-ghi789
```

## Release lifecycle

Every release moves through these states:

| State              | Description                                   |
|--------------------|-----------------------------------------------|
| `draft`            | Created but not yet submitted for review      |
| `pending_approval` | Submitted and waiting for approval            |
| `approved`         | All required approvals received               |
| `rejected`         | Rejected by a reviewer                        |
| `published`        | Artifacts pushed to registries                |
| `failed`           | Publication attempt failed                    |
| `rolled_back`      | Publication reversed                          |

## Rollback

If something goes wrong after publishing:

```bash
hwb release rollback rel-abc123
```

Rollback removes published artifacts from the target registry and marks the release as `rolled-back`.

## Changelog generation

Headless Wheel Builder generates changelogs from Conventional Commits:

```bash
hwb changelog generate --from v0.9.0 --to v1.0.0
```

Commit prefixes (`feat:`, `fix:`, `chore:`, `breaking:`) are grouped into sections automatically. The output is Markdown, ready for GitHub Releases or your `CHANGELOG.md`.
