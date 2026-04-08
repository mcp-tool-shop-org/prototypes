# Feature-Reacher Demo Script

**Duration:** 5-7 minutes
**Audience:** Product managers, technical leads, documentation teams

---

## Setup (before demo)

1. Have at least 2 audits saved (run audit on different content)
2. Have a saved artifact set ready
3. Open app at `http://localhost:3000`

---

## Part 1: Core Audit (2 min)

### Intro Script

> "Feature-Reacher surfaces features at risk of low adoption by analyzing your existing documentation. No analytics required—just paste your release notes."

### Steps

1. **Paste content**: Use sample release notes (or real documentation)
2. **Run Audit**: Click "Run Audit" button
3. **Walk through results**:
   - Point to the headline (e.g., "5 features need attention")
   - Expand a HIGH risk feature
   - Show evidence citations
   - Show recommended actions
4. **Export**: Click "Export" → "Executive Summary" to show shareable format

### Key Talking Points

- Every diagnosis is backed by cited evidence
- No AI hallucinations—deterministic heuristics
- Actions are specific and copyable

---

## Part 2: Repeatability (2 min)

### Intro Script

> "Once you've run an audit, you want to track progress. Feature-Reacher saves every audit automatically."

### Steps

1. **Show History**: Navigate to `/history`
   - Point out saved audits with timestamps
   - Show feature counts and risk levels at a glance
2. **Artifact Sets**: Show the saved artifact set
   - "Load" a set to demonstrate repeatable input
3. **Run Again**: Run a new audit on the same artifact set

### Key Talking Points

- All audits saved to browser storage (no server required)
- Artifact sets enable consistent comparisons
- One-click repeat audits

---

## Part 3: Compare & Trends (2 min)

### Intro Script

> "The real value is tracking change over time. Let's compare two audits."

### Steps

1. **Navigate to Compare**: `/compare`
2. **Select two audits**: Show the selection dropdown
3. **Walk through diff**:
   - New risks (red)
   - Resolved risks (green)
   - Risk changes (amber)
   - Diagnosis changes
4. **Show Trends**: Navigate to `/trends`
   - Point to sparklines showing risk trajectory
   - Show improving vs worsening features

### Key Talking Points

- Proves progress: "We fixed 3 risky features since last month"
- Early warning: Catch features trending worse before crisis
- Shareable compare reports for stakeholder updates

---

## Part 4: Partner Sharing (1 min)

### Intro Script

> "Need to share with stakeholders who don't want technical details? Use the executive narrative."

### Steps

1. From any audit, click "Export" → "Executive Summary"
2. Show the generated narrative:
   - No jargon
   - Actionable summary
   - Risk breakdown
3. From Compare view, show "Export Compare Report"

### Key Talking Points

- Template-driven (no AI)
- Consistent format across audits
- Copy-paste ready for Slack/email

---

## Wrap-up Script

> "Feature-Reacher turns documentation analysis from a one-time task into a repeatable practice. Every audit is saved, comparable, and shareable—so you can prove progress to stakeholders with evidence."

---

## FAQ Prep

**Q: Does this connect to our analytics?**
A: Not yet—Phase 2 focuses on repeatability. Analytics integration is planned for Phase 3.

**Q: Where is data stored?**
A: Browser IndexedDB. No server, no cloud, no account required.

**Q: Can multiple people share audits?**
A: Export and share reports. Collaboration features are planned for later phases.

**Q: How are features detected?**
A: Heuristics: heading patterns, bullet lists, repeated phrases. No ML in current version.

**Q: Is this open source?**
A: MIT license. Fork it, extend it, contribute back.
