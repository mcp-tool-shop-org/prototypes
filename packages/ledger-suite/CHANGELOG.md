# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] - 2026-03-25

### Changed
- SHA-pin CI workflow actions (checkout, setup-dotnet) for supply chain security

## [1.0.0] - 2026-02-27

### Added

- Initial stable release
- ClaimLedger: claim assertion, citations, attestations, revocations, RFC 3161 timestamps, ClaimPacks, local registry, publish command (371 tests)
- CreatorLedger: creator attestation proofs, content hash verification, multi-party attestation chains, proof bundles (219 tests)
- Shared.Crypto: Ed25519 cryptography primitives
- Ship Gate compliance (security, docs, identity)

## [0.1.0] - 2026-02-12

### Added

- Initial pre-release with ClaimLedger and CreatorLedger
- Monorepo structure with shared solution
