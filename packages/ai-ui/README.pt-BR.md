<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ai-ui/main/assets/logo-ai-ui.png" alt="AI-UI" width="600" />
</p>

**Diagnóstico automatizado de design para SPAs.** A ferramenta AI-UI analisa o seu aplicativo em execução, lê a sua documentação e informa precisamente quais funcionalidades documentadas não possuem um ponto de acesso na interface do usuário – e quais elementos da interface do usuário não estão documentados de forma alguma.

Ele não faz suposições. Ele constrói um grafo de gatilhos a partir de interações reais do navegador, associa características a gatilhos de forma determinística e gera um mapa de design com resultados práticos: "exibir", "rebaixar", "manter", "unir". Em seguida, ele verifica a correção.

## O que ele faz

```
README says "ambient soundscapes"  →  atlas extracts the feature
Probe clicks every button           →  "Audio Settings" trigger found
Diff matches feature to trigger     →  coverage: 64%
Design-map says: must-surface 0     →  all documented features are discoverable
```

A AI-UI fecha a lacuna entre as promessas documentadas e a realidade da interface do usuário.

## Instalar

```bash
git clone https://github.com/mcp-tool-shop-org/ai-ui.git
cd ai-ui
npm install
```

Requer Node.js 20 ou superior e um servidor de desenvolvimento em execução para os comandos "probe" e "runtime-effects".

## Início rápido

```bash
# 1. Parse your docs into a feature catalog
ai-ui atlas

# 2. Crawl your running app
ai-ui probe

# 3. Match features to triggers
ai-ui diff

# Or run all three in sequence:
ai-ui stage0
```

A saída é gravada na pasta `ai-ui-output/`. O relatório de diferenças informa quais elementos foram encontrados, quais estão ausentes e quais não estão documentados.

## Comandos

| Comando. | O que ele faz. |
|---------|-------------|
| `atlas` | Converter a documentação (README, CHANGELOG, etc.) em um catálogo de funcionalidades. |
| `probe` | Analise a interface do usuário em funcionamento e registre todos os elementos interativos. |
| `surfaces` | Extraia as superfícies de uma captura do WebSketch. |
| `diff` | Compare as características do atlas de correspondência com os gatilhos de verificação. |
| `graph` | Construir o grafo de gatilhos a partir das informações de sondagem, superfícies e diferenças. |
| `design-map` | Gerar inventário de superfícies, mapa de características, fluxogramas de tarefas e proposta de inteligência artificial. |
| `compose` | Gere um plano de implementação a partir das diferenças e do gráfico. |
| `verify` | Avaliar os artefatos do pipeline – determinar se a execução foi bem-sucedida ou não para o sistema de integração contínua. |
| `baseline` | Salvar/comparar linhas de base de verificação. |
| `pr-comment` | Gere um comentário em Markdown, pronto para ser incluído em um comunicado de imprensa, a partir de informações disponíveis. |
| `runtime-effects` | Clique nos elementos interativos em um navegador real e registre os efeitos colaterais observados. |
| `runtime-coverage` | Matriz de cobertura por gatilho (verificada / detectada / observada). |
| `replay-pack` | Agrupe todos os artefatos em um pacote reproduzível para facilitar a replicação. |
| `replay-diff` | Compare dois pacotes de repetições: mostre as alterações e as razões por trás delas. |
| `ai-suggest` | Correspondência entre os recursos do documento e as interfaces de usuário usando Ollama (Cérebro). |
| `ai-eyes` | Identificação visual de elementos com apenas ícones e com pouco texto usando LLaVA (Olhos). |
| `ai-hands` | Geração de patches prontos para envio de pull requests (PR) para corrigir lacunas usando qwen2.5-coder (Mãos). |
| `stage0` | Execute os comandos "atlas", "probe" e "diff" em sequência. |
| `init-memory` | Crie arquivos de memória vazios para o rastreamento de decisões. |

## Configuração

