<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundweave/readme.png" width="400" alt="SoundWeave">
</p>

<p align="center">
  <a href="https://www.npmjs.com/search?q=%40soundweave"><img src="https://img.shields.io/npm/v/@soundweave/schema?label=npm&color=cb3837" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/soundweave/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundweave/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundweave"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundweave/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundweave/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Estúdio de trilha sonora adaptável para composição, arranjo, criação de trilhas sonoras e exportação de músicas interativas para jogos.

## O que é

Soundweave é uma estação de trabalho focada na composição, com recursos de adaptação. Combina a criação estruturada de música — trechos, pistas, cenas, camadas, automação — com lógica adaptativa que responde ao estado do jogo em tempo real. O resultado: músicas para jogos que parecem intencionais, e não geradas aleatoriamente.

## O que não é

Uma DAW (Digital Audio Workstation). Um sequenciador simples. Um gerador de música baseado em inteligência artificial. Um banco de dados para criação de mundos com sons. Soundweave é uma ferramenta criativa para a criação de trilhas sonoras adaptativas para jogos.

## O que ele pode fazer

- **Compor** — Clipes com notas, instrumentos, escalas, acordes, transformações de motivos, variações de intensidade.
- **Sintetizar** — Sons de sintetizador com múltiplos osciladores e unison/supersaw (16 predefinições), modulação LFO (filtro, amplitude, afinação).
- **Amostras de instrumentos** — Modelos de piano, cordas, guitarra via SampleVoice; importar, cortar, dividir, construtor de kits.
- **Organizar** — Cenas com camadas, funções de seções, curvas de intensidade; 10 predefinições de padrões de bateria.
- **Mixar e aplicar efeitos** — 8 tipos de efeitos (EQ, delay, reverb, compressor, chorus, distorção, phaser, limiter); 4 slots de efeitos para cada camada.
- **Criar um mundo** — Famílias de motivos, perfis de partitura, famílias de indicações, entradas no mapa do mundo, derivação.
- **Automatizar** — Trilhas, macros, envelopes, captura e mesclagem em tempo real.
- **Salvar e reutilizar** — Modelos, instantâneos, ramificações, favoritos, coleções, comparar.
- **MIDI** — Importar/exportar arquivos MIDI padrão.
- **Lógica adaptativa** — Associações de gatilhos, transições, resolução determinística de cenas.
- **Executar** — Visualização de clipes em tempo real, pré-visualização com um clique, metrônomo com cliques agendados via AudioContext.
- **Validar** — Validação de esquema, auditoria de integridade, verificações de referência cruzada.
- **Exportar** — WAV de 24/32 bits a 44.1/48/96kHz; pacotes de tempo de execução para uso em engines de jogos.
- **Criar** — Desfazer/refazer (até 50 níveis, Ctrl+Z), salvar/carregar projeto com salvamento automático, atalhos de teclado (Espaço=reproduzir, ?=ajuda), BPM e compasso globais.
- **Confiabilidade** — Limite de erros com recuperação suave, agendamento antecipado do AudioContext para sincronização precisa.

## Estrutura do Monorepository

### Aplicativos

| Aplicativo | Descrição |
|-----|-------------|
| [`apps/studio`](apps/studio) | Interface de usuário principal de criação (Next.js 15, Zustand 5). |
| [`apps/docs`](apps/docs) | Site de documentação (Astro). |

### Pacotes Principais

| Pacote | Descrição |
|---------|-------------|
| [`@soundweave/schema`](packages/schema) | Tipos canônicos, esquemas Zod, análise/validação. |
| [`@soundweave/asset-index`](packages/asset-index) | Indexação e auditoria da integridade dos pacotes. |
| [`@soundweave/audio-engine`](packages/audio-engine) | Reprodução de amostras, gerenciamento de vozes, agendamento do AudioContext. |
| [`@soundweave/test-kit`](packages/test-kit) | Ferramentas de teste e utilitários. |

### Composição e Reprodução

