---
title: Beginners
description: New to receipt-factory? Start here for a plain-language introduction.
sidebar:
  order: 99
---

## What is this project?

receipt-factory is a toolkit for creating tamper-evident records of automated work. Every time a CI pipeline runs, a release ships, or a security audit completes, receipt-factory captures what happened into a structured JSON document called a "receipt." That receipt is content-addressed with SHA-256, meaning any modification to the data breaks the hash and is immediately detectable.

The project is split into 10 composable npm packages and a CLI tool called `rf`. You can use the CLI for everyday tasks or import individual packages into your own scripts and workflows.

## Who is it for?

- **DevOps engineers** who need verifiable CI/CD audit trails
- **Security teams** who need tamper-evident records of audits and SBOMs
- **Release managers** who want provenance chains for every published version
- **Compliance teams** who need portable, offline-verifiable proof of process
- **Open-source maintainers** who want to prove their releases are reproducible

If your workflow involves automated pipelines and you ever need to answer "did this actually happen, and can you prove it?" then receipt-factory is built for you.

## When should I use it?

Use receipt-factory when you need to:

- **Prove a CI run happened** — Capture the commit, test results, and build artifacts into a verifiable receipt
- **Prove a release shipped** — Record the tag, assets, changelog, and publication timestamp
- **Detect registry drift** — Compare published package versions against the repo to find mismatches
- **Record security audits** — Document what was scanned, with which tool, and what was found
- **Generate SBOMs** — Create tamper-evident software bills of materials
- **Share proof offline** — Bundle receipts into portable zip capsules that verify without network access
- **Enforce organizational policy** — Define lint rules for receipt quality and distribute them across repos

## Key concepts explained

**Receipt:** A JSON document that records what happened, why, and how to verify it. Every receipt has a kind (like `ci_run` or `release`), a subject (what the receipt is about), an intent (why the work was done), inputs, outputs, evidence, and an integrity block containing the SHA-256 hash.

**Content-addressing:** The receipt's ID is its SHA-256 hash. Change any field and the ID changes. This makes receipts tamper-evident without needing a trusted server.

**Canonicalization:** Before hashing, receipt data is serialized with sorted keys and no whitespace. This ensures the same data always produces the same hash, regardless of key order or formatting.

**Evidence pack:** A directory of raw data (logs, artifacts, screenshots) with a manifest listing SHA-256 hashes for every file. Evidence packs are the raw material used to create receipts.

**Policy pack:** A portable JSON configuration that defines quality rules — minimum intent length, required evidence, mandatory verification steps. Policies are versioned and can be signed with cosign.

**Bundle:** A self-verifying zip file containing receipts, evidence, and optionally a policy. Bundles include a manifest and a hash file so they can be verified offline.

**Trust layers:** receipt-factory stacks four layers of trust. Layer 1 is receipt integrity (content-addressed hashes). Layer 2 is governance (policy-based lint rules). Layer 3 is bundle integrity (hash manifests). Layer 4 is bundle authority (cosign signatures).

## Common workflows

### Create and verify a CI receipt

```bash
# Install the CLI globally
npm install -g @receipt-factory/cli

# Initialize the receipts directory
rf init

# Create a CI receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Verify the receipt
rf verify receipts/ci/2026-03-03/12345678.json
```

### Set up policy enforcement

```bash
# Scaffold a default policy file
rf policy init

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json
```

### Build a portable bundle

```bash
# Bundle a receipt with its references and policy
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Verify the bundle
rf bundle verify bundles/abc123.bundle.zip

# Sign the bundle for tamper-proof authority
rf bundle sign bundles/abc123.bundle.zip --keyless
```

### Search receipts by kind or date

```bash
# Build the index first
rf index receipts/ --validate

# Search for CI receipts from January onward
rf search --kind ci_run --since 2026-01-01
```

## Glossary

| Term | Definition |
|------|-----------|
| **Receipt** | A signed, timestamped, content-addressed JSON record of work |
| **Receipt kind** | The type of work documented: `ci_run`, `release`, `registry_sync`, `audit`, `sbom`, or `delivery` |
| **Subject** | What the receipt is about (a repository, package, or artifact) |
| **Intent** | A human-readable statement of why the work was done |
| **Integrity** | The SHA-256 hash block that makes the receipt tamper-evident |
| **Evidence pack** | A directory of raw supporting files with a content-addressed manifest |
| **Policy pack** | A portable lint configuration defining receipt quality rules |
| **Bundle** | A self-verifying zip file containing receipts, evidence, and policy |
| **Cosign** | The signing tool from Sigstore used for detached signatures |
| **Keyless signing** | Signing via OIDC identity (no private key needed) using Sigstore |
| **Canonicalization** | Deterministic JSON serialization (sorted keys, compact) for reproducible hashing |
| **Provenance graph** | The chain of receipt-to-receipt references showing how work connects |

## FAQ

**Do I need cosign installed to use receipt-factory?**
No. Cosign is only required for signing (`rf sign`, `rf bundle sign`, `rf policy sign`). All other operations work without it.

**Can I create receipts without GitHub Actions?**
Yes. Use `--from evidence` with a local evidence pack directory. You can write evidence JSON manually or collect it from any source.

**What happens if I modify a receipt after creation?**
The SHA-256 hash will no longer match. Any `rf verify` call will detect the tampering and report it as a hash integrity failure.

**Can I verify receipts offline?**
Yes. Use `rf verify --offline` to skip link reachability checks. Bundles are designed for offline verification — they include everything needed.

**What Node.js version do I need?**
Node.js 20 or later.
