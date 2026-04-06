<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Training Studio

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**Treine modelos de aprendizado de máquina diretamente no seu navegador. Sem nuvem. Sem upload de dados. Sem configuração do Python.**

Training Studio é uma aplicação de treinamento de ML alimentada por TensorFlow.js que roda inteiramente localmente. Seus dados nunca saem do seu dispositivo.

## Por que usar o Training Studio?

| Problema | Solução |
| --------- | ---------- |
| Dificuldades com o ambiente Python | **Configuração zero** - basta abrir e treinar |
| Preocupações com a privacidade em ML na nuvem | **100% local** - os dados nunca saem do seu dispositivo |
| Ferramentas de ML complexas | **Fluxo de trabalho simples** - dados em CSV, modelo treinado como saída |
| Ciclos de iteração lentos | **Feedback em tempo real** - gráficos e métricas ao vivo |

## Recursos

### Treinamento Básico
- **Carregamento de conjuntos de dados CSV** - Detecção automática de recursos/rótulos
- **Configuração de modelos MLP** - Camadas ocultas, ativação, dropout
- **Gráficos de treinamento em tempo real** - Visualização de perda e precisão
- **Parada antecipada** - Detecção automática de convergência
- **Aceleração por GPU** - WebGPU/WebGL para treinamento rápido

### Avaliação e Predição
- **Matriz de confusão** - Desempenho visual da classificação
- **Métricas por classe** - Precisão, revocação, pontuação F1
- **Predições individuais** - Teste de amostras individuais
- **Inferência em lote** - Predição em arquivos CSV
- **Exportação de resultados** - Download de predições como CSV

### Ferramentas de Dados
- **Pré-processamento** - Normalização, tratamento de valores ausentes
- **Codificação one-hot** - Conversão automática de categorias
- **Divisão em treinamento/teste** - Percentual de validação configurável
- **Histórico de treinamento** - Compare execuções, encontre os melhores modelos

### Pronto para Produção
- **283 testes** - Cobertura de teste abrangente
- **Acessível** - Baseado em WCAG 2.1 AA
- **Responsivo** - Funciona em tablet e celular
- **Funciona offline** - Não requer internet após a instalação

## Instalação

### A partir do Código Fonte

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## Início Rápido

### Validar um Pacote (30 segundos)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### Saída JSON

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### Códigos de Saída

| Code | Significado |
| ------ | --------- |
| 0 | Pacote válido |
| 2 | Válido com avisos |
| 3 | Pacote inválido |

## Formato do Pacote

Consulte [SPEC.md](SPEC.md) para a especificação completa do pacote.

### Estrutura de Diretórios

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## Início rápido (Aplicativo Web)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

Em seguida, abra http://localhost:5173 no seu navegador.

### Experimente com dados de exemplo

1. Clique na aba **Dataset**
2. Carregue `sample_data/iris.csv`
3. Selecione os recursos: sepal_length, sepal_width, petal_length, petal_width
4. Selecione o rótulo: species
5. Vá para a aba **Model**, use os valores padrão (64, 32 camadas ocultas)
6. Vá para a aba **Train**, clique em **Start Training**
7. Observe os gráficos sendo atualizados em tempo real!

## Aplicativo Desktop (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

Requer Windows 10 1809+, 4 GB de RAM (8 GB recomendados), GPU com WebGL 2.0 ou WebGPU (opcional, fallback para CPU).

## Desenvolvimento

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## Documentação

| Documento | Descrição |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | Especificação do formato do pacote |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problemas comuns e soluções |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de versões |
| [ROADMAP.md](ROADMAP.md) | Roteiro de desenvolvimento |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Como contribuir |

## Conjuntos de dados de exemplo

| File | Task | Funcionalidades | Classes |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | Classificação multiclasse | 4 | 3 |
| `sample_data/binary_classification.csv` | Classificação binária | 2 | 2 |

## Privacidade e segurança

- **Nenhuma coleta de dados** - Seus dados permanecem no seu dispositivo.
- **Sem telemetria** - Não rastreamos o uso.
- **Funciona offline** - Funciona sem internet.
- **Código aberto** - Você pode auditar o código.

Consulte [PRIVACY.md](PRIVACY.md) e [SECURITY.md](SECURITY.md) para obter detalhes.

## Licença

MIT - Consulte [LICENSE](LICENSE) para obter detalhes.

---

Desenvolvido por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
