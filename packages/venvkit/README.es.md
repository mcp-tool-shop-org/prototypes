<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

**Herramienta de diagnóstico para entornos virtuales de Python para flujos de trabajo de aprendizaje automático en Windows.**

Analiza su sistema en busca de entornos de Python, diagnostica problemas de salud (SSL, DLL, incompatibilidades de ABI, fugas de rutas), realiza un seguimiento del historial de ejecución de tareas, detecta tareas inestables y genera un mapa del ecosistema.

## Guía de inicio rápido en 30 segundos

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## Características

- **doctorLite** - Comprobación rápida de la salud para cualquier intérprete de Python
- Verificación SSL/TLS
- Fallos al cargar DLL (común con PyTorch/CUDA)
- Incompatibilidades de ABI (ARM vs x86)
- Comprobaciones de integridad de pip
- Detección de fugas de `user-site` y `PYTHONPATH`

- **scanEnvPaths** - Descubre todos los entornos de Python en tu sistema
- Encuentra entornos virtuales, entornos conda, versiones de pyenv, intérpretes base
- Profundidad y filtrado configurables

- **mapRender** - Visualiza tu ecosistema de Python
- Salida de gráfico en formato JSON para uso programático
- Diagramas Mermaid para documentación
- Agrupación de intérpretes base con análisis de radio de impacto
- Visualización de enrutamiento de tareas

- **runLog** - Realiza un seguimiento del historial de ejecución de tareas
- Formato JSONL de solo anexión
- Registra qué entorno ejecutó qué tarea
- Captura el éxito/fracaso con clasificación de errores

- **taskCluster** - Agrupa las ejecuciones de tareas por firma
- Detección de tareas inestables (fallos/éxitos inconsistentes)
- Detección de inestabilidad dependiente del entorno
- Identificación de puntos críticos de fallo
- Análisis de contagio (causas raíz compartidas)

## Instalación

```bash
npm install
npm run build
```

## Uso de la línea de comandos

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

### Opciones de la línea de comandos

| Parámetro | Descripción |
|------|-------------|
| `--root, -r` | Directorio a analizar (se pueden especificar múltiples) |
| `--out` | Directorio de salida (por defecto: `.venvkit`) |
| `--maxDepth` | Profundidad máxima del directorio a analizar (por defecto: 5) |
| `--strict` | Habilita las comprobaciones de modo estricto |
| `--httpsProbe` | Prueba la conectividad HTTPS |
| `--minScore` | Filtra los entornos con una puntuación de salud inferior a esta |
| `--concurrency` | Comprobaciones en paralelo (por defecto: número de núcleos de la CPU) |
| `--runlog` | Ruta al registro de ejecución de tareas (JSONL) |
| `--no-tasks` | Omitir la visualización de tareas |

### Salidas

| Archivo | Descripción |
|------|-------------|
| `venv-map.json` | Datos completos del gráfico (nodos, aristas, resumen) |
| `venv-map.mmd` | Código fuente del diagrama Mermaid |
| `venv-map.html` | Visor interactivo |
| `reports.json` | Informes raw de doctorLite |
| `insights.json` | Recomendaciones prácticas |

## Uso programático

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

## Esquema del registro

Realiza un seguimiento de las ejecuciones de tareas añadiendo eventos a un archivo JSONL:

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

## Agrupación de tareas

Cuando tienes muchas ejecuciones de tareas, venvkit las agrupa por firma:

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

## Esquema del gráfico

La salida de `mapRender` sigue un esquema JSON estable:

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

### Tipos de nodos

| Tipo | Descripción |
|------|-------------|
| `base` | Intérprete de Python base (ej., `C:\Python311`) |
| `venv` | Entorno virtual |
| `task` | Firma de tarea (ejecuciones agrupadas) |

### Tipos de aristas

| Tipo | Descripción |
|------|-------------|
| `USES_BASE` | Relación venv → base |
| `ROUTES_TASK_TO` | Enrutamiento de tarea → entorno |
| `FAILED_RUN` | Fallo de tarea → entorno (con líneas discontinuas en Mermaid) |

## Códigos de error

| Código | Severidad | Descripción |
|------|----------|-------------|
| `SSL_BROKEN` | bad | El módulo SSL no se puede importar |
| `CERT_STORE_FAIL` | warn | La verificación del certificado HTTPS falla |
| `DLL_LOAD_FAIL` | bad | La carga de la DLL de la extensión nativa falla |
| `ABI_MISMATCH` | bad | Incompatibilidad binaria (ARM/x86) |
| `PIP_MISSING` | warn | pip no está disponible |
| `PIP_CHECK_FAIL` | warn | Se detectan conflictos de dependencias |
| `USER_SITE_LEAK` | warn | `user-site-packages` habilitado en el entorno virtual |
| `PYTHONPATH_INJECTED` | warn | La variable de entorno `PYTHONPATH` está establecida |
| `ARCH_MISMATCH` | bad | Python de 32 bits cuando se requiere 64 bits |
| `PYVENV_CFG_INVALID` | warn | `pyvenv.cfg` corrupto o faltante |

## Desarrollo

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## Seguridad y ámbito de datos

- **Escaneo de solo lectura:** Los archivos ejecutables de Python y pyvenv.cfg se leen, pero nunca se modifican.
- **Subprocesos:** Inicia `python` con argumentos controlados; no se ejecuta ningún comando a través de la shell.
- **Red:** La opción `--httpsProbe` permite probar los certificados SSL; no se realizan otras solicitudes de salida.
- **No se recopilan ni se envían datos de telemetría:** Consulte el archivo [SECURITY.md](SECURITY.md) para obtener la política completa.

## Licencia

MIT

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
