<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

Jogo de estratégia marítima focado em comércio. Construa uma carreira como mercador em cinco regiões, utilizando estratégias de arbitragem de rotas, contratos, infraestrutura, finanças e reputação — tudo a partir do terminal. Não é necessário conhecimento de Python.

## Instalação

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

Ou instale globalmente:

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

Também disponível via pip: `pip install portlight`

## Por que escolher Portlight?

A maioria dos jogos de comércio simplifica o comércio para um número que aumenta. Portlight trata o comércio como uma disciplina comercial:

- **Os preços reagem às suas transações.** Despejar grãos em um porto faz com que o preço caia. Cada venda altera o mercado local.
- **Os portos têm identidades econômicas reais.** Porto Novo produz grãos a baixo custo. Silk Haven exporta seda em grande volume. Essas características são estruturais, não aleatórias.
- **As viagens envolvem riscos.** Tempestades, piratas, inspeções, perigos sazonais. Suas provisões, casco e tripulação são importantes.
- **Os contratos exigem comprovação.** Entregue os produtos corretos no porto certo antes do prazo. A procedência é rastreada.
- **A infraestrutura muda a forma como você comercializa.** Armazéns armazenam carga. Corretores melhoram os contratos. Licenças desbloqueiam acesso premium.
- **A reputação abre e fecha portas.** Confiança comercial, atenção alfandegária, posição regional e conexões com o submundo — quatro fatores que moldam o que você pode fazer e onde.
- **O jogo analisa o que você construiu.** Seu histórico de comércio, infraestrutura, reputação e rotas formam um perfil de carreira. Quatro caminhos distintos para a vitória, baseados no tipo de mercador que você se tornou.

## O Mundo

Cinco regiões. Vinte portos. Quarenta e três rotas. Uma economia dinâmica.

| Região | Portos | Personagem |
|--------|-------|-----------|
| **Mediterranean** | Porto Novo, Al-Manar, Silva Bay, Corsair's Rest | Grãos, madeira, mercados de especiarias. Águas iniciais seguras. |
| **North Atlantic** | Ironhaven, Stormwall, Thornport | Ferro, armas, comércio militar. Inspeções rigorosas. |
| **West Africa** | Sun Harbor, Palm Cove, Iron Point, Pearl Shallows | Algodão, rum, pérolas. Provisões mais baratas. |
| **East Indies** | Jade Port, Monsoon Reach, Silk Haven, Crosswind Isle, Dragon's Gate, Spice Narrows | Seda, especiarias, porcelana, chá. Margens mais altas. Risco de monções. |
| **South Seas** | Ember Isle, Typhoon Anchorage, Coral Throne | Pérolas, medicamentos. Águas remotas para o final do jogo. |

134 NPCs nomeados em todos os portos. Quatro facções de piratas controlando diferentes áreas. Clima sazonal que altera o perigo e a demanda. Uma camada cultural com festivais, superstições e moral da tripulação.

## Nove Capitães

| Capitão | Lar | Vantagem | Compromisso |
|---------|------|------|-----------|
| **Merchant** | Porto Novo | Melhores preços, confiança aumenta rapidamente | Penalidades de "heat" dobradas |
| **Smuggler** | Corsair's Rest | Mercado negro, comércio de contrabando | Maior "heat", mais inspeções |
| **Navigator** | Monsoon Reach | Navios mais rápidos, maior alcance | Reputação inicial mais fraca |
| **Privateer** | Ironhaven | Combate naval, vantagem no embarque | Má reputação como mercador |
| **Corsair** | Corsair's Rest | Combate equilibrado + comércio | Mestre de nada |
| **Scholar** | Jade Port | Vantagem de informações, melhores contratos | Capital inicial baixo, instável |
| **Merchant Prince** | Porto Novo | Alto capital inicial, acesso premium | Taxas mais altas, alvo de piratas |
| **Dockhand** | Crosswind Isle | Tripulação mais barata, resistente | Menor capital inicial |
| **Bounty Hunter** | Stormwall | Domínio do combate, posição na facção | Preços ruins, desconfiança |

## Início Rápido

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## Sistemas

**Economia** — Preços determinados pela escassez em 20 portos, 18 produtos, 43 rotas. Penalidades por "dumping" reduzem os lucros. Modificadores regionais de demanda significam que cada porto tem uma identidade clara de importação/exportação.

**Viagens** — Viagens de vários dias que incluem condições climáticas, encontros com piratas e inspeções. As provisões são consumidas diariamente. O casco sofre danos. As zonas de perigo sazonais alteram as rotas seguras.

**Contratos** — Seis famílias protegidas por confiança e reputação. Inclui aquisição, alívio de escassez, produtos de luxo discretos, transporte de retorno, rotas e comissões de facções. Prazos reais, consequências reais.

**Reputação** — Quatro eixos: reputação regional, confiança comercial, atenção das autoridades e conexões com o submundo. Diferentes capitães operam com diferentes sistemas morais.

**Combate** — Combate pessoal (triângulo de posturas) com 7 armas de combate corpo a corpo, 7 armas de longo alcance e estilos de luta regionais. Combate naval com abordagens e canhões.

**Facções Piratas** — Crimson Tide, Iron Wolves, Deep Reef Brotherhood, Monsoon Syndicate. Cada uma com seu território, capitães e atitude em relação a você.

**Infraestrutura** — Armazéns, escritórios de corretores, licenças. Manutenção real. Cada um altera o tempo, a escala ou o acesso ao comércio.

**Finanças** — Seguros e crédito. Alavancagem com riscos.

**Companheiros** — Cinco funções de oficiais com personalidade, moral e gatilhos de saída.

**Carreira** — 27 marcos. 13 tags de perfil. Quatro caminhos de vitória: Casa Comercial Legal, Rede Sombria, Alcance Oceânico, Império Comercial.

## Caminhos de Vitória

- **Casa Comercial Legal** — Alta confiança, contratos premium, reputação impecável, amplitude da infraestrutura.
- **Rede Sombria** — Margens de luxo sob escrutínio, gerenciamento de riscos, operações resilientes.
- **Alcance Oceânico** — Acesso às Índias Orientais, infraestrutura distante, domínio das rotas.
- **Império Comercial** — Infraestrutura em todos os lugares, receita diversificada, alavancagem financeira.

## Como este pacote funciona

Este pacote baixa o binário pré-compilado do Portlight para sua plataforma do GitHub Releases e o armazena localmente. Não é necessária a instalação do Python.

| Preocupações | Detalhes |
|---------|--------|
| **Network** | Apenas HTTPS para o CDN `github.com` |
| **Filesystem** | Apenas cache do usuário (`~/.cache/mcptoolshop/portlight/`) |
| **Verification** | Checksum SHA256 em cada download |
| **Telemetry** | Nenhum |
| **Platforms** | Windows (x64), macOS (x64/arm64), Linux (x64) |

## Segurança

- Baixa binários exclusivamente de `github.com` via HTTPS
- Verificação de checksum SHA256 em cada download
- Escreve apenas no diretório de cache do usuário — nunca acessa diretórios do sistema
- Sem telemetria, sem segredos, sem credenciais armazenadas
- Sem acesso à rede além do download inicial do binário

Consulte [SECURITY.md](SECURITY.md) para a política completa.

## Licença

MIT

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
