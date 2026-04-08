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

**O registro de metadados — a única fonte de informação confiável para todas as ferramentas do MCP Tool Shop.**

Validação de esquema a cada commit. Pacotes criados com base em regras predefinidas. Índice de pesquisa pré-construído incluído no pacote. Fixe uma versão e obtenha metadados consistentes sempre.

## Início Rápido

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## Visão Geral

- **Apenas dados** — sem código executável, apenas metadados JSON para cada ferramenta no ecossistema.
- **Validação de esquema** — cada entrada é verificada em relação ao JSON Schema a cada commit e no CI (Integração Contínua).
- **Sistema de pacotes** — ferramentas agrupadas em pacotes predefinidos (`core`, `agents`, `ops`, `evaluation`) com base em regras, e não em curadoria manual.
- **Descoberta rápida** — índice de pesquisa pré-construído com palavras-chave e filtros incluído no pacote.
- **Privilégios mínimos** — as ferramentas têm, por padrão, zero permissões; efeitos colaterais são opcionais e devem ser declarados explicitamente.
- **Reprodutível** — fixe uma versão do registro e obtenha metadados consistentes sempre.

## Usuários

### Registro completo

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### Pacotes

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

Pacotes disponíveis: `core`, `agents`, `ops`, `evaluation`.

### Índice de pesquisa

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### Contexto para LLM (Large Language Models)

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## Pacotes

| Pacote         | Descrição                                     | Lógica de seleção                          |
| -------------- | --------------------------------------------- | ------------------------------------------ |
| **core**       | Utilitários essenciais                        | Lista de IDs explícitos                    |
| **agents**     | Orquestração, navegação e contexto de agentes | IDs explícitos + tag `agents`              |
| **ops**        | DevOps, infraestrutura, implantação           | Tags: `automation`, `packaging`, `release` |
| **evaluation** | Testes, benchmarks, cobertura                 | Tags: `testing`, `evaluation`, `benchmark` |

## Estrutura

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

## Adicionando uma Ferramenta

1. Leia [docs/registry-guidelines.md](docs/registry-guidelines.md)
2. Adicione uma entrada em `registry.json` (mantenha a ordem por `id`)
3. Execute `npm run validate` e `npm run policy`
4. Envie um Pull Request

## Versionamento

O contrato da versão 1 é estável. Novos campos opcionais podem ser adicionados em versões menores; campos obrigatórios e a estrutura dos campos existentes não serão alterados dentro de uma versão principal.

## Ecossistema

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)** — descubra, instale e execute ferramentas.
- **[Enviar uma Ferramenta](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)** — adicione sua ferramenta ao ecossistema.

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
