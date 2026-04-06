<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Exemples d'environnements de travail pour [MCP Tool Shop](https://github.com/mcp-tool-shop).

## Comment MCP Tool Shop s'intègre

- **Registre** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → les outils disponibles.
- **Interface en ligne de commande (CLI)** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → comment les utiliser.
- **Exemples** → comment comprendre le fonctionnement (ce dépôt).
- **Tags** (v0.1.0, v0.2.0) → stabilité, reproductibilité.
- **main** → uniquement pour le développement ; peut changer sans préavis ; les constructions peuvent échouer.
- **Les outils fonctionnent par défaut avec le principe du moindre privilège** → pas de connexion réseau, pas d'écritures, pas d'effets secondaires.
- **Les fonctionnalités sont toujours explicites et activées volontairement** → vous décidez quand les activer.

## Exemples

| Exemple | Description |
| --------- | ------------- |
| [hello-tools](./hello-tools/) | Votre premier environnement de travail MCP en 2 minutes. |
| [hello-filesystem](./hello-filesystem/) | Effets secondaires irréversibles gérés en toute sécurité. |

## Démarrage rapide

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## Liés

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - Interface en ligne de commande pour découvrir et exécuter des outils.
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - Registre de métadonnées des outils.
