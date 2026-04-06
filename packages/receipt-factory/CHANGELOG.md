# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.3] - 2026-03-25

### Fixed
- CHANGELOG gap — added missing entries for 1.7.1 and 1.7.2

### Added
- Version alignment test suite (3 tests) in core package

### Changed
- SHA-pin all CI workflow actions (checkout, setup-node, pnpm/action-setup, upload-artifact, upload-pages-artifact, deploy-pages) for supply chain security

## [1.7.2] - 2026-03-25

### Changed
- Patch release (details not previously documented)

## [1.7.1] - 2026-03-25

### Changed
- Patch release (details not previously documented)

## [1.7.0] - 2026-03-03

### Added

- **Three supply chain receipt pipelines** — new receipt kinds for security teams and executives:
  - **`registry-sync`** (`@receipt-factory/pipeline-registry-sync`): Prove what's published vs what's in the repo
    - Drift classification: in sync, ahead, behind, unpublished
    - Each package becomes a receipt output with version comparison
  - **`security-audit`** (`@receipt-factory/pipeline-security-audit`): Prove what you scanned, with what tool, and what was found
    - Severity breakdown (critical/high/moderate/low/info) in intent and metadata
    - Each finding becomes a receipt output with advisory details
    - Lockfile snapshot evidence for dependency graph provenance
  - **`sbom`** (`@receipt-factory/pipeline-sbom`): Produce and attest to a software bill of materials
    - Supports CycloneDX and SPDX formats
    - SBOM file as primary output with SHA-256 digest and size
    - Generator tool recorded in environment
- **`rf make <kind> --from evidence`**: All three new kinds support evidence-based assembly
  - `rf make registry-sync --from evidence --pack <dir>`
  - `rf make security-audit --from evidence --pack <dir>`
  - `rf make sbom --from evidence --pack <dir>`
- **`sbom`** added to `ReceiptKind` enum (`registry_sync` and `audit` were already present)

### Changed

- `ReceiptEvidence.url` is now optional — supply chain evidence (lockfile snapshots, local scans) doesn't always have a URL
- Markdown and HTML renderers handle URL-less evidence gracefully (plain text instead of broken links)
- CLI `make` and `collect` help text lists all five kinds
- CLI `search --kind` filter lists all five receipt kinds
- 169 tests across 15 packages (up from 152/13)

## [1.6.0] - 2026-03-03

### Added

- **Bundle signing** (`@receipt-factory/sign`): `signBundle()` signs a bundle zip with cosign (detached sidecar)
  - Produces `bundle.zip.sig` and `bundle.zip.cert` — the zip contents are never mutated
  - Same sidecar pattern as `signReceipt()` and `signPolicy()`
- **Bundle signature verification** (`@receipt-factory/bundle`): `verifyBundle()` now supports `requireBundleSignature` option
  - Verification order: 1) bundle signature → 2) file integrity (hashes.json) → 3) semantic integrity (receipts)
  - If signature fails, verification returns early — no point unpacking a bundle whose provenance can't be established
  - Sidecar search: looks for `.sig` and `.cert` files next to the bundle
  - `BundleSignatureCheck` type added to `VerifyBundleResult`
- **`rf bundle sign <file>`**: Sign a bundle with cosign (detached sidecar)
  - `--keyless` for OIDC-based signing in CI
  - `--key <path>` for local key-based signing
- **`rf bundle verify --require-bundle-signature`**: Require a valid bundle-level signature
- **`rf verify <file.zip> --require-bundle-signature`**: Auto-detect passthrough — flag routes to bundle verification

### Changed

- `@receipt-factory/bundle` now depends on `@receipt-factory/sign` (for `verifyBlob`/`isCosignAvailable`)
- 152 tests across 13 packages (up from 147)

## [1.5.0] - 2026-03-03

### Added

