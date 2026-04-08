# Command Guidance Surface — Constrained Trial

## What This Builds

A **CommandGuidance** component that provides a pre-execution briefing for risky commands in CommandUI's semantic mode. It sits between the PlanPanel's "Command" section and the action buttons, giving users a structured breakdown of what a command will do, what systems it touches, and what to verify before running it.

This is NOT a separate panel or modal — it enriches the existing PlanPanel flow so risk information is legible before action, without adding navigation or modal depth.

### Components

1. **CommandGuidance.tsx** — The guidance surface component. Receives a `CommandPlan` and renders:
   - Impact summary: what systems the command touches (files, network, privileges)
   - Risk tier badge with plain-language explanation of the tier
   - Pre-flight checklist: contextual items to verify before execution (e.g., "Verify target directory exists", "Check network connectivity")
   - Assumptions surfaced from the planner
   - Collapsible detail for longer guidance (keeps the surface compact by default)

2. **commandGuidance.css** — All styles for the guidance surface, using only CSS variable tokens.

3. **classifyGuidance.ts** — Pure function that takes a `CommandPlan` and returns structured guidance data: impact areas, pre-flight checks, risk explanation, and caution notes. No AI/LLM calls — this is deterministic pattern matching on plan properties.

## How It Integrates

The `CommandGuidance` component is designed to be inserted into `PlanPanel.tsx` between the command editor and the risk badge section. Integration requires:

```tsx
// In PlanPanel.tsx, after the plan-edit-block div and before the risk section:
import { CommandGuidance } from "./CommandGuidance";

// Inside the render, after the command textarea block:
<CommandGuidance plan={currentPlan} />
```

Where `currentPlan` is the full `CommandPlan` object (the PlanPanel already has access to all the fields needed — risk, destructive, touchesFiles, touchesNetwork, escalatesPrivileges, assumptions, explanation).

The component is self-contained: it reads plan properties and renders guidance. It does not modify state, dispatch actions, or touch the terminal. The terminal remains the sole execution surface.

## Constraint Satisfaction

| Constraint | How Satisfied |
|---|---|
| Real shell is canonical | Guidance is read-only advisory; terminal executes |
| Semantic mode distinct | Component only renders for semantic plans (source === "semantic") |
| Risk legible before action | Risk tier, impact areas, and pre-flight checks shown before Run button |
| No chat-bubble framing | Structured card layout, no message bubbles or transcript |
| No assistant-avatar | No bot icons, no persona presentation |
| No autonomy overclaim | Copy uses "suggested", "proposed", "reviewed" |
| Command always visible | Guidance sits alongside the visible command textarea, never replaces it |
| Destructive confirmation | Does not change confirmation flow — PlanPanel's existing checkbox remains |
| Max 1 primary action | No new action buttons; guidance is informational only |
| Max 1 modal depth | No modals introduced |
| CSS tokens only | All colors use var(--*) references |
| No forbidden patterns | No chatbot-as-shell, no assistant overlay, no untiered risk, no raw colors |

## Files Created

- `MANIFEST.md` — this file
- `CommandGuidance.tsx` — main React component
- `commandGuidance.css` — component styles
- `classifyGuidance.ts` — deterministic guidance classifier

## Self-Check

- [x] Zero raw hex/rgb color literals — all colors use var(--)
- [x] No chat-bubble or transcript framing
- [x] No assistant/bot avatar or persona
- [x] Command text always visible (never hidden behind summary)
- [x] Risk tier always visible before execution
- [x] Confirmation required for high-risk commands (existing PlanPanel behavior preserved)
- [x] Terminal remains the authoritative execution surface
- [x] Max 1 primary action per screen
- [x] Copy uses "suggested"/"proposed" not "autonomous"/"automated"
- [x] No forbidden patterns present
