<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Apprenez le fonctionnement du XRP Ledger en une seule session : portefeuille, paiement, vérification, certificat en 10 minutes.

**Aucun Python requis.** Ce paquet télécharge un exécutable précompilé et l'exécute localement.

## Installation et exécution

```bash
npx @mcptoolshop/xrpl-camp start
```

C'est tout. Pas de Python, pas de pip, pas d'environnements virtuels.

## Ce qui se passe

1. La première exécution télécharge un exécutable spécifique à la plateforme (environ 20 Mo) depuis [GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-camp/releases).
2. Vérifie la somme de contrôle SHA256.
3. Met en cache localement (`~/.cache/mcptoolshop/xrpl-camp/`).
4. S'exécute avec la transmission complète des arguments.

Les exécutions suivantes se lancent instantanément à partir du cache.

## Commandes

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## Plateformes prises en charge

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## Sécurité

Tous les exécutables sont vérifiés par rapport aux sommes de contrôle SHA256 avant l'exécution. Aucune télémétrie. Aucun accès réseau au-delà du téléchargement initial depuis GitHub.

Fonctionne grâce à [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternative : Installation via Python

Si vous préférez Python :

```bash
pipx install xrpl-camp
xrpl-camp start
```

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
