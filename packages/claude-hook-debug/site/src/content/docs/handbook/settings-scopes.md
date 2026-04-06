---
title: Settings Scopes
description: How Claude Code settings files are loaded and merged.
sidebar:
  order: 3
---

Claude Code loads settings from four files in a specific order. Understanding this hierarchy is essential for debugging hook issues.

## Load order

Settings files are loaded in this order. Because the **last value wins**, local has the highest effective priority for most keys:

| Load order | Scope | Path | Git tracked? | Effective priority |
|------------|-------|------|-------------|-------------------|
| 1st | managed | `~/.claude/managed-settings.json` | N/A | Lowest (overwritten by later scopes) |
| 2nd | user | `~/.claude/settings.json` | N/A | |
| 3rd | project | `.claude/settings.json` | Yes | |
| 4th | local | `.claude/settings.local.json` | No (gitignored) | Highest (last write wins) |

## Merge behavior

Settings are merged in load order. For most keys, the **last value wins** — so local overrides project, which overrides user, which overrides managed.

However, there's a critical caveat: **local overrides only apply to keys that already exist in a broader scope**. If you put `enabledPlugins` in `settings.local.json` but no broader settings file has an `enabledPlugins` key, the local value is silently dropped.

This is the root cause of [#25086](https://github.com/anthropics/claude-code/issues/25086).

## Managed settings

Managed settings (`managed-settings.json`) are intended for enterprise/organization-enforced configuration. They have the highest precedence and should not be overridable by user settings.

However, `disableAllHooks: true` currently bypasses even managed hooks — this is a known security bug.

## Practical advice

- **To disable a plugin reliably:** Set it to `false` in `~/.claude/settings.json` (user scope)
- **To override per-project:** First ensure the key exists in user scope (even as `{}`), then override in local
- **To check merged state:** Run `claude-hook-debug` — it shows the per-scope state and final merged result
