<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> RPG de linha de comando para comerciantes espaciais. Instalação via npx sem pré-requisitos.

```bash
npx @mcptoolshop/star-freight
```

Ou instale globalmente:

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

Não requer Python, pip ou ferramentas de compilação. Binários pré-compilados são baixados, verificados com SHA256 e armazenados em cache localmente.

---

## O jogo

Você era um piloto militar. Depois, tornou-se um escândalo. Agora, você é um capitão com uma nave velha, sem reputação e em um sistema estelar que já estava em movimento quando você chegou.

**Star Freight** é um RPG tático de comércio baseado em texto, sobre o transporte de cargas em um sistema estelar politicamente fragmentado. Cinco civilizações. Uma economia. Quatro verdades que não permitem que você viva a mesma vida duas vezes.

Você atraca em estações onde a cultura muda a forma como você negocia. Você escolhe rotas onde o terreno muda a forma como você luta. Você contrata tripulação que muda o que você pode fazer, o que você pode acessar e o que você deve. Você aceita contratos que parecem simples até que a papelada se torne um problema, a escassez altera o preço ou a carga se revela ser uma evidência.

## Por que isso parece diferente

**A tripulação é lei vinculante.** Thal não é apenas um bônus de +10% no reparo. Thal é *o motivo* de você poder atracar nas estações de Keth, *o motivo* de sua nave ter uma capacidade de reparo de emergência e *o motivo* de você ter notado que a carga médica não correspondia à estação do ano. Perder Thal significa perder a capacidade de três sistemas de uma vez.

**O combate é um evento de campanha.** A vitória gera créditos de sucata e "calor" de facção. A retirada custa carga descartada e uma reputação de alguém que foge. A derrota significa carga apreendida, tripulação ferida e uma nave que cambaleia até a estação mais próxima, com um preço alto.

**A cultura é lógica social.** Os Keth não têm apenas preços diferentes. Eles têm um calendário biológico sazonal que muda o que significa fazer presentes e quando oferecer um negócio é um insulto. Os Veshan desafiam – e recusar é pior do que perder.

**A investigação emerge da vida.** Você percebe que a carga médica não corresponde à estação do ano porque você a transportou. A conspiração não se anuncia. Você se depara com ela ao fazer o trabalho.

## O mundo

Cinco civilizações compartilham um sistema estelar chamado Threshold.

**O Compacto Terrano** – Governo humano burocrático. Eles te humilharam. Voltar significa obter permissões, paciência e engolir o orgulho.

**A Comunhão Keth** – Coletivo de artrópodes em um calendário biológico. As melhores margens do sistema se você entender as estações. O colapso de reputação mais rápido se você não entender.

**Os Principados Veshan** – Casas feudais reptilianas obcecadas com honra e dívida. O Livro de Dívidas não é apenas um detalhe. É alavancagem.

**O Deriva Orryn** – Civilização de corretores móveis. Eles negociam com todos, sabem de tudo e cobram por ambos.

**A Fronteira Sombria** – Facções piratas, recuperadores de tecnologia ancestral e pessoas que o Compacto preferiria esquecer. Sem lei. Sem costumes. Sem reembolsos.

## Três tipos de capitão

**Capitão de serviço.** Disciplina de comboio, acesso baseado na confiança, consequências públicas. Você mantém as pessoas alimentadas e fica preso à legitimidade.

**Corredor cinzento.** Alavancagem de documentos, exploração de horários, risco institucional. Você ganha dinheiro permanecendo difícil de decifrar.

**Capitão de honra.** Confronto direto, política interna, volatilidade da reputação. Você resolve problemas cara a cara.

Esses não são classes. São o que suas escolhas te transformaram.

## Como este pacote funciona

Este pacote npm usa [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) para:

1. Baixe o arquivo binário pré-compilado do Star Freight em [GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases).
2. Verifique os valores de checksum SHA256.
3. Armazene em cache localmente (`~/.cache/mcptoolshop/star-freight/`).
4. Execute com seus argumentos.

### Gerenciamento de cache

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### Suporte a plataformas

| Plataforma | Arquivo binário |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## Segurança

**Modelo de ameaças:** Este pacote baixa arquivos binários pré-compilados do GitHub Releases via HTTPS e verifica os valores de checksum SHA256 antes da execução. Ele NÃO coleta dados de telemetria, armazena credenciais, faz solicitações de rede além do domínio `github.com`, nem escreve fora do diretório de cache do usuário (`~/.cache/mcptoolshop/star-freight/`). O arquivo binário executado funciona com as permissões do usuário que o invocou e grava os arquivos de salvamento do jogo apenas no diretório de trabalho atual. Consulte [SECURITY.md](SECURITY.md) para a política completa.

## Repositório de código-fonte

O código-fonte do jogo está localizado em [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight).

## Licença

MIT

---

*Star Freight é um jogo sobre navegar em sistemas de poder sem jamais pertencer completamente a eles.*

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
