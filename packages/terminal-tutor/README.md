<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/terminal-tutor/readme.png" width="400" alt="Terminal Tutor" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/terminal-tutor/actions"><img src="https://github.com/mcp-tool-shop-org/terminal-tutor/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/terminal-tutor/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

Learn terminal skills by doing — inside the terminal where the work actually happens.

Terminal Tutor is a situated coaching system. It creates a safe practice workspace, gives you a real task, watches what you type, and tells you what happened and why. No sandboxes, no quizzes, no videos — just a live mentor in your shell.

## Quick Start

```bash
npx terminal-tutor doctor    # Check what's ready
npx terminal-tutor tracks    # See skill tracks
npx terminal-tutor next      # Get your first lesson
npx terminal-tutor start files-and-navigation
```

## How It Works

1. **You pick a lesson.** Each one has a concrete goal — not "learn grep" but "find all the TODOs scattered through this codebase."

2. **The tutor creates a practice workspace.** Real files, real directories, real git repos. You work in a safe copy, not your actual projects.

3. **You run real commands.** Not simulated, not sandboxed. Actual `grep`, `git`, `sed`, `pip` — whatever the lesson needs.

4. **The tutor evaluates the outcome.** Did the right files appear? Did the output contain the expected data? It checks what happened, not which exact command you typed.

5. **If you get stuck, it helps.** Hints start with a nudge ("try searching recursively") and gradually get more specific ("try `grep -r 'TODO' src/`"). If you make a common mistake, it diagnoses the specific error.

6. **Your progress persists.** Come back later and pick up where you left off.

## Skill Tracks

| Track | Lessons | Runtime | What You'll Learn |
|-------|---------|---------|-------------------|
| **Shell Fundamentals** | 3 | shell | ls, cat, grep, find, sed, awk, diff, pipes |
| **Shell Triage** | 1 | shell | ps, background jobs, log analysis |
| **Git Survival** | 1 | shell | init, commit, branch, switch |
| **Python Debugging** | 2 | venv | pytest, tracebacks, pip, imports, dependencies |
| **Service Debugging** | 1 | docker | logs, processes, config, endpoints |

## Runtimes

Terminal Tutor uses three execution environments, each chosen for a reason:

- **shell** — Your system shell. For file navigation, text processing, and git. Instant startup.
- **venv** — A real Python virtual environment. For pip, pytest, and import debugging. Creates an actual venv with real packages.
- **docker** — A container. For service triage, process inspection, and anything that needs full isolation. Network off by default.

Run `terminal-tutor doctor` to see which runtimes are available on your system.

## CLI Reference

```
terminal-tutor list                    Show available lessons
terminal-tutor start <lesson-id>       Start or resume a lesson
terminal-tutor tracks                  Show skill tracks and progress
terminal-tutor track <track-id>        Show detailed track progress
terminal-tutor next                    Suggest next lesson
terminal-tutor mastery <lesson-id>     Show fluency signal for completed lesson
terminal-tutor progress                Show all lesson progress
terminal-tutor doctor                  Check system readiness
terminal-tutor runtimes                Show runtime availability
terminal-tutor reset <lesson-id>       Reset a lesson
terminal-tutor help                    Show help
```

## For Claude Code Users

Terminal Tutor is designed to work with Claude Code as the conversational layer. Claude can:
- Start lessons and present steps naturally
- Run commands and evaluate results through the tutor engine
- Explain errors in context, beyond what the canned hints provide
- Adapt to unexpected questions or approaches

The CLI outputs structured JSON, making it easy for Claude to parse lesson state, evaluate outcomes, and guide the learner.

## Security

Terminal Tutor operates **locally only** with no telemetry, no network calls, and no credential handling.

- **Data touched:** Temporary workspace directories (OS temp dir), lesson progress (`~/.terminal-tutor/progress.json`)
- **Data NOT touched:** Your projects, home directory, system configs, browser data, credentials
- **No telemetry** is collected or sent
- **Workspace isolation:** Practice files are created in isolated temp directories. The `workspace_only` safety flag prevents commands from escaping the practice area. Docker lessons run with network disabled by default.
- **Permissions:** Read/write to OS temp directory and `~/.terminal-tutor/` only. No elevated privileges required or requested.

See [SECURITY.md](SECURITY.md) for the vulnerability reporting policy.

## Writing Lessons

See [AUTHORING.md](AUTHORING.md) for the lesson authoring doctrine. Key rules:

- One YAML file per lesson
- Outcome-based checks (verify what happened, not which command)
- Hint ladders from direction to solution
- Use the lightest runtime that satisfies the lesson's needs
- Every lesson must have a `flavor` — a human scenario that sets the scene

## License

MIT

---

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
