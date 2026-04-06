<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/game-dev-mcp/readme.png" alt="Game Dev MCP" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/game-dev-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/game-dev-mcp"><img src="https://img.shields.io/npm/v/@mcptoolshop/game-dev-mcp" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/game-dev-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  Talk to your game engine. Spawn actors, build levels, tweak properties — all through natural conversation with any LLM.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#what-can-it-do">44 Tools</a> &middot;
  <a href="#knowledge-library">Knowledge Library</a> &middot;
  <a href="HANDBOOK.md">Handbook</a>
</p>

---

Atualmente, oferece suporte ao **Unreal Engine 5** por meio da API de Controle Remoto integrada. Não requer plugins de terceiros. Não há necessidade de compilação em C++. Basta ativar a API e começar a interagir.

## Como é a experiência?

> **Você:** Crie uma luz pontual acima da mesa e deixe-a com uma tonalidade quente.

O LLM chama `ue_spawn_actor`, define a transformação, ajusta a temperatura da cor por meio de `ue_set_property` — e a luz aparece na sua visualização. Você continua conversando, e ele continua construindo.

## Como começar

### 1. Ative a API de Controle Remoto no UE5

1. Abra seu projeto do UE5 (5.4 ou superior).
2. **Editar > Plugins** → procure por "Remote Control API" → Ative.
3. Reinicie o editor.

Este plugin já vem incluído no UE5 — você está apenas ativando-o.

### 2. Instale e configure

```bash
npx @mcptoolshop/game-dev-mcp
```

Adicione à configuração do seu cliente MCP (por exemplo, `claude_desktop_config.json` do Claude Desktop):

```json
{
  "mcpServers": {
    "gamedev": {
      "command": "npx",
      "args": ["@mcptoolshop/game-dev-mcp"]
    }
  }
}
```

### 3. Teste

Pergunte ao seu LLM: **"Ping Unreal Engine"** — ele chamará `ue_ping` e confirmará a conexão.

## O que ele pode fazer?

### Ativos (9 ferramentas)
Crie, exclua, duplique, transforme, liste, encontre e selecione ativos no nível. Funciona com qualquer classe de ativo — malhas, luzes, câmeras, volumes.

### Propriedades (4 ferramentas)
Leia e escreva qualquer `UPROPERTY` em qualquer `UObject`. Use `ue_describe_object` para descobrir o que está disponível, e então obtenha ou defina exatamente o que você precisa.

### Recursos (8 ferramentas)
Pesquise no navegador de conteúdo, liste diretórios, verifique a existência, duplique, renomeie, exclua e salve recursos.

### Níveis (4 ferramentas)
Salve o nível atual, carregue um diferente, obtenha informações do nível ou salve todos os pacotes modificados de uma vez.

### Blueprints (5 ferramentas)
Crie classes de Blueprint do zero, adicione componentes, configure suas propriedades, compile e crie instâncias — tudo por meio de conversas.

### Editor (4 ferramentas)
Teste a conexão, execute comandos do console, obtenha informações do motor e fixe a visualização em qualquer ativo.

### Conhecimento (1 ferramenta)
Pesquise 35 tutoriais integrados do UE5 sob demanda — para que seu LLM possa pesquisar como o Nanite funciona ou o que é uma Behavior Tree, durante a conversa.

### Projeto (7 ferramentas)
Armazene convenções, notas e contexto específicos do projeto em `.game-dev-mcp/` que persiste entre as sessões.

### Missão (2 ferramentas)
Acompanhe o progresso durante operações de várias etapas. Integra-se com [mcp-aside](https://github.com/mcp-tool-shop-org/mcp-aside) para notificações em tempo real.

**Total: 44 ferramentas**

## Biblioteca de Conhecimento

O servidor inclui 35 tutoriais como recursos MCP. Seu LLM os lê sob demanda — nenhum contexto é desperdiçado até que ele realmente precise da informação:

| Categoria | Conteúdo |
| ---------- | -------- |
| **Getting Started** | Configuração, primeiros comandos, estrutura do projeto |
| **Actors** | Criação, transformações, referência de tipo, componentes |
| **Assets** | Navegador de conteúdo, padrões de pesquisa, importação |
| **Blueprints** | Conceitos básicos, criação, configuração de componentes |
| **Levels** | Gerenciamento, composição de mundos |
| **Materials** | Conceitos básicos, instâncias de materiais |
| **Lighting** | Tipos de luz, fluxo de trabalho |
| **Physics** | Simulação, colisões, restrições |
| **Audio** | Sons, atenuação, áudio espacial |
| **Animation** | Malha esquelética, AnimBP, montagens |
| **Visual Effects** | Partículas Niagara, simulação na GPU |
| **Rendering** | Nanite, Lumen, mapas de sombras virtuais |
| **AI & Navigation** | NavMesh, árvores de comportamento, EQS |
| **Cinematics** | Sequenciador, câmeras, renderização cinematográfica |
| **Virtual Assistant** | Assistentes MetaHuman, integração de LLM |
| **API Reference** | API de Controle Remoto, referência de subsistema |
| **Patterns** | Fluxos de trabalho comuns, tratamento de erros, desempenho |

## Conhecimento do projeto

Seu LLM pode armazenar e recuperar informações contextuais específicas do projeto:

```
ue_project_init(name: "My Game", ueVersion: "5.4")
ue_project_set_convention(convention: "All Blueprints use BP_ prefix")
ue_project_add_note(title: "Level Layout", content: "Main hall is 2000x1000 cm")
```

Armazenado em `.game-dev-mcp/` – persiste entre as sessões, permitindo que a IA continue de onde você parou.

## Configuração

| Variável | Padrão | Descrição |
| ---------- | --------- | ------------- |
| `GAMEDEV_MCP_HOST` | `127.0.0.1` | Nome do host do editor do motor de jogo |
| `GAMEDEV_MCP_PORT` | `30010` | Porta da API remota |
| `GAMEDEV_MCP_TIMEOUT` | `10000` | Tempo limite de requisição (ms) |
| `GAMEDEV_MCP_LOG_LEVEL` | `info` | Nível de log (erro/alerta/informação/depuração) |

## Requisitos

- Node.js 18+
- Unreal Engine 5.4+ com o plugin Remote Control API habilitado

## Manual

Para um guia completo – configuração, padrões práticos, solução de problemas e explicação de cada ferramenta – leia o **[Manual](HANDBOOK.md)**.

## Licença

MIT – Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
