<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/registrum"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>Um registrador determinístico, com dupla validação e histórico reproduzível, que permite validação externa opcional.</strong></p>

---

## O que é o Registrum

O Registrum é um **registrador estrutural** — uma biblioteca que registra, valida e organiza as transições de estado sob restrições explícitas, de modo que a estrutura permaneça interpretável à medida que a entropia aumenta.

| Propriedade | Significado |
|----------|---------|
| **Structural** | Opera na forma, não no significado |
| **Deterministic** | Mesmas entradas → mesmas saídas, sempre |
| **Fail-closed** | Entrada inválida causa uma falha completa, não uma recuperação parcial |
| **Replayable** | Decisões históricas podem ser reexecutadas com resultados idênticos |
| **Non-agentic** | Nunca age, decide ou otimiza |

**O Registrum garante que a mudança permaneça compreensível.**

---

## Por que usar o Registrum?

Os sistemas evoluem. A entropia aumenta. A estrutura se deteriora.

A maioria das ferramentas responde a isso adicionando inteligência — otimizadores, agentes, camadas de auto-reparo. O Registrum adota a abordagem oposta: **ele adiciona restrições**.

- **Para autores de bibliotecas** — Incorpore garantias estruturais no gerenciamento de estado para que os usuários herdem a legibilidade gratuitamente.
- **Para sistemas críticos para auditoria** — Cada transição de estado é determinística, reproduzível e verificável de forma independente.
- **Para equipes que resistem à complexidade** — O Registrum rejeita transições inválidas com veredictos estruturados, em vez de degradar silenciosamente.

O resultado: um sistema em que a identidade, a linhagem e a ordem permanecem inspecionáveis, não importa quantas mudanças tenham ocorrido.

---

## Princípio Fundamental

> **A entropia é permitida. A ilegibilidade não.**

O Registrum não reduz a entropia globalmente.
Ele restringe onde a entropia pode existir, para que a identidade, a linhagem e a estrutura permaneçam inspecionáveis ao longo do tempo.

---

## O que o Registrum Não É

O Registrum **não é explicitamente**:

- Um otimizador, agente ou tomador de decisões
- Um controlador, recomendador ou inteligência
- Adaptativo, de aprendizado ou de auto-reparo

Ele nunca responde *o que importa*.
Ele apenas preserva as condições sob as quais essa pergunta permanece respondível.

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Como o Registrum Funciona

### Registrador Estrutural

O registrador é a única autoridade constitucional:

- Valida todas as transições de estado contra **11 invariantes estruturais**
- Impõe restrições de identidade, linhagem e ordem
- Garante determinismo e rastreabilidade
- Apresenta violações sem resolvê-las (falha segura)

Tudo é registrado através dele. Nada o ignora.

### Os 11 Invariantes

| Classe | Contagem | Propósito |
|-------|-------|---------|
| **Identity** | 3 | Único, imutável, endereçado por conteúdo |
| **Lineage** | 4 | Filiação válida, sem ciclos, rastreável |
| **Ordering** | 4 | Monotônico, sem lacunas, determinístico |

Esses invariantes são constitucionais. Alterá-los requer governança formal.

---

## Validações Constitucionais Duplas

O Registrum mantém **dois motores de invariantes independentes**:

| Validação | Função | Implementação |
|---------|------|----------------|
| **Registry** | Autoridade primária | DSL compilado (RPEG v1) |
| **Legacy** | Validação secundária | Predicados TypeScript |

A partir da Fase H, **o "registry" é o motor constitucional padrão**.
O "legacy" permanece como uma validação secundária independente.

### Por que Duas Validações?

- **O acordo é necessário** — Ambos devem concordar para que uma transição seja válida
- **O desacordo interrompe** — A divergência de paridade interrompe o sistema (falha segura)
- **A independência é intencional** — Nenhum pode substituir o outro

Esta é uma funcionalidade de segurança e legibilidade, não uma dívida técnica.
O modo dual é indefinido. Não há planos para remover nenhum dos mecanismos de verificação.

### Evidência de Paridade

274 testes comprovam a equivalência comportamental:
- 58 testes de paridade em todas as classes invariantes
- 12 testes de paridade de persistência (estabilidade temporal)
- Paridade de repetição: execução em tempo real ≡ execução repetida

---

## Histórico, Repetição e Auditabilidade

| Capacidade | Descrição |
|------------|-------------|
| **Snapshot** | Esquema versionado (`RegistrarSnapshotV1`), hashes endereçados por conteúdo, serialização determinística |
| **Replay** | Reexecução somente leitura contra um registrador novo — comprova o determinismo temporal |
| **Audit** | Cada julgamento estrutural é reproduzível, independente do contexto e verificável por qualquer parte que possua o snapshot. |

---

## Atestação Externa (Opcional)

O Registrum pode, opcionalmente, emitir atestações criptográficas para um livro-razão externo imutável (como o XRPL) para fins de verificação pública.

| Propriedade | Valor |
|----------|-------|
| Padrão | Desativado |
| Autoridade | Não autoritário (apenas verificação) |
| Efeito no comportamento | Nenhum |