- **`@receipt-factory/bundle`**: Receipt bundles — portable, self-verifying truth capsules
  - `createBundle()` packs a receipt + references + evidence + policy into a single zip archive
  - `verifyBundle()` extracts and verifies all hashes and receipts (bundle-internal, no network)
  - `inspectBundle()` reads the manifest without full verification
  - Bundle format: `manifest.json`, `hashes.json`, `VERIFY.md`, `receipts/`, `evidence/`, `policy/`, `signatures/`
  - SHA-256 hash of every file stored in `hashes.json` for tamper-evidence
  - `hashes.json` cannot hash itself — intentionally excluded
  - `VERIFY.md` provides human-readable verification instructions
- **`rf bundle create <file>`**: Create a portable receipt bundle
  - `--follow` includes referenced receipts (walks provenance graph, depth 5)
  - `--include-evidence` includes evidence packs
  - `--policy <path>` includes a policy file and its signature sidecars
  - `--out <path>` sets the output path (default: `bundles/<hash>.bundle.zip`)
- **`rf bundle verify <file>`**: Verify a bundle (hash checks + receipt verification)
  - `--strict` enables lint checks on all receipts
  - Bundle-internal semantics: no network, no filesystem wandering
- **`rf bundle inspect <file>`**: Quick capsule summary (manifest only, no verification)
- **`rf verify <file.zip>`**: Auto-detect bundles — `.zip` files are automatically verified as bundles
- Signature sidecars (`.sig`, `.cert`) are automatically collected into `signatures/`

### Changed

- `rf verify` now auto-detects `.zip` files and delegates to bundle verification
- CI pack dry-run includes `packages/bundle`
- 147 tests across 13 packages (up from 134/12)

## [1.4.0] - 2026-03-03

### Added

- **`rf verify --refs-strict`**: Strict reference mode — missing or unreadable references fail verification (default stays best-effort)
- **Policy identity**: Receipts embed `policy_identity.hash` recording which lint policy was applied at creation time
  - `PolicyIdentity` type: `hash` (required), optional `version`, `path`, `signed`, `signatureRef`
  - `policyIdentity()` method on `ReceiptBuilder` for fluent chaining
  - `policyIdentitySchema` (Zod) for validation
  - `computePolicyHash(rules)` utility in `@receipt-factory/policy`
- **Policy integrity verification**: `checkPolicyIntegrity()` compares receipt's embedded policy hash against supplied policy
  - Mismatch = fail (integrity, not lint quality)
  - No policy supplied = info only (backward compatible)
- **Policy signing**: `rf policy sign <file>` signs a policy file with cosign (detached sidecar)
  - `signPolicy()` function in `@receipt-factory/sign`
  - Produces `policy.json.sig` and `policy.json.cert` (keyless)
  - Policy file itself is never modified — hash in receipts refers to original content
- **`rf verify --require-policy-signature`**: Requires a cosign-signed policy for verification
- **Rendered policy hash**: Policy hash appears on the human front page of rendered receipts

### Changed

- Reference checks in best-effort mode (default) now report missing/unreadable references as `passed: true` (informational) instead of `passed: false`
- In `--refs-strict` mode, missing/unreadable references fail as before; hash mismatches always fail regardless of mode
- Verification pipeline always runs policy integrity check when receipt has `policy_identity`
- 134 tests across 12 packages (up from 127/12)

## [1.3.0] - 2026-03-03

### Added

- **Receipt References**: Receipts can cite other receipts and evidence packs by hash, forming a verifiable provenance graph
  - `ReceiptReference` type: `kind`, `hash`, `description`, optional `path` and `url`
  - `addReference()` method on `ReceiptBuilder` for fluent chaining
  - `receiptReferenceSchema` (Zod) for validation
  - Ref-check: `checkReferences()` verifies referenced receipts exist and hashes match
- **`@receipt-factory/policy`**: Policy packs — portable, versioned lint configuration
  - `PolicyPack` and `PolicyRules` types for configurable quality checks
  - `loadPolicy(path)` reads and validates policy JSON, fills missing rules from defaults
  - `DEFAULT_POLICY` and `DEFAULT_RULES` for built-in quality baseline
- **`rf verify --follow`**: Recursively verify referenced receipts up to depth 5
- **`rf verify --policy <path>`**: Use custom policy rules for lint checks
- **`rf graph [dir]`**: Emit JSON graph of receipt-to-receipt references
- **`rf policy init`**: Scaffold a default policy.json file
- **Publish workflow**: `receipt-publish.yml` uploads receipts + index to GitHub Pages

