---
title: Tips and Tricks
description: Practical advice for getting the most out of Dev-Op-Typer — session strategy, weakness targeting, audio setup, and display tuning.
sidebar:
  order: 5
---

## Session strategy

### Use the Target/Review/Stretch mix

Every session automatically draws 50% target (at your level), 30% review (slightly easier), and 20% stretch (slightly harder). You do not need to configure this. The mix is designed to consolidate existing skills while steadily pushing your ceiling.

### Declare an intent

Before starting, you can select an intent chip — Focus, Challenge, Maintenance, or Exploration. Intents do not change snippet selection or scoring. They are a personal marker so you can look back at your session history and remember what you were working on.

### Watch for fatigue

The app monitors your rolling WPM and accuracy. If both drop significantly during a session, it surfaces a break suggestion. The suggestion is informational — it never pauses or locks the app. But the data is real: typing when fatigued reinforces bad habits.

### Write a practice note

The Settings panel has a free-text practice note field (200 characters). Use it to write what you are working on today or this week. The system never reads this note — it is purely for your own reflection.

## Targeting weaknesses

### Check your heatmap

The Weak Spots panel shows your per-character mistake frequency, organized by symbol group (brackets, operators, quotes, etc.). Each entry shows whether you are improving, worsening, steady, or newly appearing. Focus your attention on characters marked as worsening.

### Enable Guided Mode

Guided Mode (off by default) biases snippet selection toward your weak symbol groups. The bias is bounded at +15 — a nudge, not a redirect. It requires at least two weak symbol groups before activating, and it never changes your difficulty band or scoring.

Toggle it in Settings under Signal Policy.

### Run micro-drills

When Guided Mode is on, you can trigger micro-drills: short sets of five snippets focused on your top weakness category. Micro-drills use the same adaptive engine — they do not introduce a separate scoring system. They are a focused burst, not a punishment.

### Set a focus area

In Settings, you can set an active focus area (e.g., "brackets", "loops", "operators"). When set, snippet selection preferentially includes snippets that touch this area. Clear it at any time.

## Audio setup

### Pick a keyboard theme

Five mechanical keyboard themes are available: Cherry MX Blue, Cherry MX Brown, Cherry MX Red, Topre, and Buckling Spring. Each has 8 sound variations. Try them all — the right sound feedback can improve your typing rhythm.

### Use ambient soundscapes

Background soundscapes (rain, deep focus, cafe, white noise) play during practice to help with focus. Experiment with which one works best for you.

### Per-channel volume

Each audio channel (ambient, keyboard, UI) has an independent volume slider. The title bar mute button silences everything instantly. Find the balance where keyboard clicks are audible but not distracting.

## Display tuning

### Adjust font size

The default code font size is 16px. If you find yourself leaning forward to read symbols, increase it. If you want to see more code at once, decrease it. The setting is in the Display section of Settings.

### Show line numbers

Line numbers are on by default. They help you orient yourself in longer snippets, especially multi-function code blocks.

### Use the sidebar

The sidebar (toggleable) gives you access to the snippet list, stats, and explanation panels without leaving the typing view. Adjust its width in Settings.

## Accessibility

### High contrast

If you use the Windows high contrast setting, Dev-Op-Typer respects it automatically. You can also enable high contrast within the app independently.

### Reduced motion

Enable this in Settings or let the app detect your OS preference. Animations are disabled and sound effects frequency is reduced.

### Screen reader mode

Optimizes status updates for screen readers. Instead of announcing every character, the app provides periodic WPM and accuracy updates. All controls have AutomationProperties labels.

### Extended timers

If timed interactions feel rushed, enable extended timers in the Accessibility section of Settings.

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Start a new test |
| **Escape** | Reset the current test |
| **Tab** / **Shift+Tab** | Navigate between controls |

The gear icon and speaker icon in the title bar are also keyboard-accessible.

## Data management

### Export your data

All your profile data (ratings, history, settings) can be exported as JSON from the Settings panel. This is useful for backup or if you want to analyze your progress externally.

### Reset selectively

The Settings panel lets you reset specific data (e.g., clear session history, reset a language rating) without wiping everything. Use this if you want a fresh start in one language while keeping others.

### Monthly compression

Session records older than one month are automatically compressed (merged) to keep the data footprint small. The app retains up to 500 most recent session records and 200 session timestamps.
