<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

貿易を重視した海洋戦略ゲーム。ルートの最適化、契約、インフラ、金融、そして評判を通じて、5つの地域で商人のキャリアを築きましょう。すべてターミナルから操作可能です。Pythonの知識は不要です。

## インストール

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

または、グローバルにインストールします。

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

pipからもインストール可能です: `pip install portlight`

## Portlightの魅力

多くの貿易ゲームでは、貿易は単なる数値の増加として扱われます。Portlightでは、貿易を商業活動として捉えています。

- **価格はあなたの取引によって変動します。** 穀物を港で大量に販売すると、価格が暴落します。すべての販売が地域の市場に影響を与えます。
- **各港には独自の経済的特徴があります。** ポルト・ノヴォは穀物を安価で生産します。シルク・ヘイブンは絹を大量に輸出します。これらはランダムではなく、構造的な特徴です。
- **航海にはリスクが伴います。** 嵐、海賊、検査、季節的な危険などがあります。積載物、船体、そして乗組員の質が重要になります。
- **契約には証拠が必要です。** 期限内に正しい商品を正しい港に届けなければなりません。商品の出所は追跡されます。
- **インフラは貿易のやり方を変化させます。** 倉庫は貨物を一時的に保管します。仲介人は契約を改善します。ライセンスは特別なアクセス権を付与します。
- **評判は扉を開いたり閉めたりします。** 商業的な信頼、税関の取り締まり、地域の評価、そして裏社会との繋がり。これら4つの要素が、あなたが何ができるか、どこに行けるかを左右します。
- **ゲームはあなたが築き上げたものを読み取ります。** あなたの貿易履歴、インフラ、評判、そして航路は、あなたのキャリアを形成します。あなたがどのような商人になったかによって、4つの異なる勝利ルートが存在します。

## 世界

5つの地域、20の港、43の航路。そして、生きているかのような経済。

| 地域 | 港 | キャラクター |
|--------|-------|-----------|
| **Mediterranean** | ポルト・ノヴォ、アル・マナール、シルバ・ベイ、コルセアーズ・レスト | 穀物、木材、スパイスの市場。安全な出発地点。 |
| **North Atlantic** | アイアンヘイブン、ストームウォール、ソーンポート | 鉄、武器、軍需品。厳格な検査。 |
| **West Africa** | サン・ハーバー、パーム・コーブ、アイアン・ポイント、パール・シャロウズ | 綿、ラム酒、真珠。最も安価な物資。 |
| **East Indies** | ジェイド・ポート、モンスーン・リーチ、シルク・ヘイブン、クロスウィンド・アイル、ドラゴンズ・ゲート、スパイス・ナローズ | 絹、スパイス、陶器、お茶。最も高い利益率。モンスーンのリスク。 |
| **South Seas** | エンバー・アイル、タイフーン・アンカレッジ、コーラル・スローン | 真珠、医薬品。遠くの、ゲーム終盤の水域。 |

各港に134人の名前付きNPCが存在します。異なる水域を支配する4つの海賊勢力。季節によって変化する天候が、危険と需要を変化させます。文化的な要素として、祭り、迷信、そして乗組員の士気が存在します。

## 9人の船長

| 船長 | ホーム | エッジ | トレードオフ |
|---------|------|------|-----------|
| **Merchant** | ポルト・ノヴォ | 価格が良い、信頼が急速に向上 | 税関の取り締まりペナルティが2倍 |
| **Smuggler** | コルセアーズ・レスト | 闇市場、違法取引 | 税関の取り締まりが厳しく、検査が多い |
| **Navigator** | モンスーン・リーチ | 船が速い、航続距離が長い | 初期の評価が低い |
| **Privateer** | アイアンヘイブン | 海戦、強襲の有利 | 商人の評判が低い |
| **Corsair** | コルセアーズ・レスト | 戦闘と貿易のバランス | 万能ではない |
| **Scholar** | ジェイド・ポート | 情報優位、契約が有利 | 資本が少ない、脆弱 |
| **Merchant Prince** | ポルト・ノヴォ | 初期資本が多い、特別なアクセス権 | 手数料が高い、海賊の標的 |
| **Dockhand** | クロスウィンド・アイル | 乗組員が安価、手際が良い | 初期資本が最も低い |
| **Bounty Hunter** | ストームウォール | 戦闘に長けている、勢力との関係が良い | 価格が安い、信頼されていない |

