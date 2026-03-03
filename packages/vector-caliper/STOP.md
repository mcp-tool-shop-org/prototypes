# STOP — VectorCaliper v1.0.0 Feature Freeze

**This document enforces a 30-day cool-down period.**

**Created:** 2026-02-05
**Freeze expires:** 2026-03-07

---

## What This Means

VectorCaliper v1.0.0 is complete. For the next 30 days:

1. **No new features** — The scope is locked
2. **No semantic changes** — Visual mappings are frozen
3. **No API additions** — The interface is stable
4. **Bug fixes only** — If something is broken, fix it minimally

---

## Why This Matters

VectorCaliper's value comes from stability and predictability. Users need to trust that:

- Same input produces same output
- Visual encodings don't change meaning
- Frozen guarantees remain frozen

Adding features risks breaking these promises. The cool-down period ensures v1.0 is genuinely stable before any v1.1 work begins.

---

## What Is Allowed

### Permitted (patch releases: v1.0.x)

- Bug fixes that restore intended behavior
- Documentation corrections
- Test additions (no new functionality)
- Performance improvements (same output, faster)
- Dependency security updates

### Not Permitted (until freeze expires)

- New visual mappings
- New projections
- New adapters
- New export formats
- New CLI commands
- API extensions
- "Just one small feature"

---

## Before Modifying Anything

Read this checklist:

1. **Is it a bug fix?** → Proceed with minimal change
2. **Is it a feature?** → Wait until 2026-03-07
3. **Is it an improvement?** → Wait until 2026-03-07
4. **Is it "really quick"?** → Still wait until 2026-03-07
5. **Is it urgent for a user?** → Document it, wait until 2026-03-07

---

## After the Freeze

When the freeze expires:

1. Review accumulated feature requests
2. Prioritize based on user feedback
3. Plan v1.1.0 with clear scope
4. Maintain frozen guarantees
5. Update this file with new freeze period

---

## Frozen Guarantees Reference

All guarantees in `docs/VECTORCALIPER_V1_GUARANTEES.md` are immutable for v1.x.

Breaking any guarantee requires:

1. Major version bump (v2.0.0)
2. Migration guide
3. Explicit communication to users

---

## Contact

For urgent issues during the freeze period:

1. Open a GitHub issue with label `[urgent-v1-bug]`
2. Describe the exact problem
3. Include reproduction steps
4. Wait for triage

---

**Remember:** The best feature is stability.
