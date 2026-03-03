<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/VectorCaliper/readme.png" alt="VectorCaliper" width="400"></p>

<p align="center"><strong>Scientific instrument for faithful model-state visualization — turns vector graphics into calibrated representations.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/vector-caliper"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/vector-caliper.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-brightgreen.svg" alt="node 18+"></a>
  <a href="https://mcp-tool-shop-org.github.io/VectorCaliper/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

VectorCaliper visualise les trajectoires de l'état du modèle pendant l'entraînement. Chaque élément visuel est lié à une variable mesurée. Rien n'est inféré, lissé ou recommandé.

> "Un microscope, pas un tableau de bord."

VectorCaliper montre ce qui s'est passé. Il ne vous dit jamais ce que cela signifie.

---

## Ce qu'est VectorCaliper

- Un instrument de mesure pour la dynamique de l'apprentissage.
- Un débogueur géométrique pour les trajectoires d'optimisation.
- Un outil d'inspection pour l'évolution de l'état de l'entraînement.
- Une correspondance déterministe entre l'état et la représentation visuelle.

## Ce que VectorCaliper n'est pas

- Un tableau de bord d'entraînement.
- Un optimiseur ou un système de recommandation.
- Un moniteur de santé ou un détecteur d'anomalies.
- Un outil de recherche d'hyperparamètres.

Consultez [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md) pour plus de détails.

---

## Garanties fondamentales (v1)

VectorCaliper v1.x fournit une sémantique figée :

1. **Déterminisme** — La même entrée produit la même sortie.
2. **Pas d'interprétation** — Les encodages visuels n'impliquent pas de signification.
3. **Dégradation véridique** — Les sous-ensembles sont exacts, jamais des approximations.
4. **Limites explicites** — Les violations du budget entraînent un rejet, et non une dégradation silencieuse.

Spécification complète : [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## Exemple minimal

```typescript
import {
  createModelState,
  SemanticMapper,
  ProjectionEngine,
  SceneBuilder,
  SVGRenderer,
} from '@mcp-tool-shop/vector-caliper';

// Create state from measured values
const state = createModelState({
  time: 0,
  geometry: { effectiveDimension: 3.0, anisotropy: 1.5, spread: 5.0, density: 0.7 },
  uncertainty: { entropy: 1.2, margin: 0.6, calibration: 0.08 },
  performance: { accuracy: 0.92, loss: 0.08 },
});

// Project, build scene, render
const projector = new ProjectionEngine();
projector.fit([state]);
const builder = new SceneBuilder(new SemanticMapper());
builder.addState(state, projector.project(state));
const svg = new SVGRenderer({ width: 800, height: 600 }).render(builder.getScene());
```

---

## Démo canonique

Le répertoire [demo/](demo/) contient un générateur de démo déterministe :

```bash
npx ts-node demo/canonical-demo.ts
```

Sortie :
- `demo/output/canonical-trajectory.json` — 500 états
- `demo/output/canonical-trajectory.svg` — Visualisation
- `demo/output/canonical-manifest.json` — Sommes de contrôle SHA256

Exécutez deux fois et comparez les sommes de contrôle pour vérifier le déterminisme.

---

## À qui cela s'adresse

**Chercheurs** déboguant la dynamique de l'entraînement qui ont besoin de :
- Une visualisation fidèle sans interprétation.
- Des résultats reproductibles pour les publications.
- Des garanties explicites sur ce qui est affiché.

**Ingénieurs** inspectant l'évolution de l'état du modèle qui ont besoin de :
- Une visualisation adaptée à l'échelle (jusqu'à 1 million d'états).
- Une capture d'état indépendante du framework.
- Des artefacts CI déterministes.

Ne convient pas pour : la surveillance de la production, les alertes automatisées ou l'optimisation des hyperparamètres.

---

## Installation

```bash
npm install @mcp-tool-shop/vector-caliper
```

Nécessite Node.js 18+.

---

## Limites d'échelle

VectorCaliper impose des limites explicites. Le dépassement de ces limites entraîne un **rejet**, et non une dégradation silencieuse.

| Classe d'échelle | Limite maximale d'états | Limite de mémoire | Budget de rendu |
|-------------|------------|--------------|---------------|
| petit | 1,000      | 50 Mo | 16 ms/image |
| moyen | 10,000     | 200 Mo | 33 ms/image |
| grand | 100,000    | 500 Mo | 66 ms/image |
| extrême | 1,000,000  | 1 Go | 100 ms/image |

---

## Documentation

- [docs/README.md](docs/README.md) — Index de la documentation
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — Intégration du framework
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — Pipeline de conversion de l'état en vecteur

---

## Comment citer

Si vous utilisez VectorCaliper dans un travail académique :

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Version 1.0.0) [Logiciel]. https://github.com/mcp-tool-shop-org/VectorCaliper

**BibTeX:**
```bibtex
@software{vectorcaliper2026,
  author = {mcp-tool-shop},
  title = {VectorCaliper: A Geometrical Debugger for Learning Dynamics},
  year = {2026},
  version = {1.0.0},
  url = {https://github.com/mcp-tool-shop-org/VectorCaliper}
}
```

Consultez [CITATION.cff](CITATION.cff) pour les métadonnées lisibles par machine.

---

## Licence

MIT. Consultez [LICENSE](LICENSE).

---

## Statut

**v1.0.0** — Fonctionnalités figées jusqu'au 7 mars 2026. Consultez [STOP.md](STOP.md).

Conçu par [MCP Tool Shop](https://mcp-tool-shop.github.io/).
