<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# ConsensusOS

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

**Plataforma de controle modular e sem dependências para governança de consenso em múltiplas cadeias.**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## Por que ConsensusOS?

Gerenciar uma infraestrutura com múltiplas cadeias significa confiar em nós que você não controla totalmente, lançar versões que não podem divergir e gerenciar alterações de configuração em redes que nunca param. Muitas equipes resolvem isso com scripts improvisados e esperam pelo melhor.

O ConsensusOS substitui essa esperança por uma **plataforma de controle baseada em plugins**, onde cada módulo se comunica através de um barramento de eventos compartilhado, cada transição de estado é protegida por invariantes de "falha segura" e todo o histórico do sistema pode ser reproduzido de forma determinística.

- **Zero dependências em produção** — nada na sua cadeia de suprimentos que você não tenha escrito.
- **API de plugin v1 congelada** — contrato estável que não quebrará suas integrações.
- **Invariantes de "falha segura"** — transições inválidas são sempre rejeitadas, nunca aplicadas parcialmente.
- **Reprodução determinística** — reproduza qualquer estado do sistema a partir do histórico de eventos.
- **Execução limitada por recursos** — limites de CPU, memória e tempo aplicados por meio de tokens.
- **Adaptadores para múltiplas cadeias** — XRPL, Ethereum e Cosmos integrados.

---

## Instalação

```bash
npm install @mcptoolshop/consensus-os
```

Requer **Node.js 18+**. Zero dependências em tempo de execução.

---

## Início rápido

### Uso programático

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

// Create the loader (orchestrates plugin lifecycle)
const loader = new CoreLoader({
  configs: {
    "health-sentinel": { intervalMs: 10_000 },
  },
});

// Register plugins
loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());
loader.register(createXrplAdapter());

// Boot resolves dependencies, inits, and starts all plugins
await loader.boot();

// Subscribe to events
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});

// Check invariants before a state transition
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);

// Graceful shutdown (reverse boot order)
await loader.shutdown();
```

### Crie um plugin personalizado

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data as Record<string, unknown>);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### Interface de linha de comando (CLI)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   CLI (entry)                   │
├─────────────────────────────────────────────────┤
│              Plugin SDK / Attestation           │
├──────────┬──────────┬──────────┬────────────────┤
│  Health  │ Verifier │  Config  │    Sandbox     │
│ Sentinel │ (Release)│ Guardian │ (Replay/Amend) │
├──────────┴──────────┴──────────┼────────────────┤
│           Governor Layer       │   Adapters     │
│  (Token · Policy · Queue)     │ (XRPL/ETH/ATOM)│
├────────────────────────────────┴────────────────┤
│                 Core Layer                      │
│    EventBus · InvariantEngine · Loader · Logger │
├─────────────────────────────────────────────────┤
│              Plugin API v1 (frozen)             │
└─────────────────────────────────────────────────┘
```

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) para a especificação completa.

---

## Superfície da API

### Núcleo

| Exportação | Descrição |
| -------- | ------------- |
| `CoreLoader` | Orquestrador do ciclo de vida do plugin — registro, inicialização, desligamento. |
| `CoreEventBus` | Barramento de eventos ordenado, tipado e reproduzível com assinaturas curinga. |
| `CoreInvariantEngine` | Motor de invariantes de "falha segura" com registro somente de anexação. |
| `createLogger(scope)` | Registrador estruturado com escopo para um módulo. |

### Módulos

| Fábrica | Propósito |
| --------- | --------- |
| `createHealthSentinel()` | Monitoramento da saúde do nó por meio de "heartbeats". |
| `createReleaseVerifier()` | Verificação do hash da versão do software. |
| `createConfigGuardian()` | Validação e migração do esquema de configuração. |
| `createSandboxPlugin()` | Motor de simulação, reprodução e correção isolados. |
| `createGovernorPlugin()` | Execução baseada em tokens, aplicação de políticas, fila de compilação. |

### Adaptadores

| Fábrica | Chain | Status |
| --------- | ------- | -------- |
| `createXrplAdapter()` | XRPL | Implementado |
| `createEthereumAdapter()` | Ethereum | Implementado |
| `createCosmosAdapter()` | Cosmos | Implementado |

### SDK do plugin

| Exportação | Descrição |
| -------- | ------------- |
| `BasePlugin` | Classe base abstrata com padrões de ciclo de vida e métodos de conveniência. |
| `ManifestBuilder` | Construtor "fluent" para manifestos de plugin com tipagem segura. |
| `validatePlugin()` | Validação de pré-registro com erros e avisos. |
| `AttestationPipeline` | Atestado de versão e rastreabilidade da compilação. |

### Exportações de subcaminhos

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## Testes

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

Categorias de teste:
- **Arquitetura** (16 testes) — aplicação de invariantes estruturais.
- **Segurança** (27 testes) — resistência a abusos e determinismo.
- **Teste de carga** (22 testes) — casos extremos e taxa de transferência.
- **Teste unitário** (230 testes) — cobertura em nível de componente.

---

## Documentação

| Documentação | Propósito |
| ---------- | --------- |
| [QUICKSTART.md](QUICKSTART.md) | Comece em 3 minutos |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Especificação de arquitetura v1.0 congelada. |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | Como escrever um plugin |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | Como criar um adaptador de cadeia |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | Simulação, reprodução e análise detalhada de alterações. |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | Execução de tokens, políticas e fila de compilação. |
| [SECURITY.md](SECURITY.md) | Política de segurança e relatório de vulnerabilidades. |
| [THREAT_MODEL.md](THREAT_MODEL.md) | Análise de ameaças STRIDE. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Fluxo de desenvolvimento e lista de verificação para solicitações de alteração (PR). |
| [BUILD.md](BUILD.md) | Compilação e verificação reproduzíveis. |

---

## Suporte

- **Dúvidas / ajuda:** [Discussões](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **Relatórios de bugs:** [Problemas](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## Licença

[MIT](LICENSE)
