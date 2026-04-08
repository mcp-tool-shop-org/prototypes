---
title: Writing Lessons
description: How to create scenarios for Terminal Tutor.
sidebar:
  order: 5
---

Terminal Tutor lessons are YAML files. One file per lesson, authored with a clear set of rules.

## The One Law

**The lesson goal is primary. The runtime is subordinate.**

Every authoring decision starts from "what should the learner master?" — not "what can the runtime do?"

## Lesson Structure

```yaml
id: my-lesson
title: "Lesson Title"
difficulty: beginner    # beginner | intermediate | advanced
estimated_minutes: 10
mode: lesson            # lesson | game

goal: >
  One sentence describing what the learner will master.

flavor: >
  A human scenario that sets the scene. Not a lecture.

workspace:
  scaffold:
    - path: file.txt
      content: |
        File contents here.

safety:
  blocked_patterns: ["rm -rf", "sudo"]
  workspace_only: true

steps:
  - id: step-one
    prompt: "Do the thing."
    check:
      type: output_contains
      expect: ["expected output"]
    hints:
      - "Direction hint"
      - "Tool hint"
      - "Solution hint"

reflection: >
  What was learned and how it connects to real work.
```

## Runtime Selection

| Runtime | Use For | NOT For |
|---------|---------|---------|
| `shell` | File navigation, grep, pipes, git | Python packages, services |
| `venv` | pip, pytest, imports | Containment, destructive practice |
| `docker` | Services, ports, destructive commands | Simple grep lessons |

**Key rule:** venv is a dependency boundary, NOT a safety boundary. Only docker provides containment.

## Check Types

| Type | What It Checks |
|------|---------------|
| `output_contains` | Strings present in command output |
| `output_ordered` | Strings appear in order |
| `file_exists` | Files were created |
| `file_contains` | File has expected content |
| `exit_code` | Command exit code |
| `git_state` | Branch, clean tree, commit pattern |

All checks go through normalization: ANSI stripped, paths normalized, whitespace collapsed.

## Hint Ladder Rules

Every step needs at least 2 hints:

1. **Direction** — what kind of thing to do (never the command)
2. **Tool** — which tool and which flag
3. **Solution** — the actual command (only if needed)

## Capability Declarations

If using venv or docker, declare what the lesson needs:

```yaml
runtime:
  type: venv
  capabilities:
    python: true
    package_install: true
    destructive: false
```

The engine enforces capabilities before setup. A venv lesson cannot declare `destructive: true`.

## Anti-Patterns

- **Lecture engine** — prompts over 2 sentences
- **Runtime theater** — docker for a grep lesson
- **Brittle checks** — exact path format matching
- **Hint encyclopedia** — 5+ hints per step (split the step)
- **Exam mentality** — gotcha steps instead of teaching steps
