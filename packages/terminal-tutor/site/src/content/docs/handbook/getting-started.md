---
title: Getting Started
description: Install Terminal Tutor and complete your first lesson.
sidebar:
  order: 1
---

## Prerequisites

- **Node.js 20+** (required)
- **Python 3.10+** (optional — for Python debugging lessons)
- **Docker** (optional — for service triage lessons)

## Check System Readiness

```bash
npx @mcptoolshop/terminal-tutor doctor
```

The doctor command shows which runtimes are available and how many lessons you can run. Shell lessons work everywhere. Python and Docker lessons need their respective runtimes.

## Your First Lesson

```bash
npx @mcptoolshop/terminal-tutor start files-and-navigation
```

This creates a practice workspace with a small project. The tutor presents tasks one at a time:

1. **Read the prompt** — a concrete task, not a lecture
2. **Run a command** — any command you think will work
3. **Get feedback** — the tutor checks the outcome and either advances you or helps

If you get stuck, hints appear after each failed attempt. They start vague ("try searching recursively") and get specific ("try `grep -r 'TODO' src/`").

## Skill Tracks

```bash
npx @mcptoolshop/terminal-tutor tracks
```

Lessons are organized into 5 tracks:

| Track | What You Learn |
|-------|---------------|
| Shell Fundamentals | ls, cat, grep, find, sed, awk, diff, pipes |
| Shell Triage | ps, background jobs, log analysis |
| Git Survival | init, commit, branch, switch |
| Python Debugging | pytest, tracebacks, pip, imports |
| Service Debugging | logs, processes, config, endpoints |

## Games

After completing lessons in a track, try the game:

```bash
npx @mcptoolshop/terminal-tutor start filesystem-salvage
```

Games have win conditions, scoring, and par times. Same real commands, but with mission flavor and replay value.

## Resume Later

Progress saves automatically. Come back anytime:

```bash
npx @mcptoolshop/terminal-tutor next
```

This suggests your next incomplete lesson based on track order.
