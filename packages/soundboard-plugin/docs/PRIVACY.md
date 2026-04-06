# Privacy

## Data Processing

All text-to-speech processing happens **locally on your machine**. No text,
audio, or metadata is transmitted to any remote server.

## What Is Stored

- **WAV files**: Synthesized audio is written to a local output directory
  (default: `{tempdir}/voice-soundboard/`). Files are ephemeral and cleaned up
  automatically after 240 minutes (configurable via
  `VOICE_SOUNDBOARD_RETENTION_MINUTES`).

- **SFX cache**: Short sound effects (dings, chimes) are cached in
  `{tempdir}/voice_soundboard_sfx/`. These are generated from sine waves, not
  from user content.

## What Is Not Stored

- **Inner monologue**: Ambient narrator entries are held in volatile memory with
  a short TTL (default 4 seconds). They are never written to disk. Sensitive
  content (file paths, API tokens, IPs, passwords, base64 blobs) is redacted
  before the entry is even stored in memory.

- **Logs**: All logging goes to stderr. No log files are created by the plugin.
  Logs contain no tokens, passwords, or credentials.

- **Telemetry**: The plugin collects no telemetry, analytics, or usage data.

## Configuration

| Setting | Default | Env Var |
|---------|---------|---------|
| WAV retention | 240 min | `VOICE_SOUNDBOARD_RETENTION_MINUTES` |
| Delete after play | off | `VOICE_SOUNDBOARD_DELETE_AFTER_PLAY` |
| Output directory | `{tempdir}/voice-soundboard/` | `VOICE_SOUNDBOARD_OUTPUT_ROOT` |
