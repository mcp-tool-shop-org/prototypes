# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-27

### Added

- 10 built-in piano songs across 10 genres (classical, jazz, pop, blues, rock, R&B, latin, film, ragtime, new age)
- Three-layer hybrid format: metadata, musical language, and code-ready measures
- MIDI ingest pipeline: drop .mid files, write JSON config, run build
- Registry API: getSong, getAllSongs, searchSongs, getStats, validateSong
- Zod schemas for runtime validation (SongConfigSchema, MusicalLanguageSchema)
- MIDI-to-SongEntry converter with hand separation, chord detection, measure slicing
- Scientific pitch notation with inline duration format
- SECURITY.md with vulnerability reporting and data scope
- SHIP_GATE.md and SCORECARD.md for product standards

[1.0.0]: https://github.com/mcp-tool-shop-org/ai-music-sheets/releases/tag/v1.0.0
