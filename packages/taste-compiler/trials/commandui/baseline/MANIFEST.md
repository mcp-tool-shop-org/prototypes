# CommandGuidance -- Command Guidance Surface

## What it is

A pre-execution guidance surface for CommandUI that analyzes commands before they run and shows users structured information about risk, affected systems, consequences, and pre-flight checks. It replaces the simple "I understand the risks" checkbox in PlanPanel with a detailed, actionable breakdown.

## Files

| File | Purpose |
|------|---------|
| `CommandGuidance.tsx` | React component + analysis engine (`analyzeCommand` + `CommandGuidance`) |
| `CommandGuidance.css` | All styles for the guidance surface |
| `MANIFEST.md` | This file |

## Architecture

### Analysis engine (`analyzeCommand`)

A pure function that takes a command string and optional `CommandPlan` + `PlanReview` from the planner, then returns a `GuidanceAnalysis` object:

- `overallTier` -- highest risk tier from matched signals or planner assessment
- `signals` -- array of matched risk patterns with label, tier, systems, consequences, checks
- `affectedSystems` -- deduplicated list of systems the command touches (filesystem, git, network, database, etc.)
- `allChecks` -- merged pre-flight checklist items
- `planFlags` -- safety and ambiguity flags from the planner's PlanReview

The risk knowledge base uses regex patterns to detect ~15 dangerous command families (rm -rf, git push --force, git reset --hard, DROP TABLE, curl | sh, chmod 777, mkfs, kill -9, npm publish, docker prune, etc.) and maps each to structured guidance.

### Component (`CommandGuidance`)

A collapsible panel that renders the analysis. Key behaviors:

- **Auto-collapse on low risk** -- when nothing dangerous is detected, the panel either hides entirely or collapses to a single-line header
- **Left accent border** -- green/amber/red stripe matching risk tier for instant visual identification
- **Expandable sections** -- "What it does" (explanation), "Risk signals" (pattern matches with consequences), "Planner flags" (from PlanReview), "Check before running" (actionable checklist with checkbox-styled bullets)
- **Acknowledge button** -- for medium/high risk, users can mark "I have reviewed the risks" which provides a deliberate confirmation signal (can be wired to PlanPanel's confirmation flow)
- **Resets on command change** -- acknowledgement and collapse state reset when the command changes

## Integration with PlanPanel

Drop the component into `PlanPanel.tsx` between the Explanation section and the confirmation checkbox:

```tsx
import { CommandGuidance } from "./CommandGuidance";
import "./CommandGuidance.css"; // or add to globals.css

// Inside PlanPanel render, after the explanation <div> and before the confirm-row:
<CommandGuidance
  command={editedCommand}
  plan={/* pass the full CommandPlan if available */}
  review={/* pass the PlanReview if available */}
  explanation={explanation}
  onAcknowledge={() => setConfirmRisk(true)}
/>
```

The `onAcknowledge` callback can wire directly into the existing `confirmRisk` state, so clicking "I have reviewed the risks" in the guidance surface auto-checks the confirmation checkbox.

## Integration with AppShell

The `analyzeCommand` function is exported separately so AppShell can use it for pre-execution checks without rendering the component. For example, in the semantic flow where `handleApprove` runs the plan:

```tsx
import { analyzeCommand } from "./CommandGuidance";

// Before executing
const analysis = analyzeCommand(command, plan.plan, plan.review);
if (analysis.overallTier === "high" && !userAcknowledged) {
  // Block execution until guidance is acknowledged
}
```

## Design decisions

1. **Pattern-based, not LLM-dependent** -- The risk analysis runs instantly via regex. It does not require an Ollama call, so it works even when the planner is offline or in mock mode.

2. **Layered with planner data** -- When a `CommandPlan` and `PlanReview` are available (semantic mode), the analysis merges planner signals (touchesFiles, touchesNetwork, destructive, safetyFlags) with pattern-based detection for maximum coverage.

3. **Checklist-styled checks** -- The "Check before running" items use checkbox-like bullet styling to encourage users to mentally verify each item. This is more actionable than a wall of warning text.

4. **No false comfort** -- Returns `null` when a command is genuinely low-risk with no signals. The guidance surface only appears when there is something worth showing.

5. **CSS follows globals.css patterns** -- Uses the same CSS variables, radius tokens, and color scheme as the existing codebase. Risk badge classes (`.risk-low`, `.risk-medium`, `.risk-high`) are reused from globals.css.
