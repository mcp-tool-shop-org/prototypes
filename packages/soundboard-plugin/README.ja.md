<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

- **12種類の音声**で、感情を認識して適切な音声を自動選択 (喜び、怒り、悲しみ、恐怖、驚き、緊急、落ち着き、中立)
- **複数話者の対話**を、自動キャスティング、舞台指示、速度調整機能で実現
- **スマートな分割**により、長いテキストを文の境界で分割し、中断にも対応
- **SSML-lite**により、細かな制御が可能 (一時停止、強調、音程、速度)
- **SFXタグ**により、純粋なPythonでWAV形式の効果音をインラインで生成 (`<ding>`, `<chime>`)
- **内面独白**機能は、レート制限と自動的な情報マスキングを適用
- **再生の安定性**を確保するため、シングルスレッドで動作し、30秒間の監視タイマー、キューイングポリシー (中断/キューイング/破棄) を採用
- **セキュリティ重視**で、パスサンドボックス、並行処理制御、構造化されたエラー処理、WAVファイル検証を実施

## Slash Commands

| コマンド | 機能 |
|---------|-------------|
| `/soundboard:speak` | 感情検出とSSMLサポートを備えた一般的なテキスト読み上げ |
| `/soundboard:narrate` | コードの解説を、適応的な速度で読み上げ |
| `/soundboard:notify` | ビルド、テスト、デプロイなどのイベントに関する音声通知 |
| `/soundboard:voices` | 利用可能な音声とプリセットの一覧を表示 |
| `/soundboard:voice-status` | エンジン状態、バックエンド情報、制限事項を表示 |

さらに、以下の機能も利用可能: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## クイックスタート

### 前提条件

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (音声合成エンジン)
- Python >= 3.10
- Windows (主要な対応OS。再生には`winsound`を使用)

### インストール

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

### 試してみる

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## アーキテクチャ

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

## セキュリティ

このプラグインは、**完全にローカルマシン上で動作**します。ネットワーク接続は不要で、テレメトリーも行いません。クラウドAPIも使用しません (ただし、リモート音声バックエンドを設定した場合は使用します)。

| プロパティ | 実装 |
|----------|---------------|
| 入力制限 | 最大10,000文字、速度制限、チャンク/行数の制限 |
| 音声の許可リスト | 12種類の事前承認済みの音声のみ利用可能。それ以外の音声は拒否されます。 |
| パスサンドボックス | WAV出力は、`{tempdir}/voice-soundboard/` フォルダに限定されます。 |
| 並行処理 | 一度に1つの音声合成のみ可能 (セマフォによる制御) |
| エラー処理 | 構造化されたJSON形式のエラーメッセージ。トレースIDは含まれますが、スタックトレースはクライアントには表示されません。 |
| 機密情報のマスキング | パス、トークン、IPアドレス、base64エンコードされたデータ、key=value形式のデータは、ログから削除されます。 |
| WAVファイル検証 | 出力されるすべてのWAVファイルについて、RIFF/WAVEのヘッダーと最小サイズチェックを実施します。 |

詳細については、[`SECURITY.md`](SECURITY.md) を参照してください。また、[`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) では、STRIDE-liteによる脅威モデルについて説明しています。

## 音声

プラグインには、12種類の音声が同梱されています。

| 音声 | ID | 性別 | スタイル |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | 力強く、威厳がある (デフォルト) |
| Eric | `am_eric` | M | エネルギッシュ、緊急 |
| Liam | `am_liam` | M | 温かく、親しみやすい |
| Onyx | `am_onyx` | M | 深く、落ち着いた |
| Aoede | `af_aoede` | F | クリアで、表現豊か |
| Jessica | `af_jessica` | F | プロフェッショナル、中立的 |
| Sky | `af_sky` | F | 明るく、フレンドリー |
| Alice | `bf_alice` | F | イギリス英語、落ち着いた |
| Emma | `bf_emma` | F | イギリス英語、温かい |
| Isabella | `bf_isabella` | F | イギリス英語、上品 |
| George | `bm_george` | M | イギリス英語、フォーマル |
| Lewis | `bm_lewis` | M | イギリス英語、落ち着いた |

## Configuration

設定はすべて、環境変数を通じて行います (設定ファイルは使用しません)。

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | WAV出力ディレクトリ |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (無効) | 各ツールごとのレート制限のリセット時間 |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | この期間より古いWAVファイルを自動的に削除 |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | 内なる独り言システムを有効にする |

## 開発

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

## プロジェクト構成

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

## セキュリティとデータ範囲

- **アクセスされるデータ:** TTS合成のためのテキスト入力を読み込みます。ローカル音声エンジンを使用して音声を処理します。SSMLの解析には、安全なサブセットパーサーを使用します。内なる独り言システムは、保存前に機密情報を削除します。
- **アクセスされないデータ:** デフォルトでは、ネットワークへの外部接続はありません。テレメトリー、分析、トラッキング機能はありません。一時的なWAVファイル以外のユーザーデータの保存はありません。リモート音声バックエンドは、オプションで利用可能です。
- **必要な権限:** 音声エンジンの読み取り権限。オプションで、WAV出力ディレクトリへの書き込み権限。

## 評価

| ゲート | ステータス |
|------|--------|
| A. セキュリティ基準 | 合格 |
| B. エラー処理 | 合格 |
| C. 運用者向けドキュメント | 合格 |
| D. リリース時の品質管理 | 合格 |
| E. 認証 | 合格 |

## ライセンス

[MIT](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
