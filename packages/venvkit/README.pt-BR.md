<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/venvkit/readme.png" alt="venvkit" width="400">
</p>

# venvkit

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/venvkit/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/venvkit"><img src="https://img.shields.io/npm/v/@mcptoolshop/venvkit?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

**Kit de ferramentas de diagnóstico para ambientes virtuais Python em fluxos de trabalho de aprendizado de máquina (ML) para Windows.**

Analisa seu sistema em busca de ambientes Python, diagnostica problemas de saúde (SSL, DLLs, incompatibilidades de ABI, vazamentos de caminhos), rastreia o histórico de execução de tarefas, detecta tarefas instáveis e gera um mapa do ecossistema.

## Início rápido em 30 segundos

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## Recursos

- **doctorLite** - Verificação rápida de saúde para qualquer interpretador Python
- Verificação SSL/TLS
- Falhas ao carregar DLLs (comum com PyTorch/CUDA)
- Incompatibilidades de ABI (ARM vs x86)
- Verificações de integridade do pip
- Detecção de vazamentos de user-site e PYTHONPATH

- **scanEnvPaths** - Descobre todos os ambientes Python no seu sistema
- Encontra venvs, ambientes conda, versões pyenv, interpretadores base
- Profundidade e filtragem configuráveis

- **mapRender** - Visualize seu ecossistema Python
- Saída JSON para uso programático
- Diagramas Mermaid para documentação
- Agrupamento de interpretadores base com análise de raio de impacto
- Visualização de roteamento de tarefas

- **runLog** - Rastreia o histórico de execução de tarefas
- Formato JSONL somente para anexar
- Registra qual ambiente executou qual tarefa
- Captura sucesso/falha com classificação de erro

- **taskCluster** - Agrupa execuções de tarefas por assinatura
- Detecção de tarefas instáveis (passagem/falha inconsistente)
- Detecção de instabilidade dependente do ambiente
- Identificação de pontos críticos de falha
- Análise de contágio (causas-raiz compartilhadas)

## Instalação

```bash
npm install
npm run build
```

## Uso da CLI

```bash
# Scan current directory and generate ecosystem map
node dist/map_cli.js

# Scan specific directories
node dist/map_cli.js --root C:\projects --root D:\ml-experiments

# Include task run history
node dist/map_cli.js --runlog .venvkit/runs.jsonl

# Output options
node dist/map_cli.js --out ./output --minScore 50 --strict --httpsProbe
```

### Opções da CLI

| Flag | Descrição |
|------|-------------|
| `--root, -r` | Diretório a ser analisado (pode especificar vários) |
| `--out` | Diretório de saída (padrão: `.venvkit`) |
| `--maxDepth` | Profundidade máxima do diretório a ser analisado (padrão: 5) |
| `--strict` | Habilita verificações de modo estrito |
| `--httpsProbe` | Testa a conectividade HTTPS |
| `--minScore` | Filtra ambientes abaixo desta pontuação de saúde |
| `--concurrency` | Verificações paralelas (padrão: número de CPUs) |
| `--runlog` | Caminho para o registro de execução da tarefa (JSONL) |
| `--no-tasks` | Ignora a visualização da tarefa |

### Saídas

| Arquivo | Descrição |
|------|-------------|
| `venv-map.json` | Dados completos do gráfico (nós, arestas, resumo) |
| `venv-map.mmd` | Fonte do diagrama Mermaid |
| `venv-map.html` | Visualizador interativo |
| `reports.json` | Relatórios raw do doctorLite |
| `insights.json` | Recomendações acionáveis |

## Uso Programático

```typescript
import { doctorLite, scanEnvPaths, mapRender, readRunLog } from 'venvkit';

// Check a specific Python
const report = await doctorLite({
  pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
  requiredModules: ['torch', 'transformers'],
  httpsProbe: true,
});

console.log(report.status); // 'good' | 'warn' | 'bad'
console.log(report.score);  // 0-100
console.log(report.findings); // Array of issues

// Scan for all Python environments
const scan = await scanEnvPaths({
  roots: ['C:\\projects'],
  maxDepth: 5,
});

// Run doctorLite on all found environments
const reports = await Promise.all(
  scan.pythonPaths.map(p => doctorLite({ pythonPath: p }))
);

// Load task execution history
const runs = await readRunLog('.venvkit/runs.jsonl');

// Generate ecosystem visualization
const { graph, mermaid, insights } = mapRender(reports, runs, {
  taskMode: 'clustered', // 'none' | 'runs' | 'clustered'
  includeHotEdgeLabels: true,
});
```