| Pacote | Descrição |
|---------|-------------|
| [`@soundweave/clip-engine`](packages/clip-engine) | Sequenciamento de trechos, transformações, agendamento de pistas. |
| [`@soundweave/instrument-rack`](packages/instrument-rack) | Sintetizador com múltiplos osciladores, voz de bateria, voz de amostra, modulação LFO, 16 predefinições. |
| [`@soundweave/music-theory`](packages/music-theory) | Escalas, acordes, motivos, transformações de intensidade. |
| [`@soundweave/playback-engine`](packages/playback-engine) | Reprodução em tempo real, mixagem, 8 tipos de efeitos, E/S MIDI, exportação WAV (24/32 bits). |
| [`@soundweave/sample-lab`](packages/sample-lab) | Ferramentas para cortar, dividir, criar kits e instrumentos. |
| [`@soundweave/score-map`](packages/score-map) | Motivos, perfis, famílias de pistas, derivação. |
| [`@soundweave/automation`](packages/automation) | Canais, macros, envelopes, captura. |
| [`@soundweave/library`](packages/library) | Modelos, instantâneos, ramificações, favoritos, comparação. |

### Infraestrutura

| Pacote | Descrição |
|---------|-------------|
| [`@soundweave/scene-mapper`](packages/scene-mapper) | Mapeamento de gatilhos e avaliação determinística de associações. |
| [`@soundweave/runtime-pack`](packages/runtime-pack) | Exportação/importação em tempo de execução com serialização determinística. |
| [`@soundweave/review`](packages/review) | Resumos e utilitários de auditoria. |
| [`@soundweave/ui`](packages/ui) | Componentes de interface de usuário compartilhados. |

## Instalar

```bash
npm install @soundweave/schema @soundweave/clip-engine @soundweave/runtime-pack
```

Todos os pacotes são publicados no npm sob o escopo `@soundweave`.

## Início rápido (monorepo)

```bash
pnpm install
pnpm build
pnpm test       # 1,002 tests across all packages
pnpm dev        # Start Studio dev server
```

**Requisitos:** Node.js >= 22, pnpm >= 10

## Testes

Todos os 16 pacotes possuem testes unitários que cobrem a validação de esquema, auditoria de integridade, operações com amostras, criação de mundos, automação, gerenciamento de bibliotecas, reprodução, síntese, efeitos, MIDI e integração com o estúdio. 1.002 testes em todos os pacotes.

Para executar todos os testes: `pnpm test`

## Manual

O [manual](https://mcp-tool-shop-org.github.io/soundweave/handbook/product/) é o manual de operação abrangente que cobre a definição do produto, a arquitetura, a navegação no estúdio, os fluxos de trabalho criativos e a estratégia. Principais pontos de acesso:

- [Produto: O que é o SoundWeave](https://mcp-tool-shop-org.github.io/soundweave/handbook/product/)
- [Arquitetura: Visão geral do repositório](https://mcp-tool-shop-org.github.io/soundweave/handbook/architecture/)
- [Fluxo de trabalho: Criando uma indicação do zero](https://mcp-tool-shop-org.github.io/soundweave/handbook/workflows/building-a-cue/)
- [Fluxo de trabalho: Trabalhando com amostras personalizadas](https://mcp-tool-shop-org.github.io/soundweave/handbook/workflows/custom-samples/)
- [Fluxo de trabalho: Criação de mundos](https://mcp-tool-shop-org.github.io/soundweave/handbook/workflows/world-scoring/)
- [Estratégia: Glossário](https://mcp-tool-shop-org.github.io/soundweave/handbook/strategy/glossary/)
- [Pacotes de exemplo](examples/)

## Segurança e Confiança

Soundweave funciona **totalmente no navegador**. Não há servidor, não há sincronização na nuvem, não há coleta de dados.

- **Dados acessados:** Arquivos de pacotes de trilha sonora criados pelo usuário (JSON), referências de ativos de áudio, armazenamento local do navegador.
- **Dados NÃO acessados:** Não há armazenamento no lado do servidor, não há acesso ao sistema de arquivos além do sandbox do navegador.
- **Rede:** Sem tráfego de rede — toda a criação e reprodução ocorrem no lado do cliente.
- **Credenciais:** Não lê, armazena ou transmite credenciais.
- **Coleta de dados:** Nenhum dado é coletado ou enviado.
- **Permissões:** Apenas APIs padrão do navegador (Web Audio API).

Consulte o arquivo [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

## Licença

MIT

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
