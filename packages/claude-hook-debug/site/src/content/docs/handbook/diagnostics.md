---
title: Diagnostic Rules
description: Complete reference for all diagnostic rules and their meanings.
sidebar:
  order: 2
---

## Error-severity diagnostics

### GHOST_HOOK_PREVIEW

The `claude-preview` plugin is disabled but its Stop hook still fires, injecting a "[Preview Required]" message on session end. This is a known plugin lifecycle bug.

**Fix:** Ensure `enabledPlugins` key exists in `~/.claude/settings.json` (even as `{}`), then set the plugin to `false` there. If still firing, add `"disableAllHooks": true` in the project's `.claude/settings.local.json`.

**References:** [#19893](https://github.com/anthropics/claude-code/issues/19893), [#25086](https://github.com/anthropics/claude-code/issues/25086)

### LOCAL_ONLY_PLUGINS

`enabledPlugins` appears in `settings.local.json` but not in any `settings.json`. Claude Code merges local overrides into existing keys — if the key doesn't exist in a broader scope, the local value is silently dropped.

**Fix:** Add `"enabledPlugins": {}` to `~/.claude/settings.json` or `.claude/settings.json`, then the local override will merge correctly.

**Reference:** [#25086](https://github.com/anthropics/claude-code/issues/25086)

### STOP_CONTINUE_LOOP

A Stop hook outputs `{"continue": true}`. In Claude Code, `continue: true` on a Stop hook means "don't stop yet", which re-invokes stop hooks in an infinite loop.

**Fix:** Remove the hook. To allow stopping, output nothing, `{"continue": false}`, or omit the "decision" field.

**Reference:** [#1288](https://github.com/anthropics/claude-code/issues/1288)

### BROKEN_SETTINGS_JSON

A settings file exists but contains invalid JSON. A broken settings file silently disables ALL settings from that file — no error is shown.

**Fix:** Fix the JSON syntax. Common causes: trailing commas, missing quotes, duplicate keys.

### DISABLE_ALL_HOOKS_ACTIVE (with managed settings)

`disableAllHooks: true` is set and a managed settings file exists. This overrides organization-enforced hooks, which is a known security bug.

**Fix:** Remove `disableAllHooks: true` and disable specific plugins via `enabledPlugins` instead.

## Warning-severity diagnostics

### GHOST_HOOK_GENERIC

A non-preview plugin is disabled but may still have active hooks due to the same lifecycle bug as GHOST_HOOK_PREVIEW.

### SCOPE_CONFLICT

A plugin is enabled in one scope but disabled in another. The last scope in load order wins (local > project > user > managed).

### DISABLE_ALL_HOOKS_ACTIVE (without managed settings)

`disableAllHooks: true` is set but no managed settings exist. This is safe but overly broad.

### LARGE_SETTINGS_FILE

A settings file exceeds 100KB, which may cause slow startup. Often caused by accumulated permission arrays.

### HOOK_NO_TIMEOUT

A `command` or `http` hook has no explicit `timeout` field. If the command hangs or the HTTP endpoint is unreachable, the entire Claude Code session freezes with no recovery.

**Fix:** Add a `"timeout"` field (in milliseconds) to the hook definition. Recommended values: 10000 (10s) for fast local commands, 30000 (30s) for network calls.

## Info-severity diagnostics

### PLUGIN_HOOKS_INVISIBLE

No user-defined hooks exist in settings, but plugins are enabled. Plugin hooks are injected from manifests at load time and are invisible to settings inspection. Use `claude --debug` to see hook events in the log.
