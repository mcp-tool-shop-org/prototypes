---
title: Skills
description: Slash commands, agent personalities, and MCP tools.
sidebar:
  order: 2
---

The plugin adds 4 slash commands (skills), 2 agent personalities, and wraps 15 MCP tools. You interact with the skills and agents; they orchestrate the tools for you.

Three of the four skills (`teach`, `practice`, `jam`) only run when you invoke them with a slash command. The `explore` skill can also activate automatically when Claude detects you are looking for songs.

## Slash commands

### /ai-jam-session:explore

Browse and discover songs in the library. Accepts a genre, difficulty level, or free-text search query.

```
/ai-jam-session:explore jazz
/ai-jam-session:explore beginner classical
/ai-jam-session:explore "romantic era"
```

**What it does:** Searches the library, shows matching songs with metadata, pulls up registry stats, and recommends a song if you seem undecided. Offers next steps (teach, practice, or get detailed song info).

### /ai-jam-session:teach

Start a structured teaching session for a specific song.

```
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:teach fur-elise
```

**What it does:** Fetches full song info, presents teaching goals and key moments, builds a practice plan, and offers measure-by-measure walkthrough with fingering and dynamics. Can also provide a sing-along in note-names, solfege, contour, or syllables mode.

### /ai-jam-session:practice

Set up a personalized practice session with speed, mode, and voice recommendations.

```
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:practice clair-de-lune intermediate
```

**What it does:** Generates a practice configuration with recommended starting speed, playback mode, effective tempo, and ready-to-paste CLI commands. Identifies trouble spots and suggests sing-along warmups for difficult passages.

### /ai-jam-session:jam

Start a jam session -- improvise, reinterpret, or create your own version of a song.

```
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
/ai-jam-session:jam take-five in a funk style
```

**What it does:** Pulls up the chord progression and melody outline as raw material. Suggests 2-3 creative directions. Composes a new interpretation as a SongEntry, saves it to the library, and plays it back. You can tweak tempo, dynamics, or specific measures after hearing it.

## Agent personalities

The plugin includes two agent personalities that activate automatically based on context. You can also summon them by name.

### piano-teacher

Patient, knowledgeable, and pedagogical. Meets students where they are. Adjusts teaching depth based on song difficulty and student experience. Uses analogies to explain abstract concepts. Celebrates progress.

**Activates for:** Learning, teaching, practice setup, song analysis, music theory questions.

**Teaching approach by level:**
- **Beginner** -- One hand at a time, note-names mode, half-speed practice, plain explanations
- **Intermediate** -- Hands-together practice, solfege mode, phrasing and dynamics discussion
- **Advanced** -- Interpretation choices, harmonic analysis, loop mode for demanding passages, performance preparation

### jam-musician

Laid-back, groove-first, and encouraging. Thinks in chord maps and melody skeletons, not sheet music. Encourages experimentation over correctness.

**Activates for:** Jam sessions, improvisation, reinterpretation, creative exploration.

**Philosophy:** "There are no wrong notes, only unresolved tensions." Music is a conversation. The groove is everything. Structure is a suggestion.

## How agents and skills interact

Skills and agents are separate but complementary. A skill defines a structured workflow (a series of tool calls in a specific order). An agent defines a personality and teaching style. When you run `/ai-jam-session:teach`, the teach skill runs its workflow while the piano-teacher agent shapes the tone and explanations. When you run `/ai-jam-session:jam`, the jam skill runs its workflow while the jam-musician agent keeps the conversation loose and creative.

You do not need to activate an agent manually. The right personality engages automatically based on which skill you invoke or what you ask about in natural language.

## MCP tools

The 15 MCP tools underneath power everything. You rarely need to call them directly -- the skills handle orchestration. Here is the full list for reference:

| Tool | Purpose |
|------|---------|
| `list_songs` | Search and filter the song library |
| `song_info` | Get full metadata, teaching goals, and key moments for a song |
| `registry_stats` | Library overview: total songs, songs per genre, songs per difficulty |
| `teaching_note` | Get the teaching note, fingering, and dynamics for a specific measure |
| `suggest_song` | Get a recommendation based on preferences |
| `list_measures` | Overview of measures in a song or range |
| `practice_setup` | Generate a practice configuration with tempo and mode recommendations |
| `sing_along` | Get a singable representation of the notes (note-names, solfege, contour, or syllables) |
| `ai_jam_session` | Get a jam brief: chord progression, melody outline, style guidance |
| `play_song` | Play a song through system audio |
| `stop_playback` | Stop current playback |
| `add_song` | Save a new song (or jam creation) to the library |
| `remove_song` | Remove a song from the library |
| `set_voice` | Change the MIDI voice/instrument |
| `get_status` | Check server status and current playback state |
