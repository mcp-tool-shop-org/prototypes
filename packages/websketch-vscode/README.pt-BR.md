<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## O Problema

Você quer que um LLM (Large Language Model - Modelo de Linguagem Grande) analise uma página da web, compreendendo seu layout, navegação, elementos interativos e hierarquia de conteúdo. Suas opções atuais não atendem a essa necessidade.

| Abordagem | Tokens | O que você perde |
|----------|--------|---------------|
| **Screenshot** | 1.000+ (visão) | Não consegue ler textos pequenos, adivinha o layout, sem informações sobre a interatividade. |
| **Raw HTML** | 50.000 a 500.000 | Afogado em "sopa" de divs, estilos inline, scripts e ruído SVG. |
| **Readability extract** | 2.000 a 10.000 | Remove toda a estrutura: sem navegação, botões ou formulários. |
| **DOM dump** | 10.000 a 100.000 | Nomes de classes, atributos de dados e artefatos de frameworks em todos os lugares. |

O problema central: **nenhuma dessas opções "fala a linguagem da interface do usuário" (UI)**. Os LLMs não precisam de `<div class="sc-bdnxRM jJFqsI">`; eles precisam de `NAV`, `BUTTON`, `CARD`, `LIST`.

## A Solução

WebSketch captura a página em uma **árvore semântica** usando 23 primitivas de UI. Com um clique no VS Code, você pode colar o resultado em qualquer LLM:

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200 a 800 tokens**. Não 50.000. Não é uma grade de pixels. É uma árvore limpa que qualquer modelo de texto pode analisar.

### Comparativo

| Métrica | WebSketch | HTML bruto | Captura de tela |
|--------|-----------|----------|------------|
| **Tokens** | 200 a 800 | 50,000+ | 1.000+ (visão) |
| **Structure** | Árvore semântica completa | Caos de divs aninhadas | Grade de pixels |
| **Text content** | Com texto e rótulos | Informações ocultas na estrutura | Dependente de OCR (Reconhecimento Óptico de Caracteres) |
| **Interactive elements** | Marcado com `*` | Escondido em atributos | Invisível |
| **Heading hierarchy** | `<h1>` a `<h6>` | Perdido em nomes de classes | Adivinhado pelo tamanho |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | Requer conhecimento de DOM (Document Object Model) | Não disponível |
| **Works with** | Qualquer LLM de texto | Informações inúteis | Modelos de visão apenas |

## Como Começar

1. Instale a partir do [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) ou execute:
```
ext install mcp-tool-shop.websketch-vscode
```
2. Abra o Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Execute **WebSketch: Capture URL**
4. Cole um URL e pressione Enter
5. Clique em **Copy for LLM** e cole no seu prompt

A aba LLM é a visualização padrão. Um clique copia a árvore para a sua área de transferência, pronta para qualquer modelo.

## Como Funciona

Cada linha da árvore contém informações densas e é legível por máquinas:

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### A Gramática

| Símbolo | Significado | Exemplo |
|--------|---------|---------|
| `*` no início | O usuário pode interagir com ele | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | Significado do HTML5/ARIA preservado | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | Comportamento do layout | `{sticky}`, `{scrollable}` |
| `"label"` | Conteúdo de texto visível | `"Sign up free"`, `"Search..."` |
| `(N items)` | Número de itens da lista | `LIST (12 items)` |
| Indentação | Hierarquia pai-filho | `HEADER > NAV > LIST > LINK` |

### Os 23 Papéis

| Categoria | Papéis |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

Esses 23 papéis são um vocabulário fixo, o mesmo em todos os sites. Os LLMs aprendem uma vez e podem analisar qualquer página.

## O que é Capturado

WebSketch não apenas extrai o DOM. Ele executa um **classificador de 5 níveis** em cada elemento visível:

| Nível | Fonte | Exemplo |
|------|--------|---------|
| 1. **Papel ARIA** | `role="navigation"` | &rarr; `NAV` |
| 2. **Tag HTML** | `<button>`, `<h1>` | &rarr; `BUTTON`, `TEXTO <h1>` |
| 3. **Heurísticas de classe** | `.card`, `.modal`, `.toast` | &rarr; `CARD`, `MODAL`, `TOAST` |
| 4. **Análise estrutural** | 3+ elementos irmãos com o mesmo papel | &rarr; `LISTA` |
| 5. **Reserva** | Elementos apenas com texto | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

Em seguida, ele realiza uma limpeza:

- **Traversia transparente da tabela** &mdash; as tags `TR`, `TD`, `TH` e `LI` são ignoradas, e os elementos filhos são promovidos para a superfície.
- **Eliminação de conteúdo vazio** &mdash; nós vazios, não interativos e invisíveis são removidos.
- **Colapso de wrappers** &mdash; wrappers desnecessários com apenas um elemento filho são removidos.
- **Poda em cascata** &mdash; cadeias de wrappers vazios sem conteúdo são eliminadas completamente.
- **Extração de rótulos** &mdash; texto visível é extraído de links, botões, títulos, imagens e campos de entrada.

O resultado: uma árvore limpa com o número mínimo de nós necessários para entender a página.

## Casos de Uso

### Para Engenheiros de Prompt

**"Descreva o layout desta página"** &mdash; Cole a árvore. O modelo de linguagem (LLM) vê a estrutura exata, os títulos e a navegação, sem se perder em HTML. Funciona com ChatGPT, Claude, Gemini, Llama &mdash; qualquer modelo de texto.

