# CodeTeam Suite — Press Kit

**Version:** 1.0
**Organization:** mcp-tool-shop
**Release Status:** Stable (v0.1.x contract locked)

---

## 1. Executive Summary

CodeTeam Suite is a cryptographically verifiable package integrity and trust system designed for modern software teams.

It provides a complete, deterministic trust loop — **approve → sign → verify** — backed by canonical JSON, SHA-256 digests, and Ed25519 signatures. The system is built to be editor-integrated, CI-friendly, and future-proof, with a frozen interoperability contract enforced by tests.

Unlike ad-hoc signing tools or opaque supply-chain solutions, CodeTeam Suite treats verification as a protocol, not an implementation detail.

---

## 2. One-Sentence Description

> CodeTeam Suite is an open, deterministic verification system that lets teams cryptographically approve, sign, and verify software packages with editor-grade reliability.

---

## 3. Key Problems It Solves

### The Industry Problems

- Package integrity checks stop at "hash matches"
- Signatures are inconsistent, undocumented, or non-deterministic
- Tools disagree on what "verified" means
- Editors and CI systems infer meaning from exit codes or logs
- Multi-signer policies are bolted on, not designed in

### What CodeTeam Fixes

- Deterministic, canonical signing and verification
- Explicit trust semantics (unsigned vs verified)
- Cryptographically sound multi-signer quorum enforcement
- Editor-safe JSON protocol with strict stdout guarantees
- Backward compatibility without ambiguity

---

## 4. Core Capabilities

### Cryptographic Foundation

- Canonical JSON (deterministic bytes across platforms)
- SHA-256 package digests
- Ed25519 signatures
- Purpose-tagged signables (prevents replay attacks)
- Deterministic key IDs (first 16 hex chars of SHA256(public_key))

### Trust & Governance

- Explicit approvals and attestations
- Multi-signer quorum policies
- Duplicate signer detection
- Purpose separation (approval vs release vs attestation)
- Legacy signature compatibility (without guessing)

### Format Compatibility

- Dual signature format support (legacy string + canonical envelope)
- Explicit format detection (no guessing)
- Backward compatibility with existing signatures
- Format separation enforced by tests

### Developer Experience

- CLI-first design
- Editor-integrated workflows (VS Code, Visual Studio 2026)
- Machine-readable JSON output
- Explicit error codes and severities
- Zero stdout noise in protocol mode

---

## 5. Typical Workflow

```bash
# Generate keys
codeteam keygen --out signer.key.json

# Approve a package
codeteam approve ./package --key reviewer.key.json --role reviewer

# Sign a package
codeteam sign ./package --key signer.key.json --role release-signer

# Verify (cryptographic + policy)
codeteam verify ./package --json --verify-signatures
```

**Result:**

| Status | Meaning |
|--------|---------|
| `OK_UNSIGNED` | Integrity verified, trust incomplete |
| `OK_VERIFIED` | Cryptographically verified, policy satisfied |

---

## 6. What Makes It Different

| Feature | Typical Tools | CodeTeam Suite |
|---------|---------------|----------------|
| Canonical bytes | Often unspecified | Fully defined + tested |
| Multi-signer support | Ad hoc | First-class |
| Editor integration | Log parsing | JSON protocol |
| Legacy compatibility | Breaks | Explicit + tested |
| Trust semantics | Implicit | Contractual |
| Determinism | Best effort | Enforced |
| Format upgrades | Breaking | Backward compatible |

---

## 7. Interoperability & Stability Guarantees

CodeTeam Suite ships with a **locked interop contract**, including:

- Frozen JSON schemas
- Explicit severity mapping from error codes
- Version-first CLI handshake
- CI-enforced smoke tests that protect editor integrations

**This means:**

> If it works today, it will keep working — or fail loudly in CI.

---

## 8. Intended Audience

- Security-conscious development teams
- Tooling and platform engineers
- CI/CD maintainers
- Open-source maintainers
- Organizations building internal trust pipelines
- Editor and IDE integration authors

---

## 9. Open & Extensible by Design

- Schema-first
- Language-agnostic
- CLI is the protocol
- Ready for Rust, Go, JS, Python ports
- Compatible with future HSM / OS keystore integrations

---

## 10. Project Status & Maturity

| Milestone | Status |
|-----------|--------|
| Cryptographic trust loop | ✅ Complete |
| Multi-signer quorum semantics | ✅ Locked |
| Editor integration spec | ✅ Complete |
| Interop smoke harness | ✅ Enforced in CI |
| Test coverage | ✅ 187 tests passing (177 core + 10 interop smoke) |
| Release readiness | ✅ Ready for adoption |

---

## 11. Quotes

> "We treated verification as a protocol, not a feature."

> "If an editor can't trust your output, nothing else matters."

> "Determinism is the real security boundary."

> "Breaking backward compatibility requires conscious intent — and CI will catch you."

---

## 12. Repository & Resources

| Resource | Location |
|----------|----------|
| Repository | `https://github.com/mcp-tool-shop/codeteam-suite` |
| Integration Spec | `docs/EDITOR_INTEGRATION.md` |
| Verification Rules | `VERIFICATION.md` |
| Schemas | `/schemas/` |
| Interop Tests | `/tests/CodeTeam.InteropSmokeTests/` |
| Severity Mapping | `/tests/CodeTeam.InteropSmokeTests/Interop/severity-map.v0.1.json` |

---

## 13. Roadmap

| Feature | Status |
|---------|--------|
| CLI `--use-quorum-policy` flag | Planned |
| VS Code extension (reference implementation) | Planned |
| Visual Studio 2026 extension | Planned |
| Rust port of verification core | Future |
| HSM/OS keystore integration | Future |

---

## 14. Suggested Assets

If expanding this kit for press or marketing:

- Logo (SVG + PNG)
- CLI screenshots (`verify` success / failure / warning banner)
- Architecture diagram (approve → sign → verify flow)
- Editor screenshots (VS Code Problems panel, warning banners)
- Demo GIF of `verify --json` + editor diagnostics

---

## 15. Licensing & Use

CodeTeam Suite is open-source.

It is designed to be embedded, integrated, and extended without vendor lock-in.

---

## 16. Contact

- **Organization:** mcp-tool-shop
- **Email:** 64996768+mcp-tool-shop@users.noreply.github.com
- **GitHub:** https://github.com/mcp-tool-shop

---

**End of Press Kit v1.0**
