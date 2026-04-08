<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

Uma camada de política que faz com que o comportamento do agente seja **determinado por preferências**, em vez de apenas pela maximização da eficiência.

Seu agente gera planos candidatos. O kernel decide o que acontece em seguida:

**gerar → filtrar (restrições rígidas) → pontuar (pesos) → escolher OU perguntar**

As restrições rígidas são inegociáveis. As preferências flexíveis orientam as compensações. A incerteza pode forçar a opção de "perguntar ao humano".

---

## Instalar

```bash
npm i @mcptoolshop/civility-kernel
```

## Início rápido

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

O kernel conecta as restrições, os classificadores e o motor de decisão em uma única chamada. Use `decideAsync()` para verificações de restrições que exigem operações de entrada/saída.

## O ciclo de governança humana

Você sempre pode ver o que sua política faz.
O agente deve mostrar as alterações antes que elas sejam aplicadas.
Você pode reverter.
Nada é atualizado silenciosamente.

Visualize o contrato da política:
```bash
npm run policy:explain
```

Proponha uma atualização (mostra as diferenças, solicita aprovação):
```bash
npm run policy:propose
```

Normalize o arquivo de política atual (normalização apenas de formato):
```bash
npm run policy:canonicalize
```

### Recuperação automática de segurança

Ao aplicar alterações, o `policy-check` pode fazer backup da política antiga primeiro:

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## Arquivos de política

Convenção recomendada:

- `policies/default.json` — política ativa
- `policies/previous.json` — alvo de recuperação automática
- `policies/profiles/*.json` — perfis nomeados (trabalho / baixo atrito / modo de segurança)

## Opções da CLI (policy-check)

- `--explain` — imprime um resumo da política legível por humanos
- `--propose <file>` — validação + mostra a diferença normalizada + solicita aprovação
- `--apply` — reescreve o arquivo de política na forma normalizada
- `--write-prev <file>` — faz backup da política normalizada antiga antes de sobrescrever
- `--diff short|full` — curto mostra as alterações "principais"; completo mostra tudo
- `--prev <file>` — modo de diferença determinístico para CI

## API pública

**Kernel (ponto de entrada recomendado):**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — fachada pré-configurada com `decide`, `lint`, `explain`, `diff` e aprendizado
- `PolicyBuilder` — API fluente e encadeável para construir políticas validadas

**Operações de política:**

- `lintPolicy(policy, { registry, scorers })` — valida uma política para erros e avisos
- `canonicalizePolicy(policy, registry)` — normaliza uma política para a forma canônica
- `diffPolicy(a, b, registry?)` — diferença estruturada entre duas políticas
- `explainPolicy(policy, registry, opts?)` — resumo da política legível por humanos

**Persistência:**

- `loadPolicy(json)` — carregamento de política validado com Zod a partir de uma entrada desconhecida
- `dumpPolicy(policy)` — serialização JSON determinística (chaves ordenadas)
- `PreferencePolicySchema` — esquema Zod exportado para validação em tempo de execução

**Motor de decisão:**

- `DecisionEngine` — avalia planos candidatos em relação a uma política (filtrar → pontuar → escolher ou perguntar)
- `decideAsync()` — variante assíncrona para verificações de restrições que exigem operações de entrada/saída
- `compileEffectivePolicy(base, context, plans)` — aplica regras de contexto (suporta padrões globais como `tool:*`)
- `onDecision` hook — callback opcional para registro/métricas em cada decisão

**Registros:**

- `ConstraintRegistry` — registra e avalia restrições rígidas (com esquemas de parâmetros Zod opcionais + suporte assíncrono)
- `ScorerRegistry` — registra funções de pontuação para chaves de peso
- `registerDefaultConstraints(registry)` — carrega restrições integradas (`no_irreversible_changes`, `max_spend_without_confirm`, `require_confirm_if`)
- `registerDefaultScorers(registry)` — carrega classificadores integrados (`efficiency`, `low_risk`, `concise`)

**Ciclo de aprendizado:**

- `proposePolicyUpdates(policy, events)` — sugere ajustes na política com base nos eventos de feedback do usuário.
- `applyPolicyProposal(policy, proposal)` — integra uma proposta de volta à política (completa o ciclo).
- Feedback estendido: `CONSTRAINT_RELAXED`, `PLAN_EDITED`, `TIMEOUT`, `ABORT`.

**Integração com MCP:**

- `planFromMcpToolCall(call, meta?)` — converte uma chamada de ferramenta MCP em um Plano.
- `feedbackFromMcpResult(result, planId)` — converte um resultado de MCP em um Evento de Feedback.

**Utilitários:**

- `extractTags(plan)` / `annotatePlanWithTags(plan)` — atribui automaticamente tags aos planos com base no conteúdo das etapas.
- `matchesContext(pattern, context)` — correspondência de padrões de contexto, com suporte a curingas.

## CI

Execuções de CI:
- testes (143 testes em 17 arquivos)
- compilação
- `policy-check --strict` comparando com arquivos de exemplo (`policies/default.json` vs `policies/previous.json`)

Isso evita a distribuição de políticas com erros ou diferenças enganosas.

## Desenvolvimento

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## Segurança e Escopo de Dados

O kernel Civility é uma **biblioteca pura** — sem requisições de rede, sem telemetria, sem efeitos colaterais.

- **Dados acessados:** Lê arquivos de política JSON do sistema de arquivos local. Valida, normaliza e compara documentos de política em processo. Todas as operações são determinísticas.
- **Dados NÃO acessados:** Sem requisições de rede. Sem telemetria. Sem armazenamento de credenciais. O kernel avalia as restrições da política — não observa nem registra as ações do agente.
- **Permissões necessárias:** Acesso de leitura ao sistema de arquivos para arquivos JSON de política. Acesso de escrita apenas quando explicitamente solicitado via `--apply`.

Consulte [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

---

## Scorecard

| Categoria | Pontuação |
|----------|-------|
| Segurança | 10/10 |
| Tratamento de Erros | 10/10 |
| Documentação para Operadores | 10/10 |
| Qualidade na Distribuição | 10/10 |
| Identidade | 10/10 |
| **Overall** | **50/50** |

---

## Licença

MIT (veja LICENSE)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
