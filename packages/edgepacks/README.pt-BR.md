<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

Conjunto de ferramentas para criar conjuntos de dados para treinar modelos pequenos em tarefas específicas.

## O que é isso

Uma biblioteca de conjuntos de dados bem estruturados, com licença livre, para treinar modelos em tarefas específicas. Cada conjunto inclui regras de geração, regras de validação, conjuntos de avaliação e caminhos de exportação para ferramentas de ajuste fino comuns.

## O que isso NÃO é

- Um repositório genérico de conjuntos de dados
- Um wrapper para o HuggingFace
- Um framework de treinamento

## Instalação

```bash
pip install edgepacks
```

## Início rápido

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## Executando os conjuntos de dados

| Conjunto de dados | Tarefa | O que é treinado |
|------|------|---------------|
| `tool-routing` | Classificação | Solicitação em linguagem natural → ferramenta correta + argumentos |
| `structured-extraction` | Extração | Texto não estruturado → JSON estruturado |
| `error-triage` | Classificação | Logs de erro → causa + severidade + próximo passo |

## Arquitetura

Três camadas:

1. **Schema** — especificação formal do que um conjunto de dados é.
2. **Foundry** — ferramentas para criar, validar e dividir conjuntos de dados.
3. **Delivery** — interface de linha de comando (CLI) + exportação para JSONL, HuggingFace, Unsloth, torchtune.

## Cada conjunto de dados inclui:

- Definição da tarefa + esquema canônico
- Divisões de treinamento / validação / teste
- Exemplos positivos e exemplos negativos difíceis
- Receita de geração (sintética via Ollama)
- Validador que rejeita linhas mal formatadas ou com baixo sinal
- Conjunto de avaliação que testa a habilidade real após o ajuste fino
- Exportação para formatos que se integram diretamente com ferramentas comuns

## Segurança e Confiança

**Dados acessados:** Arquivos `.json` / `.jsonl` locais em diretórios de saída especificados pelo usuário. Exemplos iniciais são incluídos no pacote. Exemplos gerados são gravados em `./output/` ou em um caminho que você especificar.

**Rede:** HTTP apenas para o Ollama local (`localhost:11434`) para geração sintética. Sem APIs na nuvem, sem telemetria, sem análise. Funciona totalmente offline assim que o Ollama estiver disponível.

**Dados NÃO acessados:** Nenhum arquivo de credenciais, nenhum arquivo do sistema, nenhuma variável de ambiente. Não lê nem grava fora do diretório de saída que você especificar.

**Nenhuma telemetria** é coletada ou enviada.

## Plataformas

- Python 3.11+
- Funciona em Linux, macOS, Windows
- Ollama necessário apenas para os comandos `generate`, `mutate` e `build`

## Licença

MIT

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
