# PRESS RELEASE

## Witness: A Local-First "Truth Recorder" for Human-AI Work

**[City, State] — [Release Date]** — Today, **Witness** launches as a local-first, append-only event journal that makes it possible to verify *what happened* in a human-AI workflow — offline, without cloud dependencies, and without relying on screenshots or "trust me."

As AI becomes embedded in daily work, the gap between *what happened* and *what can be proven* is widening. Traditional logs are mutable and incomplete, screenshots are easy to stage, and post-hoc narratives don't scale. Witness addresses this by recording workflow events as cryptographically verifiable records: intent, action, inputs, outputs, and signatures.

Witness is designed for developers, researchers, and teams who need durable proof trails without adopting a surveillance platform. Events are stored locally, appended only, and verifiable independently.

### What Witness Does

- Records events as signed, tamper-evident JSON
- Links inputs and outputs by digest (SHA-256)
- Uses Ed25519 signatures and canonical JSON for deterministic verification
- Works offline: verification does not require network access
- Treats redactions and corrections as new events, preserving causal history

### What Witness Does *Not* Do

Witness does not claim to prove the truth of someone's intent. It proves the integrity of the record: that the event was recorded and signed, and that it has not been modified since.

### Availability

Witness is available now at:

- GitHub: https://github.com/mcp-tool-shop/witness

### Media Contact

mcp-tool-shop
64996768+mcp-tool-shop@users.noreply.github.com
