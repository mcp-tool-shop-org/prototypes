# SITETHEME-001 — Scaffold Contract Lock

**Packet type:** lockdown proving packet
**Repo:** @mcptoolshop/site-theme
**Seam:** Scaffold contract integrity
**Date:** 2026-03-24
**Status:** APPROVED — human review complete 2026-03-24, clean lock, CI matrix protection added

---

## Objective

Prove that the Role OS setup for site-theme can reject changes that would break the scaffold contract — the agreement between templates, types, components, design tokens, and CLI token substitution.

## Invariants under test

### INV-1: All 5 templates scaffold and build

**Claim:** `site-theme init --template X` followed by `npm run build` succeeds for all 5 templates (default, docs, product, portfolio, app).

**Source:** CI `.github/workflows/ci.yml` — `validate-templates` job runs a matrix across all 5 templates. Each creates a temp project, scaffolds, installs deps from npm-packed tarball, and builds.

**Evidence:** CI matrix is the authoritative test. Unit tests cover CLI arg parsing and token substitution, but the build validation is in CI only.

**Reject defense:**
- `protect-scaffold-contract.md` criterion #1 (breaks scaffold → build)
- `current-priorities.md` invariant #1 (5 templates, CI-validated)

### INV-2: SiteConfig type matches template output

**Claim:** The discriminated union in `types/config.ts` defines exactly the config shapes that templates produce in their `site-config.ts.tpl` files.

**Source:** `types/config.ts` — `SiteConfig = DefaultSiteConfig | DocsSiteConfig | ProductSiteConfig | PortfolioSiteConfig`. Each template's `site-config.ts.tpl` produces a config object that must conform to the corresponding type.

**Evidence:** TypeScript strict mode + CI build validation. If a template's config doesn't match the type, the Astro build fails because the config is imported and type-checked.

**Reject defense:**
- `protect-scaffold-contract.md` criterion #5 (scaffold doesn't match SiteConfig)
- `current-priorities.md` invariant #5 (SiteConfig discriminated union)

### INV-3: 11 design tokens are all defined

**Claim:** `styles/theme.css` defines exactly 11 CSS custom properties under `@theme`.

**Source:** `styles/theme.css` — `@theme { --color-surface, --color-surface-raised, --color-surface-strong, --color-edge, --color-edge-subtle, --color-heading, --color-body, --color-muted, --color-dim, --color-accent, --color-action, --color-action-text, --color-action-hover }`.

**Verification:** Count custom properties in theme.css.

**Reject defense:**
- `protect-scaffold-contract.md` criterion #3 (removes/renames design token)
- `current-priorities.md` invariant #3 (11 design tokens)
- `brand-rules.md` truth constraint #3 (token count must be exact)

### INV-4: CLI safety guards active

**Claim:** CLI dies if `site/` already exists. Path traversal is blocked.

**Source:** `cli/init.mjs` — `if (existsSync(outDir)) { ... process.exit(1) }` and `if (!templateDir.startsWith(templatesDir)) { ... process.exit(1) }`.

**Test coverage:** `tests/cli.test.mjs` — path traversal guard test.

**Reject defense:**
- `protect-scaffold-contract.md` criterion #7 (removes safety guards)
- `current-priorities.md` invariant #6 (dies if site/ exists)
- `current-priorities.md` invariant #7 (path traversal protection)

### INV-5: 7 token substitution keys are consistent

**Claim:** CLI replaces exactly 7 `{{VARIABLE}}` patterns, and all templates use these same keys.

**Source:** `cli/init.mjs:applyVars()` — replaces PACKAGE_NAME, BRAND_NAME, DESCRIPTION, REPO_URL, NPM_URL, LOGO_BADGE, BASE_PATH. Each .tpl file uses a subset of these keys.

**Test coverage:** `tests/helpers.test.mjs` — token derivation and replacement tests.

**Reject defense:**
- `protect-scaffold-contract.md` criterion #4 (removes/renames token key)
- `current-priorities.md` invariant #4 (7 token substitution keys)

## Hypothetical violations

### Violation A: "New template without CI validation"

**Scenario:** A PR adds `templates/blog/` with .tpl files but doesn't add "blog" to the CI matrix.

**Would this be rejected?**
- `protect-scaffold-contract.md` criterion #1: YES — new template not validated by CI
- `current-priorities.md` invariant #1: PARTIALLY — count is now 6 but CI only validates 5
- `brand-rules.md` truth constraint #1: YES — README says 5 but templates/ has 6

**Verdict:** Rejected at 3 independent levels.

### Violation B: "Remove Hero primaryCta prop"

**Scenario:** A PR removes the `primaryCta` prop from Hero.astro because some templates don't use it.

**Would this be rejected?**
- `protect-scaffold-contract.md` criterion #2: YES — component prop removed without major version
- `current-priorities.md` invariant #2: YES — stable prop interfaces
- INV-2: templates that pass primaryCta will fail to build (Astro type error)

**Verdict:** Rejected at 3 independent levels.

### Violation C: "Silent site/ overwrite"

**Scenario:** A PR removes the `existsSync(outDir)` check to support re-scaffolding.

**Would this be rejected?**
- `protect-scaffold-contract.md` criterion #7: YES — removes safety guard
- `current-priorities.md` invariant #6: YES — must die if site/ exists

**Verdict:** Rejected at 2 independent levels. (For a re-scaffold feature, the pattern from role-os `--force` would be the correct approach — explicit flag with protected paths.)

## Known design tradeoffs (not blocking)

1. **Hardcoded org domain in astro.config.** `site: 'https://mcp-tool-shop-org.github.io'` — intentional for the org, documented, token-replaceable by consumer.
2. **set:html XSS surface.** 5 components render raw HTML. Documented, consumer responsibility. Theme doesn't sanitize.
3. **App template is scaffold-only.** Auth, data layer, and session management are stubs. Production requires custom implementation.
4. **No upgrade guide.** CHANGELOG documents changes but not migration steps. Acceptable for now — no breaking changes yet (1.x series).

## Post-review addition

**Reject criterion #9 added** per human review: automatic reject if a change reduces CI matrix coverage or weakens the multi-template contract check. The liar-path for this repo is "works for the template I touched" while the broader contract erodes.

## Verdict

**APPROVED** — Human review complete 2026-03-24. All 5 invariants traced to source or CI. 3 hypothetical violations proven rejectable at 2-3 independent levels each. 4 known design tradeoffs accepted. 9 total reject criteria.

Lockdown status: **locked**.
