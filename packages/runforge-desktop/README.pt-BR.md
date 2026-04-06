<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<h1 align="center">RunForge Desktop</h1>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop** é um aplicativo de desktop nativo para Windows, projetado para criar, monitorar e inspecionar execuções de treinamento de modelos de aprendizado de máquina (ML).

Ele oferece um painel de controle visual para experimentos de ML, permitindo criar execuções, monitorar o progresso do treinamento em tempo real com gráficos e visualizar execuções concluídas com inspeção completa dos resultados.

> **Código-fonte original (artefatos, esquemas, garantias):**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## Por que?

A maioria das ferramentas de rastreamento de experimentos de ML são plataformas SaaS baseadas na nuvem, que exigem contas, coletam dados de uso e adicionam complexidade. O RunForge Desktop adota uma abordagem diferente: **tudo é executado localmente na sua máquina**.

Com o RunForge Desktop, você pode:

- **Criar** execuções de treinamento com configurações predefinidas.
- **Monitorar** o treinamento em tempo real com gráficos e logs.
- **Visualizar** execuções concluídas e seus resultados.
- **Inspecionar** métricas, logs e resultados.
- **Gerenciar** execuções (cancelar, visualizar resultados, copiar comandos).

Todas as execuções de treinamento são realizadas localmente na sua máquina, utilizando Python. Sem nuvem. Sem coleta de dados. Sem necessidade de contas.

---

## Pacotes NuGet

| Pacote | Descrição |
| --------- | ------------- |
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | Modelos e serviços principais para o gerenciamento de execuções de treinamento de ML, incluindo ciclo de vida, otimização de hiperparâmetros, monitoramento em tempo real e inspeção de resultados. |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## Como Começar

### Instalação

**Opção 1: Pacote MSIX (Recomendado)**
1. Baixe o arquivo `.msix` de [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases).
2. Clique duas vezes para instalar.
3. Inicie o aplicativo a partir do menu Iniciar.

**Opção 2: Compilar a partir do código-fonte**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

Consulte [docs/INSTALL.md](docs/INSTALL.md) para opções detalhadas de instalação.

### Uso

1. **Inicie** o RunForge Desktop.
2. **Selecione o Workspace** - Clique em "Selecionar Workspace" e escolha uma pasta para seus experimentos de ML.
3. **Inicie o Treinamento** - Clique em "Treinar" para configurar e iniciar uma execução de treinamento.
4. **Monitore em Tempo Real** - Acompanhe o progresso do treinamento com gráficos de perda em tempo real e logs.
5. **Visualize as Execuções** - Veja todas as execuções, filtrando por status.
6. **Inspecione os Detalhes** - Clique em qualquer execução para visualizar métricas, resultados e logs.

---

## Funcionalidades

### Criação de Execuções de Treinamento
- Configure execuções de treinamento com configurações predefinidas de épocas (Rápida, Padrão, Estendida, Personalizada).
- Seleção de dispositivo (GPU/CPU) com detecção automática.
- Configurações avançadas: tamanho do lote, taxa de aprendizado, otimizador, programador.
- Caminho opcional para um conjunto de dados personalizado.

### Otimização de Hiperparâmetros (MultiRun)
- Execute vários experimentos com diferentes combinações de hiperparâmetros.
- Configure taxas de aprendizado, tamanhos de lote e otimizadores como listas separadas por vírgula.
- Pesquisa automática em grade de todas as combinações.
- Acompanhe a configuração com melhor desempenho com base na perda final.

### Monitoramento em Tempo Real
- Gráfico de perda em tempo real com atualizações automáticas.
- Transmissão de logs em tempo real do processo de treinamento.
- Acompanhamento do progresso (época, etapa, tempo decorrido).
- Possibilidade de cancelar o treinamento em execução a qualquer momento.

### Visualização de Execuções
- Visualize as execuções com a ordem mais recente primeiro.
- Filtre por status: Pendente, Em Execução, Concluída, Falha, Cancelada.
- Visualize os detalhes e resultados da execução.

### Inspeção de Execuções
- **Métricas** - Curvas de perda, precisão, estatísticas de treinamento.
- **Logs** - Saída completa (stdout/stderr) do processo de treinamento.
- **Resultados** - Abra a pasta de resultados, copie o comando de treinamento.

