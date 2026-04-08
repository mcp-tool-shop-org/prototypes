<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Dev-Op-Typer

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Windows向け、開発者向けのタイピング練習アプリ。すべてのテストは実際のコードです。**

> Linux/macOS版も利用可能：[linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (Avalonia UI)

## 機能

### 実際のコードでの練習
- **Python, JavaScript, C#, Java, SQL, Bash** の実際のコードスニペットを入力
- 文字ごとの正確性トラッキングと差分ハイライト表示
- 厳密な記号のマッチング：`{ } [ ] ( ) < > ; : , . " ' \``
- 改行とインデントが重要

### アダプティブラーニング
- あなたのスキルレベルに基づいたスマートなスニペット選択
- 言語ごとの Eloレーティングシステム
- セッションプランナー：目標（50%）/ レビュー（30%）/ 挑戦（20%）の組み合わせ
- 文字ごとの間違いヒートマップと弱点トレース
- ガイドモード：弱点に焦点を当てた選択と、マイクロドリル
- 難易度調整（D1～D7）と、快適ゾーンの検出

### ライブ統計
- リアルタイムのWPM（1分あたりの入力文字数）、正確性、エラー数
- セッション完了時の振り返り情報
- トレンド追跡：言語ごとのWPMと正確性の推移
- 疲労検知と休憩の提案
- 弱点パネル：文字レベルでの分析

### 教育とコミュニティ
- スキャフォールド：プログレッシブなコンテキストヒントと「詳細なコンテキスト」レイヤー
- デモンストレーション：代替実装を同等のレベルで表示
- コミュニティからのヒントと難易度評価の表示
- 共有コンテンツパックからのガイダンス
- 構造理解のためのスキルレイヤーパネル

### コンテンツシステム
- 6つの言語で168以上のキャリブレーションスニペット
- ユーザーのスニペットパック：JSONファイルをパックフォルダに配置
- コードペースト：クリップボードから任意のコードを練習コンテンツとして貼り付け
- ファイル/フォルダのインポート：ソースファイルを自動検出された言語でインデックス化
- コンテンツ共有用の`.ldtpack`バンドルのエクスポート/インポート
- コンテンツアドレスID（SHA-256による重複排除）

### オーディオ
- 複数のテーマを持つアンビエントサウンドスケープ
- 機械式キーボードのクリック音（5つのテーマ、各テーマ8つのバリエーション）
- チャンネルごとの音量コントロール（アンビエント、キーボード、UI）
- タイトルバーからのミュート/ミュート解除

### アクセシビリティ
- フルキーボードナビゲーション
- 高コントラストテーマのサポート
- モーションの抑制オプション
- すべてのインタラクティブ要素にAutomationPropertiesを設定

### 永続性
- XP、レベル、言語ごとの評価を含むプロファイル
- セッション間で保存される設定と言語選択
- セッション履歴（最大500件）と、毎月の圧縮
- エンジンチューニングのための名前付きパラメータセットである練習設定

## インストール

### Microsoft Store（推奨）
近日公開予定 — Storeの認証待ち。

### ソースコードからのビルド

**要件：**
- Windows 10 バージョン 1809 以降、または Windows 11
- .NET 10.0 SDK
- Visual Studio 2022（Windows App SDKワークロード付き）またはCLI

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

ビルドされた実行ファイルを起動します。
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## プロジェクト構造

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## キーボードショートカット

| Key | アクション |
|-----| -------- |
| Tab / Shift+Tab | コントロールの移動 |
| Enter | 新しいテストの開始 |
| Escape | 現在のテストのリセット |

## 独自のコードの追加

独自のコードを練習する方法は3つあります。

### オプション1：コードペースト（最も簡単）

1. **設定**パネルを開きます（タイトルバーの⚙をクリック）。
2. **コードペースト**までスクロールします。
3. テキストボックスに任意のコードスニペットを貼り付けます。
4. **追加**をクリックします。言語は自動的に検出されます。
5. あなたのコードがすぐにスニペットのローテーションに追加されます。

### オプション2：ファイルまたはフォルダのインポート

1. **設定**を開き、**インポート**までスクロールします。
2. 単一のソースファイルをインポートするには、**ファイルのインポート**をクリックします。プロジェクト全体をスキャンするには、**フォルダのインポート**をクリックします。
3. アプリは、ファイル拡張子（`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`）に基づいて自動的に言語を検出します。
4. インポートされたコードは、コンテンツハッシュによって重複が排除されます。同じコードが2回追加されることはありません。

### オプション3：スニペットパック（JSON）の作成

練習用のスニペットのコレクションを作成する場合：

1. ユーザーのスニペットフォルダを開きます。
```
%LocalAppData%\DevOpTyper\UserSnippets\
```
（または、設定画面で**スニペットフォルダを開く**をクリックします）

2. 言語名にちなんだJSONファイルを作成します（例：`python.json`）。
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "リスト内包表記",
"difficulty": 3,
"topics": ["リスト", "内包表記"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "辞書内包表記",
"difficulty": 4,
"topics": ["辞書", "内包表記"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. アプリを再起動します。作成したスニペットが、組み込みのスニペットとともに表示されます。

**ヒント：**
- `id`は、すべてのパック全体で一意である必要があります。
- `difficulty`は、1（簡単）から7（難しい）の範囲です。
- `code`は、`\n`で終わる必要があります。
- パックは、最大1レベルのサブディレクトリに整理できます。

### コンテンツの共有

カスタムスニペットを、持ち運び可能な`.ldtpack`ファイルとしてエクスポートします。

1. **設定**を開き、**バンドルのエクスポート**をクリックします。
2. `.ldtpack`ファイルを他のユーザーと共有します。
3. 相手は、**設定** → **バンドルのインポート**からインポートします。

ユーザーが作成したコンテンツのみが転送されます。練習履歴や設定は転送されません。

## プライバシー

Dev-Op-Typerは完全にオフラインで使用できます。データは収集、送信、共有されません。詳細は[PRIVACY.md](PRIVACY.md)を参照してください。

## ライセンス

[MIT](LICENSE)
