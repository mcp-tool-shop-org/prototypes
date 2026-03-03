<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

VectorCaliper visualiza las trayectorias del estado del modelo durante el entrenamiento. Cada elemento visual se remonta a una variable medida. No se infiere, se suaviza ni se recomienda nada.

> "Un microscopio, no un panel de control."

VectorCaliper muestra lo que sucedió. Nunca le dice qué significa.

---

## ¿Qué es VectorCaliper?

- Un instrumento de medición para la dinámica del aprendizaje.
- Un depurador geométrico para trayectorias de optimización.
- Una herramienta de inspección para la evolución del estado del entrenamiento.
- Un mapeo determinista del estado a una representación visual.

## ¿Qué no es VectorCaliper?

- Un panel de control de entrenamiento.
- Un optimizador o sistema de recomendación.
- Un monitor de salud o detector de anomalías.
- Una herramienta de búsqueda de hiperparámetros.

Consulte [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md) para obtener más detalles.

---

## Garantías principales (v1)

VectorCaliper v1.x proporciona una semántica fija:

1. **Determinismo** — La misma entrada produce la misma salida.
2. **Sin interpretación** — Los códigos visuales no implican significado.
3. **Degradación veraz** — Los subconjuntos son exactos, nunca aproximaciones.
4. **Límites explícitos** — Las violaciones del presupuesto provocan un rechazo, no una degradación silenciosa.

Especificación completa: [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## Ejemplo mínimo

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

## Demostración canónica

El directorio [demo/](demo/) contiene un generador de demostración determinista:

```bash
npx ts-node demo/canonical-demo.ts
```

Salida:
- `demo/output/canonical-trajectory.json` — 500 estados
- `demo/output/canonical-trajectory.svg` — Visualización
- `demo/output/canonical-manifest.json` — Sumas de comprobación SHA256

Ejecute dos veces y compare las sumas de comprobación para verificar el determinismo.

---

## Para quién es esto

**Investigadores** que depuran la dinámica del entrenamiento y que necesitan:
- Una visualización fiel sin interpretación.
- Resultados reproducibles para artículos.
- Garantías explícitas sobre lo que se muestra.

**Ingenieros** que inspeccionan la evolución del estado del modelo y que necesitan:
- Una visualización consciente de la escala (hasta 1 millón de estados).
- Captura de estado independiente del marco de trabajo.
- Artefactos de CI deterministas.

No es para: Monitoreo de producción, alertas automatizadas ni optimización de hiperparámetros.

---

## Instalación

```bash
npm install @mcp-tool-shop/vector-caliper
```

Requiere Node.js 18+.

---

## Límites de escala

VectorCaliper impone límites explícitos. Excederlos resulta en **rechazo**, no en una degradación silenciosa.

| Clase de escala | Máximo de estados | Límite de memoria | Presupuesto de renderizado |
|-------------|------------|--------------|---------------|
| pequeño | 1,000      | 50 MB | 16 ms/frame |
| mediano | 10,000     | 200 MB | 33 ms/frame |
| grande | 100,000    | 500 MB | 66 ms/frame |
| extremo | 1,000,000  | 1 GB | 100 ms/frame |

---

## Documentación

- [docs/README.md](docs/README.md) — Índice de documentación
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — Integración de marcos de trabajo
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — Canal de mapeo

---

## Cómo citar

Si utiliza VectorCaliper en trabajos académicos:

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Version 1.0.0) [Software]. https://github.com/mcp-tool-shop-org/VectorCaliper

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

Consulte [CITATION.cff](CITATION.cff) para obtener metadatos legibles por máquina.

---

## Licencia

MIT. Consulte [LICENSE](LICENSE).

---

## Estado

**v1.0.0** — Funcionalidad fija hasta el 7 de marzo de 2026. Consulte [STOP.md](STOP.md).

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/).
