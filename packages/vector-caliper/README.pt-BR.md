<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

VectorCaliper visualiza as trajetórias do estado do modelo durante o treinamento. Cada elemento visual está diretamente relacionado a uma variável medida. Nada é inferido, suavizado ou recomendado.

> "Um microscópio, não um painel de controle."

VectorCaliper mostra o que aconteceu. Nunca lhe diz o que isso significa.

---

## O que é VectorCaliper

- Um instrumento de medição para a dinâmica de aprendizado.
- Um depurador geométrico para trajetórias de otimização.
- Uma ferramenta de inspeção para a evolução do estado do treinamento.
- Um mapeamento determinístico do estado para uma representação visual.

## O que VectorCaliper não é

- Um painel de controle de treinamento.
- Um otimizador ou sistema de recomendação.
- Um monitor de saúde ou detector de anomalias.
- Uma ferramenta de busca de hiperparâmetros.

Consulte [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md) para obter detalhes.

---

## Garantias Principais (v1)

VectorCaliper v1.x fornece semântica fixa:

1. **Determinismo** — A mesma entrada produz a mesma saída.
2. **Sem interpretação** — As codificações visuais não implicam significado.
3. **Degradação precisa** — Os subconjuntos são exatos, nunca aproximações.
4. **Limites explícitos** — Violações do orçamento causam rejeição, não degradação silenciosa.

Especificação completa: [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## Exemplo Mínimo

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

## Demonstração Canônica

O diretório [demo/](demo/) contém um gerador de demonstração determinístico:

```bash
npx ts-node demo/canonical-demo.ts
```

Saída:
- `demo/output/canonical-trajectory.json` — 500 estados
- `demo/output/canonical-trajectory.svg` — Visualização
- `demo/output/canonical-manifest.json` — Checksums SHA256

Execute duas vezes e compare os checksums para verificar o determinismo.

---

## Para quem é isso

**Pesquisadores** que depuram a dinâmica de treinamento e que precisam de:
- Visualização precisa sem interpretação.
- Saídas reproduzíveis para artigos.
- Garantias explícitas sobre o que é mostrado.

**Engenheiros** que inspecionam a evolução do estado do modelo e que precisam de:
- Visualização com consciência da escala (até 1 milhão de estados).
- Captura de estado independente do framework.
- Artefatos de CI determinísticos.

Não é para: Monitoramento de produção, alertas automatizados ou otimização de hiperparâmetros.

---

## Instalação

```bash
npm install @mcp-tool-shop/vector-caliper
```

Requer Node.js 18+.

---

## Limites de Escala

VectorCaliper impõe limites explícitos. Exceder esses limites resulta em **rejeição**, não em degradação silenciosa.

| Classe de Escala | Máximo de Estados | Limite de Memória | Orçamento de Renderização |
|-------------|------------|--------------|---------------|
| pequeno | 1,000      | 50 MB | 16ms/frame |
| médio | 10,000     | 200 MB | 33ms/frame |
| grande | 100,000    | 500 MB | 66ms/frame |
| extremo | 1,000,000  | 1 GB | 100ms/frame |

---

## Documentação

- [docs/README.md](docs/README.md) — Índice da documentação
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — Integração com frameworks
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — Pipeline de mapeamento

---

## Como Citar

Se você usar VectorCaliper em trabalhos acadêmicos:

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Versão 1.0.0) [Software]. https://github.com/mcp-tool-shop-org/VectorCaliper

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

Consulte [CITATION.cff](CITATION.cff) para metadados legíveis por máquina.

---

## Licença

MIT. Consulte [LICENSE](LICENSE).

---

## Status

**v1.0.0** — Funcionalidades fixas até 07 de março de 2026. Consulte [STOP.md](STOP.md).

Desenvolvido por [MCP Tool Shop](https://mcp-tool-shop.github.io/).