Crie o arquivo `ai-ui.config.json` na raiz do seu projeto:

```json
{
  "docs": { "globs": ["README.md", "CHANGELOG.md", "docs/*.md"] },
  "probe": {
    "baseUrl": "http://localhost:5173",
    "routes": ["/", "/settings", "/dashboard"]
  },
  "featureAliases": {
    "dark-mode-support": ["Theme", "Dark mode"]
  },
  "goalRules": [
    { "id": "settings_open", "label": "Open Settings", "kind": "domEffect", "dom": { "textRegex": "Settings" }, "score": 2 }
  ]
}
```

Todos os campos são opcionais – valores padrão adequados são aplicados. Consulte o arquivo `cli/src/config.mjs` para ver o esquema completo.

### Regras sobre os gols

Para SPAs (Single Page Applications) em que os URLs não se alteram, as metas baseadas em rotas são inúteis. As regras de metas permitem definir o sucesso com base em efeitos observáveis:

| Tipo. | Partidas.
Correspondências.
Fósforos.
Combinados.
Casamentos.
Encontros.
Jogos. | Exemplo. |
|------|---------|---------|
| `storageWrite` | Escrita em localStorage/sessionStorage. | `{ "keyRegex": "^user\\.prefs\\." }` |
| `fetch` | Solicitações HTTP por método/URL/status. | `{ "method": ["POST"], "urlRegex": "/api/save" }` |
| `domEffect` | Mutações DOM (relacionadas a elementos como janelas modais, notificações, etc.). | `{ "textRegex": "saved" }` |
| `composite` | E de vários tipos. | armazenamento + domínio para "configurações salvas" |

As regras exigem evidências em tempo de execução (`ai-ui runtime-effects` + `ai-ui graph --with-runtime`) para que os objetivos sejam considerados atingidos. Sem evidências, os objetivos permanecem sem avaliação — não há falsos positivos.

## Saída do mapa de design

O comando `design-map` gera quatro elementos:

- **Inventário de elementos visíveis** — todos os elementos interativos agrupados por localização (navegação principal, configurações, barra de ferramentas, elementos embutidos).
- **Mapa de funcionalidades** — cada funcionalidade documentada, com sua pontuação de descoberta, pontos de acesso e ação recomendada.
- **Fluxos de tarefas** — sequências de navegação inferidas, com detecção de loops e acompanhamento de objetivos.
- **Proposta de interface** — navegação principal, navegação secundária, elementos essenciais a serem exibidos, elementos documentados que não devem ser exibidos, caminhos de conversão.

### Ações recomendadas

| Ação. | Significado. |
|--------|---------|
| `promote` | A funcionalidade está documentada, mas é difícil de encontrar – é necessário um ponto de acesso mais fácil de usar. |
| `keep` | A funcionalidade está bem equilibrada – documentada e fácil de descobrir. |
| `demote` | A funcionalidade é proeminente, mas arriscada ou de baixo valor – mova para configurações avançadas. |
| `merge` | Nomes de funcionalidades duplicados em diferentes rotas – consolide. |
| `skip` | Não é uma funcionalidade real (nome semelhante a uma frase, sem base). |

## Pipeline

A sequência completa do pipeline:

```
atlas → probe → diff → graph → design-map → ai-suggest → ai-eyes → ai-hands
                 ↓                                                      ↓
          runtime-effects → graph --with-runtime                  hands.plan.md
                                    ↓                             hands.patch.diff
                              design-map (with goals)             hands.files.json
                                    ↓                             hands.verify.md
                              replay-pack → replay-diff
```

Cada etapa lê a saída da etapa anterior do diretório `ai-ui-output/`. O pipeline é determinístico – as mesmas entradas produzem as mesmas saídas.

## Comandos de IA (Ollama local)