## クイックスタート

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## システム

**経済** — 20の港、18の商品、43の航路における需給に基づいた価格設定。大量販売によるペナルティ。各地域には明確な輸出入の特性があります。

**航海**：数日間の航海。天候、海賊との遭遇、検査などが発生します。食料は毎日消費され、船体も損傷を受けます。季節によって危険な海域が変わり、安全な航路も変化します。

**契約**：信頼と実績によって結びついた6つの組織。物資調達、不足緩和、高級品取引、積み荷の返送、ルート開拓、そして組織からの委託など、様々な契約が存在します。現実的な納期と、それに伴う結果があります。

**評判**：地域での評価、商業的な信頼、税関の取り締まりの厳しさ、そして裏社会との繋がりという4つの要素で構成されます。船長によって、異なる倫理観に基づいたビジネスが行われます。

**戦闘**：近接戦闘（構えの相性）があり、7種類の近接武器と7種類の遠隔武器、そして地域ごとの戦闘スタイルが存在します。また、船同士の戦闘では、乗り込みや大砲の使用があります。

**海賊組織**：クリムゾン・タイド、アイアン・ウルブズ、ディープ・リーフ・ブラザーフッド、モンソン・シンジケート。それぞれが縄張りを持ち、名前のある船長が率い、あなたに対する態度も異なります。

**インフラ**：倉庫、仲介事務所、許可証。これらを維持するには費用がかかります。それぞれが、貿易のタイミング、規模、またはアクセスに影響を与えます。

**金融**：保険と信用。リスクを伴う融資です。

**仲間**：個性、士気、そして離脱の条件を持つ、5つの役職が存在します。

**キャリア**：27の目標。13のプロフィールタグ。勝利への4つの道筋：法を重んじる貿易会社、秘密結社、広大な海洋支配、商業帝国。

## 勝利への道筋

- **法を重んじる貿易会社**：高い信頼、優良な契約、清廉な評判、広範なインフラ。
- **秘密結社**：厳格な監視下での高利益取引、リスク管理、強固な運営。
- **広大な海洋支配**：東インドへのアクセス、遠隔地のインフラ、航路の支配。
- **商業帝国**：どこにでも存在するインフラ、多様な収入源、金融力。

## このパッケージの仕組み

このパッケージは、GitHub Releases からあなたのプラットフォームに対応したあらかじめビルドされた Portlight の実行ファイルをダウンロードし、ローカルにキャッシュします。Python のインストールは不要です。

| 注意点 | 詳細 |
|---------|--------|
| **Network** | `github.com` CDN への HTTPS 通信のみ |
| **Filesystem** | ユーザーキャッシュのみ (`~/.cache/mcptoolshop/portlight/`) |
| **Verification** | ダウンロードごとに SHA256 チェックサムを確認 |
| **Telemetry** | なし |
| **Platforms** | 対応プラットフォーム：Windows (x64)、macOS (x64/arm64)、Linux (x64) |

## セキュリティ

- 実行ファイルは、HTTPS を使用して `github.com` からのみダウンロードされます。
- ダウンロードごとに SHA256 チェックサムによる検証を行います。
- ユーザーのキャッシュディレクトリへの書き込みのみ。システムディレクトリには一切アクセスしません。
- テレメトリー、機密情報、認証情報は一切保存しません。
- 実行ファイルのダウンロード以外、ネットワークアクセスはありません。

詳細については、[SECURITY.md](SECURITY.md) を参照してください。

## ライセンス

MIT

---

開発：<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
