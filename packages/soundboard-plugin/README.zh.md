<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/soundboard-plugin/main/assets/logo-dark.jpg" alt="Soundboard Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="https://pypi.org/project/voice-soundboard-plugin/"><img src="https://img.shields.io/pypi/v/voice-soundboard-plugin" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  A <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins">Claude Code plugin</a> that speaks code walkthroughs, announces build results,<br>
  and adds context-aware text-to-speech to your development workflow.
</p>

---

## Highlights

- **12 种精选语音**，具有情感感知路由功能（喜悦、愤怒、悲伤、恐惧、惊讶、紧急、平静、中性）。
- **多说话者对话**，支持自动配音、舞台提示和语速调整。
- **智能分段**，在句子边界处分割长文本，并支持中断功能。
- **轻量级 SSML**，提供精细控制（暂停、强调、音高、语速）。
- **SFX 标签**，生成纯 Python WAV 提示音（`<ding>`、`<chime>`）。
- **内部独白**，具有速率限制和自动脱敏功能的后台系统。
- **播放安全机制**，采用单线程工作模式，30 秒看门狗，队列策略（中断/入队/丢弃）。
- **安全至上**，路径沙箱、并发控制、结构化错误信息、WAV 文件验证。

## Slash Commands

| Command | What it does |
|---------|-------------|
| `/soundboard:speak` | General TTS with emotion detection and SSML support |
| `/soundboard:narrate` | Code walkthrough narration with adaptive pacing |
| `/soundboard:notify` | Spoken workflow notifications (build, test, deploy events) |
| `/soundboard:voices` | List available voices and presets |
| `/soundboard:voice-status` | Engine health, backend info, enforced limits |

Plus the full MCP tool surface: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## Quick Start

### Prerequisites

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (the synthesis engine)
- Python >= 3.10
- Windows (primary target; uses `winsound` for playback)

### Install

```bash
# 1. Install the voice engine
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### Try it

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## Architecture

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge.py ──── security/guardrails.py
    |                     concurrency gate
    |                     rate limiter
    |                     structured errors
    v
speech pipeline
    ├── chunking.py        smart sentence splitting
    ├── ssml_lite.py       safe SSML subset parser
    ├── emotion/           8 emotions + voice routing
    ├── dialogue/          multi-speaker parser + casting
    ├── sfx_parser.py      <ding>/<chime> WAV generation
    ├── orchestrator.py    multi-chunk synthesis loop
    └── concat.py          WAV concatenation
    v
voice-soundboard engine
    ├── Kokoro (local, default)
    ├── Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker.py ──── single-thread queue
    ├── 30s watchdog timer
    ├── interrupt / enqueue / drop policies
    └── retention.py (auto-cleanup)
    v
PCM audio -> speakers
```

## Security

This plugin runs **entirely on your machine**. No network calls, no telemetry, no cloud APIs (unless you configure a remote voice backend).

| Property | Implementation |
|----------|---------------|
| Input bounds | 10,000 char max, clamped speed, chunk/line limits |
| Voice allowlist | 12 pre-approved voices, unknown rejected |
| Path sandboxing | WAV output confined to `{tempdir}/voice-soundboard/` |
| Concurrency | Single synthesis at a time (semaphore gate) |
| Error safety | Structured JSON errors with trace IDs, no stack traces to client |
| Secret redaction | Paths, tokens, IPs, base64, key=value stripped from logs |
| WAV validation | RIFF/WAVE magic + minimum size check on every output |

See [`SECURITY.md`](SECURITY.md) for the full policy and [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) for the STRIDE-lite threat model.

## Voices

12 curated voices ship with the plugin:

| Voice | ID | Gender | Style |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Powerful, authoritative (default) |
| Eric | `am_eric` | M | Energetic, urgent |
| Liam | `am_liam` | M | Warm, conversational |
| Onyx | `am_onyx` | M | Deep, steady |
| Aoede | `af_aoede` | F | Clear, expressive |
| Jessica | `af_jessica` | F | Professional, neutral |
| Sky | `af_sky` | F | Bright, friendly |
| Alice | `bf_alice` | F | British, composed |
| Emma | `bf_emma` | F | British, warm |
| Isabella | `bf_isabella` | F | British, refined |
| George | `bm_george` | M | British, formal |
| Lewis | `bm_lewis` | M | British, measured |

## Configuration

All configuration is via environment variables (no config files):

| Variable | Default | 描述 |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | WAV 输出目录 |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (禁用) | 每个工具的速率限制冷却时间 |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | 自动删除比此日期旧的 WAV 文件 |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | 启用内心独白系统 |

## 开发

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run the test suite (323 tests)
python -m pytest tests/ -q

# Run the security battery only
python -m pytest tests/test_security.py -q

# Pre-release gate (tests + optional pip-audit)
python scripts/ship_gate.py
```

## 项目结构

```
soundboard-plugin/
├── voice_soundboard_plugin/
│   ├── bridge/          MCP stdio server + health checks
│   ├── speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
│   │   ├── dialogue/    Multi-speaker parser + auto-casting
│   │   └── emotion/     Emotion detection + voice routing
│   ├── playback/        Single-thread worker + retention
│   ├── ambient/         Inner monologue subsystem
│   ├── security/        Guardrails, fs sandbox, redaction, WAV validation
│   └── audio/           Audio utilities
├── tests/               323 tests (unit + integration + security battery)
├── scripts/             ship_gate.py pre-release script
├── docs/                Threat model, privacy policy, release checklist
├── assets/              Logo and branding
├── SECURITY.md          Security policy + vulnerability reporting
└── pyproject.toml       Project metadata + dependencies
```

## 安全性和数据范围

- **访问的数据：** 读取用于文本转语音合成的文本输入。通过本地语音引擎处理语音。SSML 解析使用安全的子集解析器。内心独白在存储之前会删除敏感信息。
- **未访问的数据：** 默认情况下，不进行任何网络数据传输。不收集任何遥测、分析或跟踪数据。除了临时 WAV 文件之外，不存储任何用户数据。远程语音后端是可选功能。
- **所需权限：** 访问语音引擎的读取权限。可选的，用于 WAV 输出目录的写入权限。

## 评估报告

| 测试环节 | 状态 |
|------|--------|
| A. 安全基线 | 通过 |
| B. 错误处理 | 通过 |
| C. 操作员文档 | 通过 |
| D. 发布流程 | 通过 |
| E. 身份验证 | 通过 |

## 许可证

[MIT](LICENSE)

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
