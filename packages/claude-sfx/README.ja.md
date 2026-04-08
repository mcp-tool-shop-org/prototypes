<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-sfx"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-sfx" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) のための、プロシージャルオーディオフィードバック機能。 ツール呼び出し、ファイル編集、検索、git push、エージェントの起動など、すべての操作に対して、数学に基づいて生成された独特のサウンドが再生されます（オーディオファイルを使用していません）。

## クイックスタート

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

これで完了です。Claude Code は、動作中にサウンドを再生するようになります。

## オーディオフィードバックの利点

AIエージェントがお客様の代わりに読み込み、書き込み、検索を行い、デプロイを行う場合、状況の把握が難しくなります。 画面に表示されるテキストをただ見ているだけになります。 オーディオフィードバックは、状況を把握するのに役立ちます。

- **アクセシビリティ:** ターミナルを見なくても、状態の変化、エラー、完了などを音声で把握できます。
- **効率:** テストが成功したか、push が完了したかを、コンテキストを切り替えることなく音声で知ることができます。
- **没入感:** エージェントが単なるブラックボックスではなく、協力者のように感じられます。

## 7つのアクション

Claude Code のすべての操作は、7つの基本的なアクションのいずれかに対応します。 修飾子（ステータス、範囲、方向）は、サウンドを変更しますが、一貫性を保ちます。

| アクション | トリガー | サウンド |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | 緩やかな上昇するサイン波 — 何かが開始される |
| **transform** | `Edit` | FMテクスチャードパルス — 形状の変更 |
| **commit** | `Write`, `NotebookEdit`, `git commit` | 鋭いスタンプ音 — 完了 |
| **navigate** | `Grep`, `Glob` | ソナーの音 — スキャン |
| **execute** | `Bash`, `npm test`, `tsc` | ノイズと音の組み合わせ — 機械的な動作 |
| **move** | `mv`, `cp`, サージェントの起動 | 風の音 — 空気移動 |
| **sync** | `git push`, `git pull` | ドラマチックな風の音 + 音のアンカー |

### 修飾子

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### スマートなBash検出

フックハンドラは、Bashコマンドを検査して、適切なサウンドを選択します。

| Bashコマンド | アクション | ステータス |
|---|---|---|
| `git push` | sync (成功) | 正常終了 |
| `git pull` | sync (失敗) | 正常終了 |
| `npm test`, `pytest` | エラー | 正常終了 |
| `tsc`, `npm run build` | エラー | 正常終了 |
| `mv`, `cp` | 移動 | — |
| `rm` | 移動 | 警告 |
| その他 | エラー | 正常終了 |

## プロファイル

1つのフラグで、サウンド全体を変更できるサウンドパレット。

| プロファイル | サウンド |
|---|---|
| **minimal** (default) | サイン波の音 — 控えめで、プロフェッショナル、日常的に使用可能 |
| **retro** | 正方形波の8ビットの音 — 楽しいが、コントロールされている |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### カスタムプロファイル

`profiles/minimal.json` をコピーし、合成パラメータを編集して、ロードします。

```bash
claude-sfx play navigate --profile ./my-profile.json
```

JSON内のすべての数値は、シンセエンジンに直接対応します。波形、周波数、持続時間、エンベロープ（ADSR）、FM深度、帯域幅、ゲインなどです。

## 迷惑防止機能

製品と玩具の違いを生み出す機能。

| 機能 | 動作 |
|---|---|
| **Debounce** | 同じアクションが200ms以内に発生した場合 → 1つのサウンド |
| **Rate limit** | 10秒のウィンドウあたり最大8つのサウンド |
| **Quiet hours** | 設定された時間帯中は、すべてのサウンドを抑制 |
| **Mute** | インスタントで切り替え可能、セッションの再起動後も有効 |
| **Volume** | 0～100のゲインコントロール |
| **Per-verb disable** | 不要な特定のサウンドを無効にできます |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## 環境音（長時間の操作）

ビルド、デプロイ、大規模なテストスイートなど、完了に時間がかかるコマンドの場合：

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## セッションサウンド

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## すべてのコマンド

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## 仕組み

オーディオファイルは一切使用していません。 すべてのサウンドは、実行時に数学に基づいて生成されます。

- **発振器:** サイン波、正方形波、のこぎり波、三角波、ホワイトノイズ
- **ADSRエンベロープ:** アタック、ディケイ、サスティン、リリース
- **FM合成:** テクスチャを作成するための周波数変調
- **ステートバリアブルフィルター:** 誰音をバンドパスフィルター処理して、風の音を生成
- **周波数スイープ:** 移動を表現するための線形補間
- **ラウドネスリミッター:** ソフトニーコンプレッション、ハードリミット

このパッケージ全体は約2,800行のTypeScriptで、依存関係はゼロです。 サウンドはPCMバッファとして生成され、メモリ内でWAVにエンコードされ、OSのネイティブオーディオプレイヤー（Windowsの場合はPowerShell、macOSの場合はafplay、Linuxの場合はaplay）を介して再生されます。

## セキュリティとプライバシー

**アクセスするデータ:** `~/.claude-sfx/config.json` (設定)、`.claude/settings.json` (フック登録)。音声バッファはメモリ内で生成され、`export` コマンドを実行しない限り、ディスクに書き込まれません。

**アクセスしないデータ:** ソースコード、Gitの履歴、ネットワーク、認証情報、環境変数。テレメトリーデータは収集も送信も行われません。音声ファイルはダウンロードされず、すべての音は数学的な計算に基づいてローカルで生成されます。

**権限:** 設定ファイルとフックに対するファイルシステムの読み書き権限、OSのオーディオプレイヤーの呼び出し権限。詳細なポリシーについては、[SECURITY.md](SECURITY.md) を参照してください。

## 必要条件

- Node.js 18 以降
- Claude Code
- システムのオーディオ出力（スピーカーまたはヘッドホン）

## ライセンス

[MIT](LICENSE)

---

作成者: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
