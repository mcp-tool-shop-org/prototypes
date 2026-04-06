# Witness — FAQ

## What is Witness?

Witness is a local-first event journal that records workflows as signed, tamper-evident events.

## Is Witness a logging tool?

Not in the usual sense. Logs are often mutable, unstructured, and trust-based. Witness is designed for verification.

## Does Witness store my prompts or AI outputs?

Witness can store references (digests/paths) without storing content. What you record is your choice. Phase 1 defaults to minimal, evidence-grade metadata.

## What does "append-only" mean?

Events are never edited. Corrections and redactions are represented as new events that reference prior events.

## What cryptography does it use?

Ed25519 signatures and SHA-256 digests over canonical JSON.

## Can Witness prove that someone was honest?

No. It proves record integrity and reveals anomalies. It makes dishonesty harder to hide and easier to audit.

## Does it require the internet?

No. Verification is offline.

## Why not just use screenshots?

Screenshots are easy to stage and hard to verify. Witness is verifiable.

## Who is it for?

Anyone who needs durable evidence trails in AI-assisted workflows: developers, researchers, auditors, and teams.
