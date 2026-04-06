<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## その機能・役割

zip-meta-mapは、AIエージェントが答えを求める3つの質問に対応する、決定論的なメタデータ層を生成します。

- **ここには何があるのか？** - ファイルの一覧（ロールごとに分類され、信頼度スコア付き）
- **まず何が重要か？** - 優先順位付けされた「ここから始める」リスト（抜粋付き）
- **文脈に埋もれることなく、どのように操作すれば良いのか？** - バイト数制限付きの操作手順（ナビゲーションプラン）

## 簡単なデモンストレーション

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

完全な例については、[golden demo output](examples/tiny_python_cli/) を参照してください。

## インストールする

```bash
pip install zip-meta-map
```

または、[pipx](https://pipx.pypa.io/) を使用して：

```bash
pipx install zip-meta-map
```

情報源：

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## GitHubアクション

CI環境で、複合アクションを使用する際に、zip-meta-mapを活用します。

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

このツールをインストールし、メタデータを生成し、処理の概要を記録します。出力される情報には、`index-path`、`front-path`、`profile`、`file-count`、および`warnings-count`が含まれます。概要をプルリクエストのコメントとして投稿するには、`pr-comment: 'true'`を設定してください。

詳細なワークフローの例については、[examples/github-action/](examples/github-action/) を参照してください。

## それが生成する内容

| ファイル | 目的。 |
| I am sorry, but I cannot fulfill this request. I am unable to translate text without receiving the English text first. Please provide the English text you would like me to translate. | 以下の文章を日本語に翻訳してください。 |
| `META_ZIP_FRONT.md` | 人間が理解しやすい説明ページ。 |
| `META_ZIP_INDEX.json` | 機械可読形式の索引（役割、信頼度、計画、セクション、抜粋、リスクフラグ）。 |
| `META_ZIP_REPORT.md` | 詳細なレポートを閲覧できます ( `--report md` オプションを使用)。 |

## コマンドラインインターフェース（CLI）のリファレンス

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## プロフィール

リポジトリの構造に基づいて自動的に検出されます。現在サポートされている機能は以下の通りです。

| プロフィール | 検出者： | 計画。 |
| Please provide the English text you would like me to translate. I am ready to translate it into Japanese. | 承知いたしました。翻訳を開始します。
(Please provide the English text you would like me to translate.) | The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。)
------- |
| `python_cli` | `pyproject.toml`, `setup.py` | 概要、デバッグ、機能追加、セキュリティレビュー、詳細調査. |
| `node_ts_tool` | `package.json`, `tsconfig.json` | 概要、デバッグ、機能追加、セキュリティレビュー、詳細調査. |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | 概要、デバッグ、機能追加、セキュリティレビュー、詳細調査. |

詳細は[docs/PROFILES.md](docs/PROFILES.md)をご参照ください。

## 役割と自信

各ファイルのエントリには、**役割**（限定された語彙）、**信頼度**（0.0～1.0）、および**理由**が含まれています。

| バンド | 範囲。 | 意味。 |
| I am a professional English to Japanese translator. My goal is to accurately convey the meaning and nuances of the original English text while adhering to Japanese grammar, vocabulary, and cultural sensitivities.
Please provide the English text you would like me to translate. | The company is committed to providing high-quality products and services.
(会社は、高品質な製品とサービスを提供することに尽力しています。)
------- | 以下の文章を日本語に翻訳してください。 |
| 高い。 | 0.9以上。 | 強力な構造的信号（ファイル名の一致、プロファイルのエントリポイント）。 |
| 良い。 | 0.7以上。 | パターンマッチング（ディレクトリの命名規則、拡張子と場所の組み合わせ）。 |
| 公正。 | 0.5以上。 | 拡張機能のみ、または弱い位置情報信号。 |
| 低い。 | 0.5未満 | 「不明」と指定されています。その理由は、曖昧さがあるためです。 |

## 段階的な情報開示 (バージョン0.2)

- **ファイルチャンクマップ（32KBを超えるファイル用）:** 安定したID、行範囲、見出し情報
- **モジュール概要:** ディレクトリごとの役割分担と主要ファイル
- **抜粋:** 重要なファイルの冒頭数行
- **リスクフラグ:** `exec_shell`、`secrets_like`、`network_io`、`path_traversal`、`binary_masquerade`、`binary_executable`
- **機能:** `capabilities[]` は、利用可能なオプション機能を示します。

## 安定性

- 仕様バージョンは、semverに似たルールに従います。マイナーバージョンではフィールドが追加され、メジャーバージョンでは互換性が失われる可能性があります。
- `capabilities[]` は、公式の機能連携メカニズムです。
- 未知のフィールドを無視する古いクライアントは、マイナーバージョンアップ後も引き続き動作します。
- 詳細については、[docs/SPEC.md](docs/SPEC.md) を参照してください。

## リポ（レポ取引）の仕組み

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## 貢献する

このプロジェクトは、意図的に小規模なものとして設計されています。もしご協力いただける場合は：

- ヒューリスティック（問題解決の指針）を決定論的に維持する。
- ロールを制限し、細かなニュアンスをタグに含める。
- 新しいヒューリスティックを追加する際には、必ずテストを追加する。
- スキーマを緩める場合は、必ずドキュメント（docs/SPEC.md）とサンプルデータ（goldens）を更新する。

```bash
pytest
```

## ドキュメント

- [仕様書 (v0.2)](docs/SPEC.md) - 生成されるすべてのファイルに対する契約
- [プロファイル](docs/PROFILES.md) - 組み込みのプロジェクトタイププロファイル
- [セキュリティ](SECURITY.md) - 脆弱性報告

## ライセンス

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
