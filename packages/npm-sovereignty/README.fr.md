<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sovereignty/readme.png" width="400" alt="sovereignty" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/sovereignty"><img src="https://img.shields.io/npm/v/@mcptoolshop/sovereignty" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-sovereignty/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/sovereignty/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un jeu de stratégie sur la gouvernance, la confiance et le commerce, avec une version pour jeu de société et une vérification en ligne via XRPL.

**Aucun Python requis.** Ce paquet télécharge un exécutable précompilé et l'exécute localement.

## Installation et exécution

```bash
npx @mcptoolshop/sovereignty tutorial
```

C'est tout. Pas de Python, pas de pip, pas d'environnements virtuels.

## Ce qui se passe

1. Lors du premier lancement, un exécutable spécifique à la plateforme (environ 25 Mo) est téléchargé depuis [GitHub Releases](https://github.com/mcp-tool-shop-org/sovereignty/releases).
2. La somme de contrôle SHA256 est vérifiée.
3. L'exécutable est mis en cache localement (`~/.cache/mcptoolshop/sovereignty/`).
4. L'exécution se fait avec transmission complète des arguments.

Les exécutions suivantes se lancent instantanément à partir du cache.

## Commandes

```bash
npx @mcptoolshop/sovereignty tutorial    # learn the rules
npx @mcptoolshop/sovereignty new         # start a new game
npx @mcptoolshop/sovereignty status      # check game state
npx @mcptoolshop/sovereignty --help      # see all commands
```

## Plateformes prises en charge

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## Sécurité

Tous les exécutables sont vérifiés par rapport à une somme de contrôle SHA256 avant l'exécution. Aucune télémétrie. Aucun accès réseau en dehors du téléchargement initial depuis GitHub.

Fonctionne grâce à [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternative : Installation via Python

Si vous préférez Python :

```bash
pipx install sovereignty-game
sov tutorial
```

---

Développé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
