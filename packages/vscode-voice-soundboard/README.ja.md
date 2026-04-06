<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/vscode-voice-soundboard/readme.png" alt="Voice Soundboard" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.vscode-voice-soundboard.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/vscode-voice-soundboard"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/vscode-voice-soundboard" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/vscode-voice-soundboard/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

テキスト読み上げ機能を提供する拡張機能。48種類の音声、プリセット、マルチスピーカーでの会話に対応。 [MCP Voice Soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)によって実現されています。

## 機能

- **サイドバーパネル:** 「発話」「音声」「会話」のタブ
- **48種類の音声:** 9の言語に対応 (英語、日本語、中国語、スペイン語、フランス語、ヒンディー語、イタリア語、ポルトガル語)
- **5つのプリセット:** アシスタント、ナレーター、アナウンサー、語り手、ささやき
- **マルチスピーカーでの会話:** スクリプトを作成し、各スピーカーに音声を割り当てて再生
- **発話選択:** コードまたはテキストを選択し、`Ctrl+Shift+S`キーを押す
- **クロスプラットフォーム対応:** Windows、macOS、Linuxで音声再生が可能

## 始め方

1. 拡張機能をインストール
2. MCP Voice Soundboardのサーバーが自動的に起動
3. アクティビティバーにあるマイクアイコンをクリック
4. テキストを入力し、「発話」をクリック

## コマンド

| コマンド | ショートカット | 説明 |
|---------|----------|-------------|
| Voice Soundboard: テキストの発話... | — | 発話するテキストを入力 |
| Voice Soundboard: 選択範囲の発話 | `Ctrl+Shift+S` | エディタで選択したテキストを発話 |
| Voice Soundboard: 発話を停止 | — | 現在の再生を停止 |
| Voice Soundboard: 音声の変更 | — | 音声選択のクイックピッカー |
| Voice Soundboard: パネルの表示/非表示 | — | サイドバーの表示/非表示を切り替え |
| Voice Soundboard: 会話をWebVTT形式でエクスポート | — | 会話スクリプトを`.vtt`形式の字幕ファイルとしてエクスポート |

## 会話のエクスポート

「会話」タブでマルチスピーカーのスクリプトを作成し、各スピーカーに音声を割り当てて、「WebVTTのエクスポート」をクリックします。拡張機能が各行を合成し、音声の長さに応じたタイムコードを計算し、[WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API)形式の字幕ファイルを保存します。

エクスポートされた`.vtt`ファイルには、音声タグ (`<v Speaker>`) が含まれており、ビデオプレーヤー、字幕エディター、またはアクセシビリティツールで使用できます。

## 設定

| 設定項目 | デフォルト値 | 説明 |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | デフォルト音声ID |
| `voiceSoundboard.speed` | `1.0` | 発話速度 (0.5～2.0) |
| `voiceSoundboard.backend` | `python` | TTSエンジン (python/http/mock) |
| `voiceSoundboard.autoStart` | `true` | 起動時にサーバーを自動起動 |
| `voiceSoundboard.format` | `wav` | 音声出力形式 |

## セキュリティとデータ範囲

- **ローカルエンジン (デフォルト):** Python/Kokoro TTSは完全にローカルマシン上で動作します。ネットワークへのアクセスは不要です。
- **クラウドエンジン (オプション):** テキストをユーザーが設定したTTS API (OpenAI/ElevenLabs) に送信します。APIキーが必要です。
- **音声再生:** `spawn`コマンドを使用し、シェルではなく引数配列を使用します。詳細は[SECURITY.md](SECURITY.md)を参照してください。
- **テレメトリーは収集および送信されません。**

## ライセンス

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
