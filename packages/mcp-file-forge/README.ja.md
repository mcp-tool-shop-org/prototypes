<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## 概要

MCP File Forgeは、[Model Context Protocol](https://modelcontextprotocol.io) (MCP) サーバーであり、AIエージェントがローカルファイルシステムにアクセスする際に、サンドボックス環境とポリシーによる制御を提供します。 5つのカテゴリに分けて、**17種類のツール**を提供します。

| カテゴリ | ツール | 説明 |
| ---------- | ------- | ------------- |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | ファイルの読み込みとディレクトリ一覧の表示 |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | ファイルの作成、編集、コピー、移動、削除 |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | ファイル名パターンまたは内容によるファイルの検索 |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | ファイルサイズ、タイムスタンプ、存在確認 |
| **Scaffolding** | `scaffold_project`, `list_templates` | テンプレートを使用してプロジェクトを作成（変数置換可能） |

主な機能：

- **サンドボックス化:** 実行は、明示的に許可されたディレクトリに限定されます。
- **読み取り専用モード:** 環境変数を変更することで、すべての書き込み機能を無効にできます。
- **シンボリックリンク対応:** デフォルトではシンボリックリンクを追跡しないため、サンドボックスからのエスケープを防ぎます。
- **Windows優先:** Windowsのパスと規約に合わせて設計されており、他の環境でも動作します。
- **テンプレートエンジン:** `{{var}}` / `${var}` による変数置換に加え、パスレベルでの `__var__` による名前変更が可能です。

---

## インストール

```bash
npm install -g @mcptoolshop/file-forge
```

または、npxで直接実行します。

```bash
npx @mcptoolshop/file-forge
```

---

## Claude Desktopの設定

`claude_desktop_config.json` に以下の項目を追加します。

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

グローバルにインストールした場合は、直接実行ファイルを参照できます。

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## ツールの参照

### 読み込み

| ツール | 説明 | 主要なパラメータ |
| ------ | ------------- | ---------------- |
| `read_file` | ファイルの内容を読み込む | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | ディレクトリの内容を一覧表示する | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | 複数のファイルをまとめて読み込む | `paths`, `encoding?`, `fail_on_error?` |

### 書き込み

| ツール | 説明 | 主要なパラメータ |
| ------ | ------------- | ---------------- |
| `write_file` | ファイルへの書き込みまたは上書き | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | ディレクトリの作成 | `path`, `recursive?` |
| `copy_file` | ファイルのコピーまたはディレクトリのコピー | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | ファイルの移動または名前変更 | `source`, `destination`, `overwrite?` |
| `delete_file` | ファイルの削除またはディレクトリの削除 | `path`, `recursive?`, `force?` |

### 検索

| ツール | 説明 | 主要なパラメータ |
| ------ | ------------- | ---------------- |
| `glob_search` | globパターンによるファイルの検索 | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | 正規表現によるファイル内容の検索 | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | 正規表現を使用しないテキスト検索 | `text`, `path?`, `file_pattern?`, `max_results?` |

### メタデータ

| ツール | 説明 | 主要なパラメータ |
| ------ | ------------- | ---------------- |
| `file_stat` | ファイル/ディレクトリの統計情報 | `path` |
| `file_exists` | 存在確認と種類の確認 | `path`, `type?` (`file` / `directory` / `any`) |
| `get_disk_usage` | ディレクトリのサイズ内訳 | `path`, `max_depth?` |
| `compare_files` | 2つのパスの比較 | `path1`, `path2` |

### テンプレート

| ツール | 説明 | 主要なパラメータ |
| ------ | ------------- | ---------------- |
| `scaffold_project` | テンプレートからプロジェクトを作成 | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | 利用可能なテンプレートの一覧表示 | `category?` |

詳細なパラメータ、例、およびエラーコードは、[HANDBOOK.md](HANDBOOK.md) に記載されています。

---

## 環境変数

| 変数 | 説明 | デフォルト値 |
| ---------- | ------------- | --------- |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | 許可されたルートディレクトリのカンマ区切りリスト | `.` (カレントディレクトリ) |
| `MCP_FILE_FORGE_DENIED_PATHS` | 禁止されたパスのglobパターン (カンマ区切り) | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | すべての書き込み操作を無効にする | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | ファイルの最大サイズ (バイト) | `104857600` (100 MB) |
| `MCP_FILE_FORGE_MAX_DEPTH` | 最大再帰深度 | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | サンドボックス外のシンボリックリンクを追跡する | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | カンマ区切りのテンプレートディレクトリ | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | ログの詳細度 (`error`, `warn`, `info`, `debug`) | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | ログファイルのパス (stderrに加えて) | _なし_ |

---

## 設定ファイル

作業ディレクトリ内またはその上位ディレクトリに `mcp-file-forge.json` (または `.mcp-file-forge.json`) を作成します。

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

設定の優先順位 (最も優先されるものが優先されます):

1. 環境変数
2. 設定ファイル
3. デフォルト設定

---

## セキュリティ

MCP File Forge は、AIエージェントが指定された作業領域から逸脱しないように、いくつかの保護機能を備えています。

- **パスサンドボックス化:** すべてのパスが絶対パスに解決され、I/O 操作が行われる前に、`allowed_paths` リストに対してチェックされます。
- **禁止パス:** 許可されたディレクトリ内でもブロックされるグローブパターン (例: `**/secrets/**`)。
- **シンボリックリンク保護:** デフォルトではシンボリックリンクは追跡されません。シンボリックリンクのターゲットがサンドボックス外にある場合、操作は拒否されます。
- **パストラバーサル検出:** サンドボックスから抜け出す `..` シーケンスは拒否されます。
- **サイズ制限:** `max_file_size` を超えるファイルは、メモリ不足を防ぐために拒否されます。
- **深さ制限:** 再帰的な操作は `max_depth` レベルで制限されます。
- **読み取り専用モード:** `MCP_FILE_FORGE_READ_ONLY=true` を設定すると、`write_file`、`create_directory`、`copy_file`、`move_file`、`delete_file`、および `scaffold_project` が無効になります。
- **ヌルバイトの拒否:** `\0` を含むパスは拒否されます。
- **Windows の長いパスガード:** 32,767 文字を超えるパスは拒否されます。

---

## ドキュメント

| ドキュメント | 説明 |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | 詳細: セキュリティモデル、ツールリファレンス、テンプレート、アーキテクチャ、FAQ |
| [CHANGELOG.md](CHANGELOG.md) | リリース履歴 (Keep a Changelog 形式) |
| [docs/PLANNING.md](docs/PLANNING.md) | 内部計画および調査ノート |

---

## 開発

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## ライセンス

[MIT](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> によって作成されました。