Três comandos usam modelos Ollama locais para ir além da correspondência determinística. Eles exigem que o [Ollama](https://ollama.com) esteja em execução localmente — nenhum dado sai da sua máquina.

### ai-suggest (Cérebro)

Correspondência semântica entre os recursos documentados e as interfaces de usuário usando um modelo de linguagem grande (LLM) de uso geral.

```bash
ai-ui ai-suggest                        # default model
ai-ui ai-suggest --model qwen2.5:14b    # specify model
ai-ui ai-suggest --eyes ai-ui-output/eyes.json  # enrich with Eyes data
```

Gera patches que informam ao motor de diff quais recursos correspondem a quais elementos, preenchendo lacunas que a correspondência de strings imprecisa não detecta.

### ai-eyes (Olhos)

Enriquecimento visual da interface usando um modelo de visão (LLaVA). Identifica botões com apenas ícones, controles com pouco texto e elementos visualmente ambíguos.

```bash
ai-ui ai-eyes                           # default: llava:13b
ai-ui ai-eyes --model llava:7b          # lighter model
```

Adiciona anotações aos elementos com `icon_guess`, `visible_text` e `nearby_context` — contexto que os comandos subsequentes (ai-suggest, ai-hands) usam para um direcionamento preciso.

### ai-hands (Mãos)

Gerador de patches prontos para envio de pull requests usando um modelo de código (qwen2.5-coder). Lê a saída completa do pipeline de mapeamento de design e gera edições de "encontrar/substituir" para preencher as lacunas na interface.

```bash
ai-ui ai-hands                          # all tasks, default model
ai-ui ai-hands --tasks surface-settings,goal-hooks  # specific tasks
ai-ui ai-hands --repo /path/to/project  # target a different repo
ai-ui ai-hands --min-rank 0.50          # only high/medium confidence edits
```

**Tipos de tarefas:**
- `add-aiui-hooks` — adiciona atributos `data-aiui-safe` a elementos interativos não destrutivos.
- `surface-settings` — melhora a descoberta de recursos documentados, mas pouco acessíveis.
- `goal-hooks` — adiciona atributos `data-aiui-goal` para detecção da conclusão de tarefas.
- `copy-fix` — alinha os rótulos da interface com a terminologia da documentação.

**Saídas:** `hands.plan.md` (grupos de edições classificados), `hands.patch.diff` (pedaços na ordem de confiança), `hands.files.json` (manifesto com metadados de classificação), `hands.verify.md` (lista de verificação de verificação).

Cada edição é classificada por confiabilidade (força de validação, qualidade da âncora, localidade, procedência, segurança) e organizada em categorias de alta/média/baixa confiança. As edições nunca são aplicadas automaticamente — a saída é sempre uma proposta para revisão humana.

## Integração com CI

```bash
# Run pipeline + verify in CI
ai-ui stage0
ai-ui graph
ai-ui verify --strict --gate minimum --min-coverage 60

# Exit code 0 = pass, 1 = user error, 2 = runtime error
```

Use `--json` para obter uma saída legível por máquinas. Use `baseline --write` para definir os limites.

## Modelo de ameaças

O AI-UI é executado localmente contra o seu servidor de desenvolvimento. Ele não:
- Envia dados para serviços externos (os comandos de IA usam apenas o Ollama local).
- Modifica o seu código-fonte ou configuração (o ai-hands gera propostas, mas nunca as aplica).
- Acessa qualquer coisa fora do `baseUrl` e dos arquivos de documentação configurados.
- Requer acesso à rede (toda a análise é local).

O comando `runtime-effects` simula cliques em botões reais em um navegador Playwright. Ele respeita as regras de segurança:
- Os gatilhos que correspondem a padrões de negação (excluir, remover, destruir, etc.) são ignorados.
- O atributo `data-aiui-safe` pode substituir as regras de segurança para gatilhos considerados seguros.
- O modo `--dry-run` simula o clique, mas não executa a ação.

## Testes

```bash
npm test
```

877 testes usando o executor de testes nativo do Node.js. Nenhum framework de teste externo.

## Licença

MIT – veja [LICENSE](LICENSE).

---

Criado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
