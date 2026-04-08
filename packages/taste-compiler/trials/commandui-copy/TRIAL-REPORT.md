# CommandUI Copy-Stress Trial — Failed Command Recovery Surface

**Date:** 2026-04-02
**Task:** Add failed-command recovery surface (inline context after command failure)
**Type:** Paired trial (baseline vs constrained) — **copy-stress** (OH-1)
**Hypothesis tested:** OH-1 — Do copy rules deliver value?

---

## Copy-Side Scoring (Primary Focus)

### Autonomy Overclaiming

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| "I noticed..." | **Yes** — "I noticed that this command failed" | No |
| "I can help..." | **Yes** — "I can help fix this", "Let me help you identify" | No |
| "I've checked..." | **Yes** — "I've checked and it appears" | No |
| "I'll try..." | **Yes** — "I'll retry the command automatically" | No |
| "Based on my analysis..." | **Yes** — "Based on my analysis, here's what I think" | No |
| "Would you like me to..." | **Yes** — "Would you like me to look into this further?" | No |

**Baseline count: 6 distinct autonomy-overclaiming instances**
**Constrained count: 0**

The baseline's `analyzeFailure()` function returns copy that frames CommandUI as an autonomous agent examining the user's system. Every description and suggestion is written in first person ("I noticed", "I can help", "I've identified"). The constrained version returns factual labels and terse hints with no persona.

### Assistant Persona / Chatbot Framing

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| First-person "I" voice | **Yes** — throughout all failure descriptions | No |
| Conversational reassurance | **Yes** — "Don't worry — this is a common issue" | No |
| Hedging language | **Yes** — "It seems like", "might be", "I'm not entirely sure" | No |
| Open-ended offers | **Yes** — "What would you prefer?", "Would you like me to..." | No |
| AI action button | **Yes** — "🤖 Ask AI for Help" button | No |
| Emoji in action labels | **Yes** — "✨ Apply Fix", "🤖 Ask AI for Help" | No |

**Baseline count: 6 persona/chatbot violations**
**Constrained count: 0**

The baseline reads like a chatbot explaining what happened and offering to help. "Don't worry — this is a common issue that's easy to resolve" is reassurance copy that belongs in a customer support chat, not a shell. The constrained version reads like a status line: "Permission denied" / "Command requires elevated privileges."

### Copy Tone Assessment

**Baseline tone:**
- Conversational, warm, reassuring
- Uses qualifiers: "It seems like", "might indicate", "I'm not entirely sure"
- Makes promises: "I'll retry the command automatically once the connection is restored"
- Suggests intelligence: "I've analyzed the command", "Based on my analysis"
- Labels one button "Apply Fix" (implies autonomous fixing)

**Constrained tone:**
- Factual, terse, terminal-native
- Labels are declarative: "Permission denied", "Command not found", "Timed out or killed"
- Hints are informational: "Binary not in PATH or not installed"
- Single action: "Retry" (restores command to composer, user executes)
- No claims about system state or diagnostic capability

---

## Compiler-Side Scoring (Secondary Context)

### Token Bypass

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Raw color violations (CSS) | **30** (grouped: ~8 site clusters) | **0** |
| Raw color violations (TSX) | **12** (CATEGORY_CONFIG map) | **0** |
| Total | **42** | **0** |

### Forbidden Patterns

| Pattern | Baseline | Constrained |
|---------|----------|-------------|
| fp-chatbot-as-shell | **Yes** — AI analysis section with conversational framing, "Ask AI for Help" button | **No** |
| fp-token-bypass | **Yes** | **No** |

### Budget Breaches

| Metric | Baseline | Constrained |
|--------|----------|-------------|
| Primary actions | **3** (Apply Fix, Retry Original, Ask AI for Help) | **1** (Retry) |
| Budget (max 1) | **Breached** | **Within** |

### Structural Comparison

| Dimension | Baseline | Constrained |
|-----------|----------|-------------|
| Lines (TSX) | 222 | 137 |
| Lines (CSS) | 208 | 102 |
| Stores consumed | 3 (history, composer, execution) | 2 (history, composer) |
| Actions | 3 (apply fix, retry, ask AI) | 1 (retry) |
| Local state | 2 (showDetails, isRetrying) | 1 (expanded) |
| Failure analysis depth | 6 categories with prose descriptions | 6 categories with labels + hints |
| Persona framing | Active ("I noticed", "I can help") | None |

---

## Verdict

**This trial proves copy rules have real product value.** OH-1 is now resolved.

The baseline produced **12 distinct copy violations** (6 autonomy-overclaiming + 6 persona/chatbot instances). Every failure description was written in first-person voice with conversational reassurance, hedging, and open-ended offers. The constrained version had zero.

The copy difference is not cosmetic — it is a product identity violation:

1. **CommandUI is a shell, not a chatbot.** "I noticed that this command failed because you don't have the required permissions" is chatbot copy. "Permission denied" is shell copy.

2. **Shells report status, they don't offer to help.** "Would you like me to look into this further?" violates the no-chatbot-drift principle. The constrained version puts the command back in the composer and lets the user decide.

3. **"Apply Fix" implies autonomous action.** The baseline's "✨ Apply Fix" button suggests the tool is fixing something. The constrained "Retry" button honestly describes what happens: the command goes back to the composer.

4. **Hedging undermines trust.** "I'm not entirely sure what caused the failure, but I'll try to help you figure it out" is the worst kind of copy for a shell tool — it admits uncertainty while promising help, satisfying neither a power user (who wants facts) nor a novice (who wants certainty).

### Copy violations found (for checker refinement)

| ID | Pattern | Example from baseline |
|----|---------|----------------------|
| COPY-A1 | First-person "I" voice | "I noticed that this command failed" |
| COPY-A2 | Conversational reassurance | "Don't worry — this is a common issue" |
| COPY-A3 | Hedging qualifiers | "It seems like", "might indicate", "I'm not entirely sure" |
| COPY-A4 | Open-ended offers | "Would you like me to...", "What would you prefer?" |
| COPY-A5 | Autonomy claims | "I can help fix this", "I'll retry automatically" |
| COPY-A6 | AI-branded actions | "🤖 Ask AI for Help", "✨ Apply Fix" |

These 6 patterns should be considered for automated detection in the copy checker (COPY-005 through COPY-010).

### Scores

| Category | Baseline | Constrained |
|----------|----------|-------------|
| Copy violations (autonomy) | 6 | 0 |
| Copy violations (persona) | 6 | 0 |
| Token violations | 42 | 0 |
| Forbidden pattern hits | 1 (chatbot-as-shell) | 0 |
| Budget breaches | 1 (3 actions vs 1) | 0 |
| **Total violations** | **56** | **0** |

**Classification: Strong catch — first trial where copy violations are the dominant finding class.**

---

## Hypothesis Resolution

**OH-1: Do copy rules deliver value?**

**Yes.** Copy violations were the most product-significant finding in this trial. Token bypass generated more volume (42 vs 12), but the copy violations are what make the baseline feel like a different product. A shell that says "I noticed" and "Would you like me to..." is a chatbot wearing a terminal skin. The copy rules caught that.

**Refined understanding:** Copy rules are not high-volume. They will never match token bypass in raw count. But they catch identity-boundary violations that tokens cannot — specifically, persona drift and autonomy overclaiming. In products with a strong "not-a-chatbot" identity (CommandUI, future CLI tools), copy rules are load-bearing.
