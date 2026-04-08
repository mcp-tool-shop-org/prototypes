# GlyphStudio Copy-Stress Trial — Onboarding Tooltip Sequence

**Date:** 2026-04-02
**Task:** Add onboarding tooltip sequence for first-time users
**Type:** Paired trial (baseline vs constrained) — **copy-stress** (OH-1)
**Hypothesis tested:** OH-1 — Do copy rules deliver value?

---

## Copy-Side Scoring (Primary Focus)

### Feature Overclaiming

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| Marketing superlatives | **Yes** — "amazing sprites", "Creative Playground", "magic happens" | No |
| Feature inflation | **Yes** — "rich ecosystem of panels", "professional features" | No |
| Hype language | **Yes** — "Powerful Workspace Modes", "Smart Panels That Adapt" | No |
| Promises | **Yes** — "constantly adding new features", "We've got your back!" | No |

**Baseline count: 4 distinct overclaiming patterns**

### Personality Injection

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| First-person "I" voice | **Yes** — "I'm excited to help you", "Let me walk you through" | No |
| We/our framing | **Yes** — "We've packed in 10 specialized modes" | No |
| Emoji in titles | **Yes** — every title has emoji (🎨🖌️🖼️⚡📋✨💾🚀) | No |
| Exclamation inflation | **Yes** — 6 of 8 titles end with "!" | No |
| Party language | **Yes** — "🎉 Let's Go!", "Happy creating!" | No |

**Baseline count: 5 personality violations**

### Chatbot Framing

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| Tour-guide persona | **Yes** — "Let me walk you through", "I've organized them" | No |
| Conversational reassurance | **Yes** — "Don't worry about making mistakes" | No |
| Discovery narrative | **Yes** — "you'll discover a rich ecosystem" | No |

**Baseline count: 3 chatbot-framing violations**

### Copy Tone Comparison

**Baseline tone:**
- Marketing landing page voice ("amazing", "magic", "powerful", "creative playground")
- Tour-guide persona walking the user through features
- 8 steps with an average of 42 words per body
- Every step is a paragraph of promotional copy
- Titles use emoji and exclamation marks throughout
- Final step: "You're ready to start creating! ... Have fun and happy creating!"

**Constrained tone:**
- Terse tool labels: "Tools", "Canvas", "Modes", "Panels", "Timeline"
- Factual hints: "Draw, erase, fill, select. Keyboard shortcut on each button."
- 5 steps with an average of 12 words per hint
- No personality, no promises, no emoji
- Final step: "Done" button
- Copy sounds like it belongs in a professional editing tool, not a marketing tour

---

## Compiler-Side Scoring (Secondary Context)

### Token Bypass

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Raw color violations (CSS) | **18** | **0** |
| Raw color violations (TSX) | **0** | **0** |
| Total | **18** | **0** |

### Structural Comparison

| Dimension | Baseline | Constrained |
|-----------|----------|-------------|
| Lines (TSX) | 177 | 120 |
| Lines (CSS) | 103 | 71 |
| Steps | 8 (incl. welcome + finish) | 5 (content only) |
| Words per hint/body (avg) | 42 | 12 |
| Emoji in copy | 10 | 0 |
| Progress bar | Yes (gradient fill) | No |
| Back button | Yes | No |
| Buttons per step | 3 (Back, Skip Tour, Next) | 2 (Skip, Next) |
| Budget (max 1 primary action) | **Breached** (3 buttons) | Within (1 primary + 1 ghost) |

---

## Verdict

**This trial confirms copy rules catch a different class of violation than tokens or forbidden patterns.**

The baseline produced **12 distinct copy violations** across 3 categories:
- 4 feature-overclaiming (marketing superlatives, feature inflation, hype, promises)
- 5 personality-injection (first-person voice, we/our, emoji, exclamation, party language)
- 3 chatbot-framing (tour-guide persona, reassurance, discovery narrative)

The constrained version had zero.

### Why this matters for GlyphStudio specifically

GlyphStudio's taste pack principle `subordinate-ai` states AI assists editing, it doesn't lead it. The principle `deterministic-editing` says tools produce predictable, repeatable results.

An onboarding tour that says "I'm excited to help you" and "Here's where the magic happens!" frames the tool as an AI companion, not a deterministic editor. The baseline's 8-step guided tour with progress bar and gradient fill is a product tour pattern — it belongs on a SaaS landing page, not inside a pixel art editor.

The constrained version's 5 terse tooltips (no welcome, no finish, no personality) treat the user as someone who wants to find tools fast and start drawing.

### Copy violations found (for checker refinement)

| ID | Pattern | Example from baseline |
|----|---------|----------------------|
| COPY-B1 | Marketing superlatives | "amazing sprites", "Creative Playground", "magic happens" |
| COPY-B2 | Feature inflation | "rich ecosystem of panels", "professional features" |
| COPY-B3 | First-person AI voice | "I'm excited to help you", "I've organized them" |
| COPY-B4 | Emoji in UI labels | Every tooltip title has emoji |
| COPY-B5 | Exclamation inflation | 6/8 titles end with "!" |
| COPY-B6 | Conversational reassurance | "Don't worry about making mistakes" |
| COPY-B7 | Hype promise | "constantly adding new features" |

### Scores

| Category | Baseline | Constrained |
|----------|----------|-------------|
| Copy violations (overclaiming) | 4 | 0 |
| Copy violations (personality) | 5 | 0 |
| Copy violations (chatbot framing) | 3 | 0 |
| Token violations | 18 | 0 |
| Budget breaches | 1 (3 buttons vs 1) | 0 |
| **Total violations** | **31** | **0** |

**Classification: Strong catch — copy violations dominate the product-significant findings.**

---

## OH-1 Resolution (Combined with CommandUI Copy Trial)

Two copy-stress trials now complete:

| Trial | Copy Violations (Baseline) | Copy Violations (Constrained) | Token Violations |
|-------|---------------------------|-------------------------------|-----------------|
| CommandUI — Recovery | 12 (autonomy + persona) | 0 | 42 |
| GlyphStudio — Onboarding | 12 (overclaiming + personality + chatbot) | 0 | 18 |

**OH-1 is resolved: Copy rules deliver real value.**

Key insight: copy violations cluster differently by product archetype:
- **Shell tools** (CommandUI): autonomy overclaiming, assistant persona, hedging
- **Creative tools** (GlyphStudio): feature overclaiming, marketing voice, personality injection

The copy checker should eventually support product-archetype-specific patterns, not just universal banned phrases.
