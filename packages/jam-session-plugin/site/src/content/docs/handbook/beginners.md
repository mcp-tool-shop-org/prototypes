---
title: Beginners
description: Zero-to-playing walkthrough for first-time users of the AI Jam Session plugin.
sidebar:
  order: 99
---

A step-by-step guide for people who have never used the plugin before. By the end of this page you will have installed the plugin, played a song, and tried each of the four main workflows.

## What is this?

jam-session-plugin is an add-on for Claude Code that gives you an AI piano player. It connects to a library of 100 songs and lets you learn, practice, and jam right from your terminal. Audio comes out of your speakers -- you do not need a piano, a DAW, or any music software installed.

The plugin talks to an MCP server called `@mcptoolshop/ai-jam-session` that generates MIDI and plays it through your system audio. You never interact with the server directly. The plugin provides slash commands and agent personalities that handle everything for you.

## Who is this for?

Anyone who uses Claude Code and wants to explore piano music. You do not need to know how to play piano, read sheet music, or understand music theory. The plugin's teaching agent explains everything from scratch and adjusts to your level.

Good fits:

- **Complete beginners** who want to learn piano concepts through an AI tutor
- **Casual players** who want structured practice plans for songs they like
- **Developers** who want to experiment with MIDI generation and AI-composed music
- **Music hobbyists** who want a jam partner that never judges

## Prerequisites

Before you start, make sure you have:

- **Claude Code** installed and working
- **Node.js 18 or newer** -- the MCP server runs on Node. Check with `node --version`
- **Speakers or headphones** connected to your computer -- the piano plays through your default audio output

That is all you need. No MIDI controllers, no external software, no accounts to create.

## Your first 5 minutes

**Step 1 -- Install the plugin.** Run this in Claude Code:

```bash
claude plugin add ai-jam-session
```

The MCP server is fetched automatically via npx the first time you use a command. No separate install step needed.

**Step 2 -- Verify it works.** Type:

```
/ai-jam-session:explore
```

If you see a list of songs, the plugin is installed correctly.

**Step 3 -- Browse for a song.** Filter by difficulty and genre:

```
/ai-jam-session:explore beginner classical
```

This shows all beginner-level classical songs with title, composer, and measure count.

**Step 4 -- Start a lesson.** Pick a song and learn it:

```
/ai-jam-session:teach fur-elise
```

The piano-teacher agent walks you through the song: what key it is in, what to listen for, which measures are important, and how to practice it. You do not need any music knowledge to follow along.

**Step 5 -- Hear the music.** The teach workflow includes playback. Audio comes through your speakers automatically. If you do not hear anything, check that your system volume is up and your default audio output is set correctly.

## Common workflows

The plugin has four main workflows, each triggered by a slash command.

### Exploring the library

```
/ai-jam-session:explore jazz
/ai-jam-session:explore beginner
/ai-jam-session:explore "movie themes"
```

Browse songs by genre, difficulty, or keyword. The explore skill shows matching songs with their title, composer, difficulty, and measure count. It also offers recommendations if you are not sure what to pick.

### Learning a song

```
/ai-jam-session:teach moonlight-sonata-mvt1
```

The teach skill gives you a structured lesson: song analysis, teaching goals, key moments, and a practice plan. You can ask for a measure-by-measure walkthrough or a sing-along in different modes (note names, solfege, contour, or syllables).

### Practicing a song

```
/ai-jam-session:practice let-it-be beginner
```

The practice skill generates a plan tailored to your level. It recommends a starting tempo, a playback mode, and a progression path for increasing difficulty over time. It also flags trouble spots -- specific measures that need extra attention.

### Jamming

```
/ai-jam-session:jam autumn-leaves as blues
```

The jam skill is the creative mode. Give it a song and a style (or just a genre), and Claude composes its own interpretation. The jam-musician agent keeps the session loose and experimental -- suggesting chord changes, groove adjustments, and creative directions. The result gets saved to your library so you can teach or practice it later.

## Common mistakes

**No audio output.** The MCP server plays through your system default audio device. If you hear nothing, check that your speakers or headphones are connected and your system volume is not muted. The plugin does not show an error when audio output is missing -- it just plays silently.

**Forgetting Node.js.** The MCP server requires Node.js 18 or newer. If slash commands hang or return errors about missing modules, run `node --version` to check. Install or update Node from nodejs.org if needed.

**Using song titles instead of IDs.** Slash commands expect song IDs (lowercase, hyphenated), not display titles. Use `fur-elise` not `Fur Elise`. If you are unsure of the ID, run `/ai-jam-session:explore` first to see the list, or just type the song name in natural language and let Claude resolve it.

**Skipping explore.** New users sometimes try to teach or jam on a song without knowing if it exists in the library. Start with `/ai-jam-session:explore` to see what is available. The library has 100 songs, but not every famous piece is included.

**Jumping to advanced songs.** Beginner songs exist for a reason. Start with beginner-level pieces to learn how the teaching and practice workflows function before tackling advanced material.

## Next steps

Now that you know the basics:

- **[Skills](/jam-session-plugin/handbook/skills/)** -- Deep dive into each slash command, the two agent personalities, and all 15 MCP tools
- **[Library](/jam-session-plugin/handbook/library/)** -- Full breakdown of the 100-song library: genres, difficulty levels, song metadata, and how to add your own songs
- **[Getting Started](/jam-session-plugin/handbook/getting-started/)** -- Quick reference for installation and first commands

If something is not working, check that Node.js 18+ is installed and that your speakers are not muted. The MCP server generates MIDI audio in real time and sends it to your default system output.

## Glossary

**MCP (Model Context Protocol)** -- A standard for connecting AI models to external tools and data sources. The AI Jam Session MCP server is the backend that generates and plays music.

**Skill** -- A slash command that triggers a structured workflow. The plugin has four: explore, teach, practice, and jam.

**Agent** -- An AI personality that shapes how Claude communicates during a session. The piano-teacher agent is pedagogical and patient. The jam-musician agent is casual and groove-focused.

**SongEntry** -- The structured JSON format used to store a song in the library. Contains metadata (title, composer, key, tempo) plus per-measure note data, dynamics, and fingering.

**Measure** -- A segment of music defined by the time signature. Each measure in the library has note data, a dynamics marking, fingering suggestions, and an optional teaching annotation.

**Sing-along** -- A text representation of notes in a song, available in four modes: note-names (C, D, E), solfege (do, re, mi), contour (directional arrows), and syllables.

**MIDI** -- Musical Instrument Digital Interface. A protocol for representing musical notes digitally. The MCP server generates MIDI data and converts it to audio that plays through your speakers.

**npx** -- A Node.js tool that downloads and runs packages without installing them globally. The plugin uses npx to fetch the MCP server on first use.
