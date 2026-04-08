# Claude Guardian — Open Questions

No blocking questions. All three forced questions answered in LOCK-PACKET.md:

1. **What distinguishes the three failure classes?** — Answered with code locations and signal paths.
2. **Which outputs are machine-contractual?** — Answered with output classification table.
3. **What wording would reduce truth?** — Answered with 5 specific drift examples.

## Known seams (awareness, not blocking)

These are documented in the proving packet and context files. They are design tradeoffs, not defects:

1. **State freshness window (10s):** If daemon crashes, stale state is used for up to 8s. Conservative default.
2. **Budget advisory nature:** By design. Guardian can't SIGKILL processes it doesn't own.
3. **Process enumeration failure:** Escalates to critical (conservative). Better to over-report risk than under-report.
4. **Log tails in bundles:** May contain user content. Documented, not sanitized.
