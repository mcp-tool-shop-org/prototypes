# Role OS — Open Questions

## Q1: Version drift (hardcoded vs package.json)

**Context:** `bin/roleos.mjs:9` hardcodes `const VERSION = "1.0.0"` but `package.json` says `1.0.1`.

**Question:** Should VERSION be read from package.json at runtime (e.g., `JSON.parse(readFileSync(...)).version`), or is the hardcoded value intentional?

**Impact:** Minor. Only affects `--version` output. But it's a contract surface — the version shown to users should be accurate.

**Status:** RESOLVED — Read from package.json at runtime. Implemented + tested.

---

## Q2: Route coverage gap disclosure

**Context:** `src/route.mjs:ROLE_KEYWORDS` only scores 6 of 32 roles. The remaining 26 are documented in routing-rules.md but invisible to `roleos route`.

**Question:** Should `roleos route` output include a note like "26 additional roles exist — see routing-rules.md for manual assignment"? Or is the current silent omission acceptable because the orchestrator is expected to know about all roles?

**Impact:** Medium. Users who only use `roleos route` to discover roles will miss 26 of them. But routing-rules.md is scaffolded by init and available.

**Status:** RESOLVED — No default disclosure. May add to --verbose later.

---

## Q3: Init update path

**Context:** `roleos init` skips existing files via `copyDirSafe()`. If starter-pack changes (new role, updated policy), existing users don't get updates by re-running init.

**Question:** Should there be an `init --update` or `init --force` flag? Or is this intentionally left to manual copy + release notes?

**Impact:** Medium-high for the rollout. As starter-pack evolves, locked repos will have stale spines. Currently no mechanism to update them.

**Status:** RESOLVED — Yes, add --force. Protects context/. Implemented + tested.

---

## Q4: Double-nested .claude/ in full-treatment workflow

**Context:** `starter-pack/.claude/workflows/full-treatment.md` exists. When init copies starter-pack to `.claude/`, this creates `.claude/.claude/workflows/full-treatment.md` in the target repo — a double-nested `.claude/` directory.

**Question:** Is this intentional (the full-treatment workflow lives at a special nested path) or a structural bug (it should be at `starter-pack/workflows/full-treatment.md` alongside the other workflows)?

**Impact:** Confirmed present in shipcheck lockdown (file `.claude/.claude/workflows/full-treatment.md` was committed). If a bug, affects every repo that has been initialized.

**Status:** RESOLVED — Bug. Fixed by moving file to starter-pack/workflows/. Affected repos remediated (commandui, shipcheck). Regression tests added.