As atestações registram *o que* o Registrum decidiu.
O Registrum decide *o que* é válido.

**A autoridade flui para dentro. A verificação flui para fora.**

Veja:
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — Justificativa
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — Especificação

---

## Começando

### Instalação

```bash
npm install @mcp-tool-shop/registrum
```

### Início Rápido

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — the violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

### Modos

| Modo | Motor | Quando usar |
|------|--------|-------------|
| `"legacy"` | Predicados TypeScript | Prototipagem rápida, sem dependências externas |
| `"registry"` (padrão) | DSL RPEG v1 compilado | Uso em produção com verificação dupla completa |

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";
import { loadCompiledRegistry } from "@mcp-tool-shop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const compiledRegistry = loadCompiledRegistry();
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### Exemplos

O diretório [`examples/`](examples/) contém demonstrações ilustrativas (não uma API estável).
Eles requerem [`tsx`](https://github.com/esbuild-kit/tsx):

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## Referência Rápida da API

### Exportações Principais

```typescript
// Implementation
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "refused", ... }
  Invariant,      // { id, scope, check }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcp-tool-shop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "identity" | "lineage" | "ordering"
  getInvariantById,       // Lookup by invariant ID
} from "@mcp-tool-shop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcp-tool-shop/registrum";
```

### `StructuralRegistrar`

| Método | Retorna | Descrição |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | Valida e registra uma transição de estado |
| `getState(id)` | `State \` | indefinido` | Recupera um estado registrado por ID |
| `getHistory()` | `Transition[]` | Histórico completo e ordenado das transições aceitas |
| `snapshot()` | `RegistrarSnapshotV1` | Snapshot determinístico e endereçado por conteúdo |

---

## Governança

O Registrum é governado por um **modelo constitucional**.

| Princípio | Significado |
|-----------|---------|
| Garantias comportamentais > velocidade de implementação de recursos | A correção tem precedência |
| Apenas mudanças baseadas em evidências | Nenhuma mudança sem prova |
| Processo formal obrigatório | Propostas, artefatos, decisões |

### Status Atual

- **Fase H**: Completa (registro padrão, atestado habilitado)
- **Governança**: Ativa e aplicada
- **Todas as mudanças**: Requerem um processo formal de governança

Todas as futuras mudanças são decisões de governança, não tarefas de engenharia.

Veja:
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — Por que a governança existe
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — O que é governado
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — Transição para a governança

---

## Status do Projeto

**O Registrum atingiu um estado final estável.**

| Fase | Status | Evidência |
|-------|--------|----------|
| A–C | Completo | Registrador principal, estrutura de paridade |
| E | Completo | Persistência, repetição, estabilidade temporal |
| G | Completo | Estrutura de governança |
| H | Completo | Registro padrão, com atestado habilitado. |

**Cobertura de testes:** 279 testes aprovados em 14 conjuntos de testes.

O desenvolvimento foi transferido para a fase de manutenção. Futuras alterações exigem governança.

Consulte: [`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md)

---

## Documentação

| Documento | Propósito |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | Definição de identidade |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | Declarações formais com evidências |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | Referência completa de invariantes |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | Condições de falha crítica |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | Garantias temporais |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | Tutorial sobre arquitetura de dupla validação |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | Formato de snapshot (constitucional) |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | Política de dupla validação |

---

## Princípios de Design

- **Restrição** em vez de poder
- **Legibilidade** em vez de desempenho
- **Restrições** em vez de heurísticas
- **Inspeção** em vez de intervenção
- **Parada** em vez de extensão infinita

O Registrum é bem-sucedido quando se torna algo previsível, confiável e sem surpresas.

---

## Segurança e Escopo de Dados

| Aspecto | Detalhe |
|--------|--------|
| **Data touched** | Transições de estado na memória, snapshots JSON opcionais para o sistema de arquivos local. |
| **Data NOT touched** | Sem requisições de rede, sem APIs externas, sem bancos de dados, sem credenciais de usuário. |
| **Permissions** | Leitura/escrita apenas em caminhos de snapshot especificados pelo usuário (quando a persistência é usada). |
| **Network** | Nenhum — biblioteca totalmente offline (atestado XRPL desabilitado por padrão). |
| **Telemetry** | Nenhum coletado ou enviado. |

Consulte [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

---

## Contribuições

O Registrum segue um modelo de contribuição com foco na governança. Todas as alterações exigem propostas formais com evidências.

Consulte [CONTRIBUTING.md](CONTRIBUTING.md) para obter a filosofia e o processo de contribuição completos.

---

## Tabela de Avaliação

| Categoria | Pontuação |
|----------|-------|
| A. Segurança | 10 |
| B. Tratamento de Erros | 10 |
| C. Documentação para Operadores | 10 |
| D. Higiene no Desenvolvimento | 10 |
| E. Identidade (suave) | 10 |
| **Overall** | **50/50** |

> Auditoria completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## Licença

MIT

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
