---
title: Practice Configs
description: Create named practice configurations to tune session parameters — difficulty bias, whitespace rules, backspace mode, and more.
sidebar:
  order: 3
---

Practice configs let you save named parameter sets that change how a session behaves. Instead of toggling settings before each session, you create a config once and select it from a dropdown.

## How configs work

A config is a JSON file that overrides specific session parameters. Any field you omit inherits from the app defaults. Configs never replace your profile, ratings, or heatmap — they only change the rules for a single session.

The app always includes a built-in **Default** config that uses standard adaptive behavior with no overrides.

## Creating a config

1. Navigate to your user configs folder:
   ```
   %LocalAppData%\DevOpTyper\UserConfigs\
   ```
   If the folder does not exist, create it.

2. Create a JSON file. The filename (without `.json`) becomes the display name in the UI dropdown.

3. Write your config. Every field is optional:

```json
{
  "description": "Start easy, loosen whitespace rules",
  "difficultyBias": "easier",
  "whitespace": "lenient"
}
```

4. Restart the app. Your config appears in the practice config dropdown in the Settings panel.

## Available fields

### difficultyBias

Controls how the adaptive engine picks snippet difficulty relative to your current level.

| Value | Effect |
|-------|--------|
| `"easier"` | Shifts target difficulty down by 1 |
| `"harder"` | Shifts target difficulty up by 1 |
| `"match"` | Locks to your current adaptive level exactly |
| omitted | Normal adaptive behavior (default) |

### language

When set, only snippets in this language are selected, overriding the language dropdown. Use the lowercase language key: `"python"`, `"javascript"`, `"csharp"`, `"java"`, `"sql"`, `"bash"`.

### whitespace

Controls how whitespace is compared between your typed text and the target.

| Value | Effect |
|-------|--------|
| `"strict"` | Exact match required — spaces and tabs are different characters |
| `"lenient"` | Tabs converted to spaces before comparison |
| `"normalize"` | Tabs normalized to 4 spaces, equivalent runs collapsed |
| omitted | Uses the setting from the Settings panel |

### backspace

Controls whether you can use backspace to correct mistakes.

| Value | Effect |
|-------|--------|
| `"always"` | Backspace is always allowed |
| `"limited"` | Limited number of corrections per session (default: 10) |
| `"never"` | No backspace allowed — hardcore mode |
| omitted | Uses the setting from the Settings panel |

### accuracyFloor

A number from 0 to 100. Sets the minimum accuracy percentage required to earn XP for a session. Below this threshold, XP earned is zero. The default is 70.

## Example configs

### Morning Warmup

```json
{
  "description": "Easy snippets with lenient whitespace — good for warming up",
  "difficultyBias": "easier",
  "whitespace": "lenient"
}
```

### Hardcore Brackets

```json
{
  "description": "No backspace, strict whitespace — symbol gauntlet",
  "backspace": "never",
  "whitespace": "strict",
  "difficultyBias": "harder"
}
```

### SQL Focus

```json
{
  "description": "SQL-only practice at current level",
  "language": "sql",
  "difficultyBias": "match"
}
```

## Config validation

Invalid values are silently ignored, not rejected. If you set `"difficultyBias": "superhard"`, the field is treated as omitted and the default behavior applies. Malformed JSON files are skipped entirely — they never crash the app.

Configs are also validated against the app's extension boundary limits to prevent unreasonable values.

## Sharing configs

Configs are included in `.ldtpack` export bundles alongside your custom snippets. When you export a bundle via Settings, any user-authored configs in your `UserConfigs` folder are bundled automatically.
