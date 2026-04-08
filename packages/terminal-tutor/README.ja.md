<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/terminal-tutor/readme.png" width="400" alt="Terminal Tutor" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/terminal-tutor/actions"><img src="https://github.com/mcp-tool-shop-org/terminal-tutor/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/terminal-tutor/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

ターミナルスキルを実践を通して学ぶ — 実際に作業が行われるターミナル環境の中で。

Terminal Tutorは、実践的な指導システムです。安全な練習環境を提供し、実際のタスクを与え、入力内容を監視し、何が起こったのか、なぜそうなったのかを説明します。サンドボックスやクイズ、ビデオはありません。あなたのシェルの中で、リアルなメンターがあなたをサポートします。

## クイックスタート

```bash
npx @mcptoolshop/terminal-tutor doctor    # Check what's ready
npx @mcptoolshop/terminal-tutor tracks    # See skill tracks
npx @mcptoolshop/terminal-tutor next      # Get your first lesson
npx @mcptoolshop/terminal-tutor start files-and-navigation
```

## 仕組み

1. **レッスンを選択します。** 各レッスンには具体的な目標があります。例えば、「grepを学ぶ」ではなく、「このコードベース全体に散らばっているTODOを見つける」という目標です。

2. **練習環境が作成されます。** 実際のファイル、実際のディレクトリ、実際のgitリポジトリを使用します。ただし、作業は安全なコピー環境で行われ、実際のプロジェクトには影響しません。

3. **実際のコマンドを実行します。** シミュレーションされたものではなく、サンドボックス化されたものでもありません。実際の`grep`、`git`、`sed`、`pip`など、レッスンに必要なコマンドを実行します。

4. **結果が評価されます。** 期待されるファイルが表示されたか、出力に期待されるデータが含まれているかを確認します。入力したコマンドではなく、何が起こったのかを評価します。

5. **もし行き詰まったら、ヒントが得られます。** 最初は簡単なヒント（「再帰的に検索してみてください」など）から始まり、徐々に具体的なヒント（「`grep -r 'TODO' src/`を試してみてください」など）に進みます。一般的な間違いをした場合は、具体的なエラーの原因を診断します。

6. **進捗状況は保存されます。** 後で戻ってきて、中断したところから再開できます。

## スキルトラック

| トラック | レッスン | 実行環境 | 学習内容 |
|-------|---------|---------|-------------------|
| **Shell Fundamentals** | 3 | シェル | ls, cat, grep, find, sed, awk, diff, パイプ |
| **Shell Triage** | 1 | シェル | ps, バックグラウンドジョブ, ログ分析 |
| **Git Survival** | 1 | シェル | init, commit, ブランチ, switch |
| **Python Debugging** | 2 | venv | pytest, エラーメッセージ, pip, インポート, 依存関係 |
| **Service Debugging** | 1 | Docker | ログ, プロセス, 設定, エンドポイント |

## 実行環境

Terminal Tutorは、それぞれ異なる目的のために設計された3つの実行環境を使用します。

- **シェル:** システムのシェル。ファイル操作、テキスト処理、gitに使用します。起動が高速です。
- **venv:** 実際のPython仮想環境。pip、pytest、インポートのデバッグに使用します。実際のvenvを作成し、実際のパッケージをインストールします。
- **Docker:** コンテナ。サービスの問題解決、プロセスの調査、完全な隔離が必要なタスクに使用します。デフォルトではネットワークが無効になっています。

`terminal-tutor doctor`コマンドを実行すると、システムで使用可能な実行環境を確認できます。

## コマンドリファレンス

```
terminal-tutor list                    Show available lessons
terminal-tutor start <lesson-id>       Start or resume a lesson
terminal-tutor tracks                  Show skill tracks and progress
terminal-tutor track <track-id>        Show detailed track progress
terminal-tutor next                    Suggest next lesson
terminal-tutor mastery <lesson-id>     Show fluency signal for completed lesson
terminal-tutor progress                Show all lesson progress
terminal-tutor doctor                  Check system readiness
terminal-tutor runtimes                Show runtime availability
terminal-tutor reset <lesson-id>       Reset a lesson
terminal-tutor help                    Show help
```

## Claude Codeユーザー向け

Terminal Tutorは、会話インターフェースとしてClaude Codeと連携するように設計されています。Claudeは以下を実行できます。
- レッスンを開始し、手順を自然な形で提示する
- チュートルのエンジンを通じてコマンドを実行し、結果を評価する
- ヒントだけでは説明できないエラーを文脈の中で説明する
- 予期しない質問やアプローチに対応する

CLIは構造化されたJSONを出力するため、Claudeがレッスンの状態を解析し、結果を評価し、学習者を導きやすくなっています。

## セキュリティ

Terminal Tutorは、**ローカルでのみ**動作し、テレメトリ、ネットワーク接続、認証情報の取り扱いを行いません。

- **アクセスするデータ:** 一時的な作業ディレクトリ（OSの一時ディレクトリ）、レッスン進捗状況（`~/.terminal-tutor/progress.json`）
- **アクセスしないデータ:** プロジェクト、ホームディレクトリ、システム設定、ブラウザデータ、認証情報
- **テレメトリは収集されず、送信もされません。**
- **作業環境の隔離:** 練習ファイルは隔離された一時ディレクトリに作成されます。`workspace_only`という安全機能により、コマンドが練習領域から抜け出すのを防ぎます。Dockerレッスンは、デフォルトでネットワークが無効になって実行されます。
- **権限:** OSの一時ディレクトリと`~/.terminal-tutor/`への読み書きのみが必要です。管理者権限は不要で、要求もありません。

脆弱性報告ポリシーについては、[SECURITY.md](SECURITY.md)を参照してください。

## レッスンの作成

教材作成に関する方針については、[AUTHORING.md](AUTHORING.md) を参照してください。主なルール：

- 各教材につき、1つの YAML ファイルを使用
- 結果に基づいた検証（実行された内容を検証し、使用されたコマンドを検証するものではない）
- 指示から解答への段階的なヒント
- 教材の要件を満たす、最も軽量な実行環境を使用
- すべての教材には、状況設定となる人間的なシナリオを示す `flavor` が必須

## ライセンス

MIT

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) が作成