### Diagnóstico
- Visualize a versão do aplicativo, o framework e o uso de memória.
- Visualize o caminho do workspace e a configuração do Python.
- Copie as informações de diagnóstico para a área de transferência para suporte.

---

## Princípios Fundamentais

### Foco no local
Todas as execuções de treinamento são realizadas na sua máquina. Não é necessário utilizar a nuvem.

### Transparente
Veja exatamente o que está acontecendo: logs em tempo real, métricas em tempo real, controle total do processo.

### Simples
Um único ambiente de trabalho, configurações predefinidas claras, sem arquivos de configuração para gerenciar.

### Auditável
Todos os resultados das execuções são salvos no disco para inspeção e reprodutibilidade.

---

## Como Funciona

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

O RunForge Desktop gerencia todo o ciclo de vida: criação, execução, monitoramento e inspeção.

---

## Requisitos do Sistema

| Requisito | Value |
| ------------- | ------- |
| OS | Windows 10 (1809+) ou Windows 11 |
| Arquitetura | x64 |
| Runtime | .NET 10 (incluído no MSIX) |
| Python | 3.10+ (para treinamento) |
| GPU | Opcional (CUDA para treinamento em GPU) |
| Espaço em Disco | ~100 MB |

---

## Plataforma e Embalagem

| Atributo | Value |
| ----------- | ------- |
| Plataforma | Windows 10/11 |
| Framework da interface | .NET MAUI |
| Embalagem | MSIX (autônomo) |
| Instalação/Desinstalação | Limpa, isolada, reversível |

O aplicativo segue os modelos padrão de permissões do Windows para acesso a arquivos.

---

## Status do Projeto

| Atributo | Value |
| ----------- | ------- |
| Versão atual | v1.0.0 |
| Scope | Treinamento, monitoramento e inspeção de modelos de ML |

Veja [RELEASE_NOTES_v0.4.0.md](RELEASE_NOTES_v0.4.0.md) para alterações recentes.

---

## Desenvolvimento

### Pré-requisitos

- .NET 10 SDK
- Windows 10/11
- Visual Studio 2022 (17.12+) com workload MAUI, OU VS Code com extensão .NET MAUI

### Construção

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### Estrutura do Projeto

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── PHASE-DESKTOP-0.1-ACCEPTANCE.md
│   └── INSTALL.md
└── scripts/
    ├── build-msix.ps1
    └── build-release.cmd
```

---

## Relação com o RunForge Core

Todos os esquemas, garantias e formatos de resultados são definidos e fixos em:

> https://github.com/mcp-tool-shop-org/runforge-vscode

Este repositório contém:
- Nenhuma lógica de treinamento
- Nenhuma definição de esquema
- Nenhuma propriedade de contrato

O RunForge Desktop **consome** esses resultados de forma fiel.

---

## Público-Alvo

- Desenvolvedores que treinam modelos localmente no Windows
- Pesquisadores que precisam de rastreamento de experimentos simples e inspecionável
- Qualquer pessoa que queira uma interface nativa do Windows para treinamento de modelos de ML
- Equipes que desejam fluxos de trabalho de ML locais, sem a necessidade de utilizar a nuvem

---

## Licença

Licença MIT - Veja [LICENSE](LICENSE) para detalhes.

---

## Testes de Confiabilidade

O RunForge é fornecido com um conjunto de testes de confiabilidade que podem ser executados localmente para validar filas, pausa/retomada, cancelamento, recuperação de falhas, justiça, resiliência à perda de dados e comportamento de reconexão do Desktop.

| Teste | Focus |
| ---------- | ------- |
| G1 | Aplicação de limite de paralelismo |
| G2 | Pausa/Retomada |
| G3 | Determinismo do cancelamento |
| G4 | Recuperação de falhas |
| G5 | Agendamento justo |
| G6 | Resiliência à perda de dados |
| G7 | Reconexão do Desktop |
| G8-G10 | Suporte a GPU (v0.4.0+) |

Veja: [`docs/GAUNTLETS.md`](docs/GAUNTLETS.md)

---

## Contribuições

Contribuições são bem-vindas. Por favor, respeite os princípios básicos:

- Mantenha a simplicidade e o foco no local
- Sem dependências da nuvem ou telemetria
- Mensagens de erro claras e acionáveis

---

## Suporte

- **Problemas:** [Problemas no GitHub](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **Diagnóstico:** Utilize a página de Diagnóstico para copiar informações do sistema e incluir em relatórios de erros.
