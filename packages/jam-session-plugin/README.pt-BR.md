<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Um pianista virtual com inteligência artificial, com um catálogo de 100 músicas, ensino estruturado e sessões de improvisação. Toca através dos seus alto-falantes – nenhum software externo é necessário.

Este plugin envolve o servidor MCP do [AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session), adicionando comandos de barra, personalidades de agentes e fluxos de trabalho estruturados para aprendizado e improvisação.

## Instalação

```bash
claude plugin add ai-jam-session
```

O servidor MCP (`@mcptoolshop/ai-jam-session`) é baixado automaticamente via npx. Requer Node.js 18 ou superior.

## O que você recebe

### Habilidades (comandos de barra)

| Comando | Descrição |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | Inicia uma sessão de ensino estruturada. |
| `/ai-jam-session:practice <song> [level]` | Obtém um plano de prática personalizado. |
| `/ai-jam-session:explore [query]` | Navega pelo catálogo de 100 músicas por gênero, dificuldade ou palavra-chave. |
| `/ai-jam-session:jam <song or genre>` | Inicia uma sessão de improvisação — o Claude cria sua própria interpretação. |

### Agentes

| Agent | Descrição |
| ------- | ------------- |
| `piano-teacher` | Professor paciente e pedagógico que se adapta ao nível do aluno. |
| `jam-musician` | Músico de banda de improvisação descontraído — prioriza o ritmo e incentiva a experimentação. |

### Ferramentas MCP (15)

Navegue, toque, ensine, improvise e gerencie músicas. As habilidades do plugin orquestram automaticamente essas ferramentas, mas elas também estão disponíveis para uso direto.

## Uso

Use comandos de barra:

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

Ou simplesmente converse naturalmente — os agentes são ativados com base no contexto:

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## Catálogo de Músicas

100 músicas inclusas em 10 gêneros (clássica, jazz, pop, blues, rock, R&B, latina, trilha sonora, ragtime, new-age) em níveis iniciante, intermediário e avançado.

## Requisitos

- Node.js 18 ou superior
- Alto-falantes (o piano toca através do áudio do seu sistema)

## Links

- Servidor MCP: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- Código-fonte: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## Licença

MIT
