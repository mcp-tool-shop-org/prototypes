# Artifact — Questions

## Answered during lockdown

### Q1: When fallback occurs, what must the system say, and what must it never imply?

**Answer:** See protect-fallback-determinism.md "Must say" / "Must never imply" sections. The system must always identify which driver mode was used via stderr and driver_meta. It must never imply that fallback output was curated, that Ollama was available when it wasn't, or that missing atoms were found.

### Q2: What exactly distinguishes the three fallback trigger paths?

**Answer:**
- Path 1: `--no-curator` flag (explicit user choice, no connection attempt)
- Path 2: Ollama responded but JSON was invalid (connection succeeded, response failed)
- Path 3: Ollama not available (connection failed)

All three produce distinct stderr messages. All three use driveFallback() for the actual packet.

### Q3: Is DT-3 (Curator validation defaults) a truth concern?

**Answer:** Named as a design tradeoff, not blocking. The packet says mode: 'ollama' because Ollama DID respond — the issue is that some fields may have been corrected to defaults. The system is honest about who drove the decision, just not about which specific fields survived validation. Worth monitoring but not a contract violation.