**"O que um usuário pode fazer nesta página?"** &mdash; Cada elemento interativo é marcado com `*`. Links, botões, campos de entrada, caixas de seleção &mdash; todos são rotulados com seu texto visível. O LLM pode enumerar todas as ações possíveis do usuário.

**"Compare estas duas páginas"** &mdash; Duas árvores lado a lado. O LLM pode comparar a estrutura, identificar elementos ausentes e comparar padrões de navegação &mdash; tudo em algumas centenas de tokens.

### Para Desenvolvedores

**"Gere um plano de testes para esta interface"** &mdash; A árvore mapeia diretamente para os elementos a serem testados. `*BUTTON "Enviar"`, `*INPUT <email> "Digite o e-mail"`, `*LINK "Termos"` &mdash; cada um é uma interação testável com seu rótulo visível.

**"Crie algo que se pareça com isso"** &mdash; A árvore semântica está próxima de uma hierarquia de componentes. `HEADER > NAV > LIST > LINK` mapeia diretamente para componentes React/Vue/Svelte. O LLM pode gerar um layout correspondente.

**"Audite esta página para acessibilidade"** &mdash; Elementos de referência ausentes, campos de entrada não rotulados, lacunas na hierarquia de títulos &mdash; tudo visível na árvore. Dicas semânticas como `<main>`, `<nav>`, `<search>` mostram quais funções ARIA estão presentes (ou ausentes).

### Para Agentes de IA

**Integração com MCP** &mdash; Use [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) para dar ao seu agente de IA a capacidade de capturar e analisar qualquer página da web como parte de sua cadeia de ferramentas.

**Monitoramento automatizado** &mdash; Use [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) para capturar páginas em um cronograma, comparar as árvores e detectar alterações estruturais.

## Quatro Visões

| Guia | O que ela mostra | Ideal para |
|-----|---------------|----------|
| **LLM** (default) | Árvore semântica indentada com rótulos, semântica e flags | Colar em prompts de LLM |
| **ASCII** | Wireframe de desenho de caixas com layout espacial | Compreensão visual do layout |
| **Tree** | Árvore de nós colapsáveis com badges coloridos representando o papel | Depuração de capturas |
| **JSON** | IR completo do `WebSketchCapture` com destaque de sintaxe | Uso programático e pipelines |

## Comandos

| Comando | Descrição |
|---------|-------------|
| `WebSketch: Capture URL` | Prompt para URL, captura e exibição |
| `WebSketch: Capture URL from Clipboard` | Captura a URL que está na sua área de transferência |
| `WebSketch: Copy LLM Tree to Clipboard` | Copie a árvore &mdash; cole diretamente no ChatGPT, Claude, etc. |
| `WebSketch: Export LLM Tree` | Salve como `.md` para bibliotecas de prompts ou documentação |
| `WebSketch: Export Capture as JSON` | Captura completa do IR com caixas delimitadoras, hashes e metadados |
| `WebSketch: Export ASCII Wireframe` | Visualização de layout com desenho de caixas |

## Configurações

| Configuração | Padrão | Descrição |
|---------|---------|-------------|
| `websketch.chromePath` | Detecção automática | Caminho para o executável do Chrome ou Edge |
| `websketch.viewportWidth` | `1280` | Largura da área de visualização em pixels |
| `websketch.viewportHeight` | `800` | Altura da área de visualização em pixels |
| `websketch.timeout` | `30000` | Tempo limite de navegação (ms) |
| `websketch.waitAfterLoad` | `1000` | Tempo de espera adicional para renderização de JavaScript (ms) |

## Ecossistema

WebSketch é uma família de ferramentas construídas sobre uma gramática compartilhada:

| Pacote | O que ele faz |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | Núcleo IR (Intermediate Representation) &mdash; gramática, validação, renderização, comparação de diferenças, identificação. |
| **websketch-vscode** | Extensão para VS Code &mdash; captura páginas do seu editor (este repositório). |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | Captura e renderização via linha de comando. |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Extensão para Chrome para captura dentro do navegador. |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | Servidor MCP para integração com agentes de LLM (Large Language Models). |

Todas as ferramentas produzem o mesmo formato `WebSketchCapture` (IR), permitindo que os resultados sejam intercambiáveis entre diferentes processos.

## Requisitos

- VS Code 1.85 ou superior.
- Chrome ou Edge instalados no seu sistema.

Não inclui navegador embutido. Não há download de 200MB. WebSketch usa `puppeteer-core` com o navegador que você já possui.

## Segurança e Escopo de Dados

**Dados acessados:** URLs inseridos pelo usuário (navegados via puppeteer-core usando Chrome/Edge local em modo "headless"), conteúdo da página capturada convertido em árvore IR, exportações gravadas em arquivos do espaço de trabalho ou na área de transferência. **Dados NÃO acessados:** nenhum arquivo fora do espaço de trabalho, nenhuma credencial do sistema operacional, nenhuma sessão de login do navegador (modo "headless" sem perfil). **Rede:** navega apenas para URLs especificados pelo usuário — não há outras requisições de saída. **Nenhuma telemetria** é coletada ou enviada.

## Licença

Licença MIT &mdash; veja [LICENSE](LICENSE) para detalhes.

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