## Esquema do Registro de Tarefas

Rastreie as execuções de tarefas anexando eventos a um arquivo JSONL:

```typescript
import { appendRunLog, newRunId } from 'venvkit';

await appendRunLog('.venvkit/runs.jsonl', {
  version: '1.0',
  runId: newRunId(),
  at: new Date().toISOString(),
  task: {
    name: 'train',
    command: 'python train.py --epochs 10',
    requirements: { packages: ['torch', 'transformers'] },
  },
  selected: {
    pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
    score: 95,
    status: 'good',
  },
  outcome: {
    ok: true,
    exitCode: 0,
    durationMs: 45000,
  },
});
```

## Agrupamento de Tarefas

Quando você tem muitas execuções de tarefas, o venvkit as agrupa por assinatura:

```typescript
import { clusterRuns, isFlaky, getFailingEnvs } from 'venvkit';

const clusters = clusterRuns(runs);

for (const c of clusters) {
  console.log(`${c.sig.name}: ${c.ok}/${c.runs} (${(c.successRate * 100).toFixed(0)}%)`);

  if (isFlaky(c)) {
    console.log(`  WARNING: Flaky task!`);
    const badEnvs = getFailingEnvs(c, 3);
    console.log(`  Failing most on: ${badEnvs.map(e => e.pythonPath).join(', ')}`);
  }
}
```

## Esquema do Gráfico

A saída do `mapRender` segue um esquema JSON estável:

```typescript
type GraphJSONv1 = {
  version: '1.0';
  generatedAt: string;
  host: { os: string; arch: string; hostname: string };
  summary: {
    envCount: number;
    baseCount: number;
    taskCount: number;
    healthy: number;
    warning: number;
    broken: number;
    runsPassed: number;
    runsFailed: number;
    topIssues: Array<{ code: string; count: number; hint: string }>;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

### Tipos de Nós

| Tipo | Descrição |
|------|-------------|
| `base` | Interpretador Python base (por exemplo, `C:\Python311`) |
| `venv` | Ambiente virtual |
| `task` | Assinatura da tarefa (execuções agrupadas) |

### Tipos de Arestas

| Tipo | Descrição |
|------|-------------|
| `USES_BASE` | Relacionamento venv → base |
| `ROUTES_TASK_TO` | Roteamento de tarefa → ambiente |
| `FAILED_RUN` | Falha de tarefa → ambiente (tracejado em Mermaid) |

## Códigos de Erro

| Código | Severidade | Descrição |
|------|----------|-------------|
| `SSL_BROKEN` | bad | O módulo SSL falha ao importar |
| `CERT_STORE_FAIL` | warn | A verificação do certificado HTTPS falha |
| `DLL_LOAD_FAIL` | bad | Falha ao carregar DLL de extensão nativa |
| `ABI_MISMATCH` | bad | Incompatibilidade binária (ARM/x86) |
| `PIP_MISSING` | warn | pip não disponível |
| `PIP_CHECK_FAIL` | warn | Conflitos de dependência detectados |
| `USER_SITE_LEAK` | warn | user-site-packages habilitado no venv |
| `PYTHONPATH_INJECTED` | warn | Variável de ambiente PYTHONPATH definida |
| `ARCH_MISMATCH` | bad | Python de 32 bits quando 64 bits são necessários |
| `PYVENV_CFG_INVALID` | warn | pyvenv.cfg corrompido ou ausente |

## Desenvolvimento

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## Segurança e Escopo de Dados

- **Leitura apenas:** Os executáveis Python e o arquivo pyvenv.cfg são lidos, mas nunca modificados.
- **Subprocessos:** Inicia o `python` com argumentos controlados — sem execução via shell.
- **Rede:** A opção `--httpsProbe` (opcional) testa certificados SSL — não são feitas outras requisições de saída.
- **Nenhuma telemetria** é coletada ou enviada — consulte o arquivo [SECURITY.md](SECURITY.md) para a política completa.

## Licença

MIT

---

Criado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
