# Site Theme — Open Questions

No blocking questions. 4 known design tradeoffs documented in LOCK-PACKET.md:

1. **Hardcoded org domain** in astro.config. Intentional, documented.
2. **set:html XSS surface.** Consumer responsibility, documented.
3. **App template is scaffold-only.** Auth/data are stubs.
4. **No upgrade guide.** Acceptable for 1.x (no breaking changes yet).