### Changed

- `checkLint()` now accepts optional `PolicyRules` parameter (backward compatible)
- `verifyReceipt()` accepts `follow`, `policy`, and `receiptsDir` options
- Link check now extracts URLs from `references[]` in addition to subject/outputs/evidence
- Receipt index entries include optional `references` array (hashes of referenced receipts)
- 127 tests across 12 packages (up from 108/10)

## [1.2.0] - 2026-03-03

### Added

- **`@receipt-factory/evidence`**: Evidence packs — portable, content-addressed bundles for offline receipt assembly
  - `writeEvidencePack()` serializes evidence with SHA-256 content hashes
  - `readEvidencePack()` verifies integrity before deserializing
  - Tamper detection: hash + size mismatch throws structured `RfError`
- **`@receipt-factory/index`**: Receipt index — scan, index, and search receipt directories
  - `buildIndex()` recursively scans for receipt JSON files, builds machine-readable index
  - `searchIndex()` filters by kind, repo name, date range
  - Optional `--validate` flag runs integrity checks during indexing
- **`rf collect` command**: `rf collect <kind> --from github` writes evidence packs for later offline assembly
- **`rf make --from evidence`**: Build receipts from evidence packs without network access
- **`rf index` command**: `rf index [dir]` scans receipts and writes `index.json`
- **`rf search` command**: `rf search --kind ci_run --repo alpha --since 2026-03-01`

### Changed

- CLI `make` command accepts `--from evidence --pack <dir>` in addition to `--from github`
- CLI `make` command accepts `--pack` option for evidence pack directory
- 108 tests across 10 packages (up from 86/8)

## [1.1.0] - 2026-03-03

### Added

- **Golden canonicalization test**: Frozen receipt fixture with expected canonical JSON + SHA-256 hash, proving cross-Node determinism
- **Trust spine**: `canonical_format_version` and `canonical_length_bytes` in integrity block for future-proof verification
- **Signing fields**: `signed_by`, `signed_at`, `rekor_log_id` in integrity for Sigstore integration
- **Strict verify mode**: `rf verify --strict` runs lint checks on human-surface fields (intent quality, evidence, verification steps)
- **Receipt lint**: `rf lint <file>` as alias for `rf verify --strict`
- **`@receipt-factory/sign`**: Cosign CLI wrapper — `signReceipt()`, `verifySignature()`, keyless (OIDC) and key-based modes
- **`rf sign` command**: `rf sign <file> --keyless|--key <path> [--embed]`
- **Release receipts pipeline**: `rf make release --from github --tag <tag>`
- **GitHub releases adapter**: `fetchRelease(repo, tag)` via `gh api`
- **Reusable release workflow**: `receipt-release.yml` for GitHub Actions
- 86 tests across 8 packages (up from 64/6)

### Changed

- `checkHash()` in verify now returns an array of checks (hash + format version + byte length)
- `verifyReceipt()` accepts `strict` option for lint checks
- `computeIntegrity()` now populates `canonical_format_version` and `canonical_length_bytes`
- CLI `make` command supports `release` kind with `--tag` option

## [1.0.0] - 2026-03-03

### Added

- `@receipt-factory/core`: Receipt schema (Zod + TypeScript), canonicalization, SHA-256 hashing, fluent builder API
- `@receipt-factory/render`: Markdown and standalone HTML renderers with human-first front page and technical back matter
- `@receipt-factory/verify`: Schema validation, hash integrity checking, link reachability verification
- `@receipt-factory/adapter-github`: GitHub Actions data fetching via `gh` CLI with env var auto-detection
- `@receipt-factory/cli`: The `rf` command — `make`, `render`, `verify`, `init`
- CI receipts pipeline: collect → assemble → render → write for GitHub Actions runs
- Reusable GitHub Actions workflow (`receipt-ci.yml`) wrapping the CLI
- 64 tests across 6 packages
- Handbook: what is a receipt, how to verify, how to add a pipeline
