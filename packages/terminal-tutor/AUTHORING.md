# Lesson Authoring Doctrine

Rules for writing Terminal Tutor lessons. Follow these to keep the product honest.

## The One Law

**The lesson goal is primary. The runtime is subordinate.**

Every authoring decision starts from "what should the learner master?" — never from "what can the runtime do?"

## When to Use Each Runtime

| Runtime | Use when | NOT when |
|---------|----------|----------|
| `shell` | File navigation, grep, pipes, git basics. No packages, no services. | You need Python packages or process control. |
| `venv` | Real pip, pytest, import errors, dependency bugs. Python fidelity matters. | You need containment, destructive practice, or services. |
| `docker` | Services, ports, process triage, destructive commands, full reset needed. | A simple grep/file lesson. Too heavy. |

### The Safety Law

- **venv is a dependency boundary, NOT a safety boundary.** It provides Python fidelity. It does not provide containment.
- **Only docker provides actual containment.** If a lesson needs destructive practice, it MUST use docker.
- **shell provides workspace isolation only.** Commands are confined to a temp directory, but the host is not protected from determined escape.

## What Makes a Good Step

A good step has:
1. **A concrete task** — "Find all TODO comments" not "Learn about grep"
2. **An outcome-based check** — verifies what happened, not how
3. **A hint ladder** — first hint nudges direction, last hint gives the command
4. **Failure patterns** — catches common mistakes with specific guidance

A bad step:
- Requires reading before acting (lecture engine drift)
- Checks for an exact command string
- Has only one hint that gives the answer
- Requires multiple commands but only checks the last one

## How to Write Outcome-Based Checks

**Do this:**
```yaml
check:
  type: output_contains
  expect:
    - "app.js"
    - "utils.js"
```
This passes whether the learner uses `grep -r TODO .`, `rg TODO`, or `find . -exec grep TODO {} \;`.

**Not this:**
```yaml
# BAD — checks exact command output format
check:
  type: output_contains
  expect:
    - "src/app.js:3:// TODO: add validation"
```
This breaks if the file path format differs or the line number changes.

## How to Write Hints

The hint ladder goes from direction to solution:

```yaml
hints:
  - "You need to search for text inside files."          # Direction
  - "grep can search recursively through directories."   # Tool
  - "Try: grep -r 'TODO' src/"                           # Solution
```

Rules:
- First hint: what KIND of thing to do (never which tool)
- Middle hints: which tool, which flag
- Last hint: the actual command (only if needed)
- Never fewer than 2 hints per step
- Never give the command in hint 1

## How to Write Failure Patterns

Match on what the learner actually sees, not what you expect:

```yaml
on_failure:
  - pattern: "command not found"
    response: "Check your spelling — the command is 'grep', not 'grp'."
  - pattern: "No such file"
    response: "Make sure you're in the project root, not inside a subdirectory."
  - pattern: "Permission denied"
    response: "You don't need elevated permissions for this. Try without sudo."
```

Rules:
- Match stderr patterns, not stdout
- Be specific about what went wrong
- Suggest the fix, don't just name the error
- Keep responses under 2 sentences

## Cumulative vs Reset Lessons

```yaml
runtime:
  cumulative: true   # Steps build on previous state
  reset: per_lesson  # Reset only when restarting the whole lesson
```

- **cumulative: true** — step 3 expects the file created in step 2 to exist. The learner builds up state. Most debugging and git lessons are cumulative.
- **cumulative: false** — each step is independent. Reset between steps is safe. Most reference/exploration lessons are non-cumulative.
- **reset: per_step** — workspace resets before every step. Use for drill-style lessons where you want a clean slate each time.
- **reset: per_lesson** — workspace resets only when the lesson restarts. Default.

## Capability Declarations

Declare what your lesson needs, not what the runtime provides:

```yaml
runtime:
  type: venv
  capabilities:
    python: true
    package_install: true
    filesystem: workspace-only
    destructive: false
```

The engine enforces these BEFORE setup. If a venv lesson declares `destructive: true`, it fails at parse time — because venv is not a containment boundary.

Valid values:
- `filesystem`: `workspace-only` | `read-host` | `full`
- `processes`: `none` | `inspect-only` | `full`
- `network`, `git`, `python`, `package_install`, `destructive`: `true` | `false`

## Anti-Patterns to Avoid

1. **Lecture engine** — if users spend more time reading prompts than typing commands, the lesson is drifting. Keep prompts under 2 sentences.

2. **Runtime theater** — don't use docker because it sounds impressive. Use it because the lesson genuinely needs containment or services.

3. **Brittle checks** — string matching breaks across shells, path formats, and terminal widths. Use the normalization layer (ANSI strip, path normalize, whitespace collapse). Prefer `output_contains` over `output_ordered`.

4. **Hint encyclopedias** — 3 hints is usually enough. If you need 5+, the step is too complex. Split it.

5. **Exam mentality** — the product is a mentor, not a test. Steps should teach through doing, not quiz through gotchas.

## Checklist Before Submitting a Lesson

- [ ] Goal is one sentence describing what the learner will master
- [ ] Runtime is the lightest tier that satisfies the lesson's needs
- [ ] Capabilities are declared and truthful
- [ ] Every step prompt is under 2 sentences
- [ ] Every step has at least 2 hints (direction → solution)
- [ ] Checks are outcome-based, not command-string based
- [ ] Failure patterns cover the 2-3 most common mistakes
- [ ] Reflection connects what was practiced to real-world use
- [ ] Lesson was run end-to-end before submission
- [ ] No step requires reading a wall of text before acting
