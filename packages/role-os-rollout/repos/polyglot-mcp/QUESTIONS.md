# Polyglot MCP — Open Questions

No blocking questions. 4 known design tradeoffs documented in LOCK-PACKET.md:

1. **Fallback-to-source is mixed-language.** Warning present, caller must check.
2. **Batch separator is fragile.** Fallback catches misalignment.
3. **Cache lacks atomic writes.** Load handles corruption gracefully.
4. **"pt-BR" resolves to "pt".** By design, documented.
