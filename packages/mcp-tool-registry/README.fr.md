<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Le registre contenant uniquement les métadonnées — la source unique de vérité pour tous les outils de MCP Tool Shop.**

Validation du schéma à chaque commit. Groupes d'outils prédéfinis, créés selon des règles. Un index de recherche préconfiguré est inclus dans le package. Fixez une version et obtenez des métadonnées cohérentes à chaque fois.

## Démarrage rapide

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## Aperçu

- **Uniquement des données** — aucun code exécutable, seulement des métadonnées JSON pour chaque outil de l'écosystème.
- **Validation du schéma** — chaque entrée est vérifiée par rapport au schéma JSON lors du commit et dans l'intégration continue (CI).
- **Système de groupes** — les outils sont regroupés en groupes prédéfinis (`core`, `agents`, `ops`, `evaluation`) selon des règles, et non par une curation manuelle.
- **Découverte rapide** — un index de recherche préconfiguré avec des mots-clés et des facettes est inclus dans le package.
- **Privilèges minimaux** — les outils ont par défaut des capacités nulles ; les effets secondaires sont optionnels et déclarés explicitement.
- **Reproductible** — fixez une version du registre et obtenez des métadonnées cohérentes à chaque fois.

## Utilisateurs

### Registre complet

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### Groupes

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

Groupes disponibles : `core`, `agents`, `ops`, `evaluation`.

### Index de recherche

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### Contexte LLM

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## Groupes

| Groupe         | Description                                      | Logique de sélection                           |
| -------------- | ------------------------------------------------ | ---------------------------------------------- |
| **core**       | Utilitaires essentiels                           | Liste explicite d'identifiants                 |
| **agents**     | Orchestration, navigation et contexte des agents | Identifiants explicites + balise `agents`      |
| **ops**        | DevOps, infrastructure, déploiement              | Balises : `automation`, `packaging`, `release` |
| **evaluation** | Tests, benchmarks, couverture                    | Balises : `testing`, `evaluation`, `benchmark` |

## Structure

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## Ajouter un outil

1. Lisez [docs/registry-guidelines.md](docs/registry-guidelines.md)
2. Ajoutez une entrée à `registry.json` (maintenez l'ordre par `id`)
3. Exécutez `npm run validate` et `npm run policy`
4. Soumettez une demande de tirage (Pull Request)

## Gestion des versions

Le contrat de la version 1 est stable. De nouveaux champs optionnels peuvent être ajoutés dans les versions mineures ; les champs obligatoires et la structure des champs existants ne changeront pas dans une version majeure.

## Écosystème

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)** — découvrez, installez et exécutez des outils.
- **[Soumettre un outil](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)** — ajoutez votre outil à l'écosystème.

## Licence

MIT — voir [LICENSE](LICENSE) pour plus de détails.
