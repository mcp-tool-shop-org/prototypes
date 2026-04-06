---
title: Library
description: 100 songs across 10 genres at three difficulty levels.
sidebar:
  order: 3
---

The library ships with 100 piano songs covering 10 genres and three difficulty levels. Every song includes per-measure note data, dynamics, fingering, and teaching annotations.

## Genres

The library spans these 10 genres, with 10 songs each:

| Genre | What to expect |
|-------|---------------|
| **Classical** | Bach, Mozart, Beethoven, Chopin, Debussy, Satie -- the canon |
| **Jazz** | Standards and jazz harmony: Autumn Leaves, Take Five, Blue Monk |
| **Pop** | Singable melodies and familiar chord progressions: Let It Be, Imagine, Hallelujah |
| **Blues** | 12-bar blues, shuffle rhythms, and call-and-response patterns |
| **Rock** | Riff-driven songs with strong rhythmic feel |
| **R&B** | Soulful melodies, rich chord voicings, groove-centered playing |
| **Latin** | Bossa nova, salsa, and Latin jazz rhythms |
| **Film** | Movie themes and cinematic piano pieces |
| **Ragtime** | Syncopated left-hand patterns and stride piano technique |
| **New Age** | Ambient, meditative, and atmospheric piano pieces |

## Difficulty levels

Each song is tagged with one of three levels:

**Beginner** -- Simple melodies, mostly single-hand passages, slow tempos, basic chord shapes. Good for first-time players and warming up.

**Intermediate** -- Hands-together playing, moderate tempos, dynamic expression, some chord extensions. The sweet spot for most players.

**Advanced** -- Fast passages, complex rhythms, wide voicings, demanding technique. Concert-level pieces and virtuosic arrangements.

The library is balanced across levels so every genre has songs at every difficulty.

## Browsing the library

Use the explore skill to search by genre, difficulty, or keyword:

```
/ai-jam-session:explore jazz
/ai-jam-session:explore beginner
/ai-jam-session:explore "romantic era"
/ai-jam-session:explore advanced blues
```

Or ask naturally: "What classical songs do you have for beginners?"

The `registry_stats` tool (called automatically by explore) shows the overall breakdown: total song count, songs per genre, and songs per difficulty level.

## Song metadata

Every song in the library includes:

- **Title and composer** -- the piece and who wrote it
- **Genre and difficulty** -- for browsing and filtering
- **Key, tempo, and time signature** -- musical fundamentals
- **Measure count and duration** -- how long the piece is
- **Musical description** -- what makes this piece interesting
- **Teaching goals** -- what a student should focus on when learning it
- **Key moments** -- specific measures worth highlighting (the climax, a tricky passage, a beautiful modulation)
- **Per-measure data** -- notes, dynamics, fingering, and teaching annotations for every measure

## Adding songs

You can add your own songs to the library during a jam session. When you use `/ai-jam-session:jam`, Claude composes a new SongEntry and saves it with the `add_song` tool. Jam creations follow the ID pattern `jam-{source-id}-{style}`.

You can also ask Claude to compose something from scratch: "Write me a 16-bar blues in Bb" or "Create a simple waltz for beginners." The song gets saved to the library and is immediately available for teaching, practice, and future jams.

## Song data format

Under the hood, each song is a structured JSON object called a SongEntry. It contains metadata (title, composer, genre, difficulty, key, tempo, time signature) plus an array of measures. Each measure holds the note data, dynamics marking, fingering suggestions, and an optional teaching annotation. This structure is what makes measure-by-measure teaching, sing-along, and practice setup possible -- every tool reads from the same source of truth.
