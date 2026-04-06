<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> スペース商人のRPG。コマンドラインインターフェース。前提条件なしで、npxを使ってインストール可能。

```bash
npx @mcptoolshop/star-freight
```

または、グローバルにインストールすることもできます。

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

Python、pip、またはビルドツールは不要です。あらかじめコンパイルされたバイナリがダウンロードされ、SHA256で検証され、ローカルにキャッシュされます。

---

## ゲームについて

あなたは元は軍のパイロットでした。しかし、不名誉な扱いを受けました。今は、ボロボロの船と、何の信用も持たない状態で、あなたが到着する前からすでに動き出している星系を航行する船長です。

**Star Freight**は、政治的に分裂した星系を舞台にした、貨物輸送が中心のタクティカルRPGです。5つの文明、1つの経済、そして同じ人生を2回生きることを許さない4つの真実があります。

あなたは、文化によって交渉方法が変わるドッキングステーションに停泊します。地形によって戦闘方法が変わるルートを選びます。乗組員を雇うことで、できること、アクセスできること、そして負うべき義務が変わります。契約を取ることで、最初は単純に見えても、書類手続きが煩雑になったり、物資不足で価格が変動したり、積載物が証拠品であることが判明したりします。

## なぜそれが他のゲームと違うと感じられるのか

**乗組員は絶対的なルールです。** Thalは単なる「修理ボーナス+10%」ではありません。Thalこそが、なぜあなたがKethのステーションに停泊できるのか、なぜあなたの船が非常時の修理能力を持っているのか、そしてなぜあなたが医療用貨物が季節と一致していないことに気づいたのか、その理由です。Thalを失うと、同時に3つのシステムが機能しなくなります。

**戦闘はキャンペーンイベントです。** 勝利は、回収できるクレジットと派閥からの評価をもたらします。撤退は、廃棄された貨物と、逃げ出す人物という評判を招きます。敗北は、没収された貨物、負傷した乗組員、そしてプレミアム料金で最寄りのステーションまでゆっくりと進む船を意味します。

**文化は社会的な論理です。** Kethは単に価格が違うだけではありません。彼らは季節ごとの生物学的カレンダーを持っており、それが贈り物をする意味や、取引を強要することが侮辱になるタイミングを変えます。Veshanは挑戦してきます。そして、拒否することは敗北よりも悪い結果をもたらします。

**調査は人生から生まれます。** 医療用貨物が季節と一致していないことに気づくのは、あなたがそれを輸送しているからです。陰謀は自ら明らかにされることはありません。あなたは仕事をしているうちに、偶然それに気づくのです。

## 世界

5つの文明が、Thresholdと呼ばれる星系を共有しています。

**The Terran Compact（テランコンパクト）**：官僚的な人間政府。彼らはあなたを不名誉な扱いをしました。彼らとの関係を再構築するには、許可、忍耐、そしてプライドを捨てることが必要です。

**The Keth Communion（ケス・コミュニオン）**：生物学的カレンダーに基づいた昆虫型の集合体。季節を理解していれば、星系で最も有利な条件を得られます。しかし、理解していなければ、評判は急速に低下します。

**The Veshan Principalities（ヴェシャン・プリンシパリティーズ）**：名誉と債務に執着する爬虫類の封建的な家。債務台帳は単なる飾りではありません。それは影響力です。

**The Orryn Drift（オリーン・ドリフト）**：移動式の仲介文明。彼らは誰とでも取引し、すべてを知っており、そのすべてに対して料金を請求します。

**The Sable Reach（セイブル・リーチ）**：海賊の集団、古代技術の回収業者、そしてテランコンパクトが忘れ去りたい人々。法律も慣習もありません。返金もありません。

## 3つの船長のタイプ

**救援船長。** 規律を守り、信頼に基づいてアクセスを許可され、公的な結果を伴います。あなたは人々を養い、その結果として正当性の罠にはまります。

**グレーランナー。** 書類による影響力、タイミングの悪用、制度的なリスク。あなたは、読みにくくすることで利益を得ます。

**名誉船長。** 直接対決、家同士の政治、評判の変動。あなたは問題を直接解決します。

これらはクラスではありません。これらはあなたの選択によってあなたが変化したものです。

## このパッケージの仕組み

このnpmパッケージは、[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher)を使用して、以下の処理を行います。

1. [GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases) から、あらかじめコンパイルされた Star Freight のバイナリをダウンロードしてください。
2. SHA256 チェックサムを確認してください。
3. ローカルにキャッシュします (`~/.cache/mcptoolshop/star-freight/`)。
4. 引数とともに実行してください。

### キャッシュ管理

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### 対応プラットフォーム

| プラットフォーム | バイナリ |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## セキュリティ

**脅威モデル:** このパッケージは、HTTPS を経由して GitHub Releases からあらかじめコンパイルされたバイナリをダウンロードし、実行前に SHA256 チェックサムを確認します。 テレメトリは収集せず、認証情報を保存せず、`github.com` 以外のネットワークリクエストを行わず、ユーザーのキャッシュディレクトリ (`~/.cache/mcptoolshop/star-freight/`) 以外の場所に書き込みません。 実行されるバイナリは、呼び出し元の権限で動作し、ゲームのセーブデータは現在の作業ディレクトリにのみ書き込まれます。 詳細については、[SECURITY.md](SECURITY.md) を参照してください。

## ソースコードのリポジトリ

ゲームのソースコードは、[mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight) にあります。

## ライセンス

MIT

---

*Star Freight は、権力構造の中で完全に属することなく、その中を移動するゲームです。*

制作: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
