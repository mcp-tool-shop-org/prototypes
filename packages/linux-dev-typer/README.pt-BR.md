<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/linux-dev-typer/readme.png" alt="Linux Dev Typer logo" width="400"></p>

# linux-dev-typer

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/LinuxDevTyper.Core"><img src="https://img.shields.io/nuget/v/LinuxDevTyper.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/linux-dev-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Prática de digitação de código para desenvolvedores — Avalonia UI, dificuldade adaptativa, rastreamento de tendências, detecção de fadiga.**

> Também disponível como um aplicativo nativo para Windows: [dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (WinUI 3, Microsoft Store)

---

## Por que o Linux Dev Typer?

- **Pratique código real, não texto.** Cada trecho é um padrão do mundo real em Python, Rust, JavaScript, C# ou Java — não "a raposa marrom rápida".
- **Dificuldade adaptativa.** Um sistema de classificação inspirado no Elo se ajusta ao seu nível de habilidade em cada linguagem, com proteção contra oscilações e detecção de zona de conforto.
- **Consciência das fraquezas.** Mapas de calor de erros por caractere e pares de confusão guiam a seleção de trechos para que você pratique o que realmente tem dificuldade.
- **Consciência da fadiga.** O sistema detecta a queda de desempenho e sugere pausas antes que maus hábitos se instalem.
- **Compatível com várias plataformas.** Construído com Avalonia UI — funciona no Linux, macOS e Windows a partir de uma única base de código.
- **Totalmente offline.** Sem telemetria, sem contas, sem chamadas de rede. Seus dados de digitação permanecem no seu dispositivo.
- **Extensível.** O núcleo do sistema é fornecido como um pacote NuGet independente com zero dependências de interface do usuário.

---

## Pacotes NuGet

| Pacote | Descrição |
| --------- | ------------- |
| [`LinuxDevTyper.Core`](https://www.nuget.org/packages/LinuxDevTyper.Core) | Motor de prática de digitação portátil com classificação Elo, dificuldade adaptativa, mapas de calor de fraquezas, detecção de fadiga, planejamento de sessões e micro-exercícios. Zero dependências de interface do usuário. |

O núcleo do sistema é uma biblioteca independente sem dependências de Avalonia ou da plataforma. Implemente `IStorage`, `IAudioService` e `IAssetProvider` para sua plataforma e você terá um treinador de digitação completo.

---

## Recursos

### Motor de Digitação Central
- Feedback por caractere: correto (verde-água), erros (vermelho + sublinhado), não digitado (esmaecido)
- Estatísticas em tempo real: WPM (palavras por minuto), precisão, contagem de erros, XP (experiência)
- Sistema de classificação por linguagem inspirado no Elo
- Progressão de nível com XP e aumento da dificuldade
- Cartões de conclusão com explicações dos trechos
- Configurável: tamanho da fonte, regras de espaçamento, normalização de quebras de linha

### Aprendizagem Adaptativa
- Rastreamento de erros por caractere com classificação de símbolos (10 categorias)
- Perfil de fraquezas entre sessões com seleção adaptativa de trechos
- Rastreamento de tendências: tendências de WPM e precisão em cada linguagem
- Dificuldade adaptativa com detecção de zona de conforto e proteção contra oscilações
- Insights pós-sessão: melhores resultados pessoais, marcos, sinais de tendência
- Detecção de fadiga com sugestões de pausas
- Modo hardcore: corrija cada erro antes de avançar

### Agência e Reflexão
- Seletor de intenção de prática: marque as sessões como Aquecimento, Exercício, Exploração ou Desafio
- Notas de sessão e navegador de sessões com pesquisa/filtro
- Detecção de retorno com saudações contextuais e envelhecimento automático da dificuldade
- Substitua as sugestões do sistema: ignore bloqueios de oscilação, tipos de insights e alertas de fadiga
- Compressão mensal do histórico para sessões além de 200
- Dicas de orientação: sugestões suaves antes da sessão com base no conteúdo
- Detecção de platô com incentivo
- Controles de personalização: congele o aprendizado, redefina as preferências

### Sistema de Conteúdo
- Pacotes de trechos do usuário: adicione arquivos JSON em `~/.config/linux-dev-typer/packs/`
- Perfis de prática: conjuntos de parâmetros nomeados que ajustam o comportamento do sistema
- Importe/exporte pacotes `.ldtpack` para compartilhar conteúdo
- Cole código, importe arquivo, importe pasta com detecção automática de linguagem
- IDs endereçados por conteúdo (deduplicação SHA-256)
- Pipeline canônico unificado: todo o conteúdo é inserido como um `CodeItem` com dificuldade baseada em métricas (D1–D7)

### Ensino e Comunidade
- Scaffolds: contexto de aprendizado progressivo com camadas mais profundas opcionais.
- Variações: implementações alternativas apresentadas como opções equivalentes.
- Notas da comunidade: dicas e perspectivas opcionais em pacotes `.ldtpack`.
- Dificuldade da comunidade: indicador visual para a dificuldade definida pela comunidade.
- Design anônimo: o conteúdo importado é indistinguível do conteúdo local.
- Todos os recursos de ensino e da comunidade são opcionais e apenas para exibição.

### Prática Estruturada
- 168 trechos de calibração em 5 idiomas (cobertura D1–D7).
- Planejador de sessões: mix de Alvo (50%) / Revisão (30%) / Desafio (20%).
- Detecção de fraquezas com janela de tempo decrescente.
- Transparência na seleção: "Por que este trecho" explica cada escolha.
- Mapa de calor de erros por caractere com pares de confusão.
- Trajetórias de fraquezas: capturas diárias rastreiam o progresso.

### Prática Guiada
- Modo Guiado: opção que permite que os sinais de fraqueza influenciem a seleção.
- Viés de Fraqueza: viés limitado por categoria (+0 a +3, nunca altera a faixa de dificuldade).
- Micro-exercícios: sessões de prática focadas em 5 itens, visando a principal fraqueza.
- Política de Sinalização: arquitetura de "feature flag" com interruptor principal e sub-flags para cada recurso.
- Higiene de armazenamento: o mapa de calor é limitado a 200 caracteres, os pares de confusão a 20 e as capturas a 90.
- Desativado por padrão: todo o comportamento anterior é preservado, a menos que seja explicitamente ativado.

### Áudio
- 5 temas de som de teclado (8 variações cada).
- 4 categorias de paisagens sonoras (15 faixas no total).
- Controles de volume e mudo por canal.

### Acessibilidade
- Experiência de usuário focada no teclado, com contornos de foco visíveis.
- Modo de baixo estímulo sensorial (reduz os volumes de áudio).
- Tema escuro de alto contraste.

---

## Início Rápido

**Requisitos:** [.NET SDK 8.x](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

---

## Executar Testes

```bash
dotnet test
```

817 testes que cobrem todos os módulos principais do motor.

---

## Estrutura do Projeto

| Path | Propósito |
| ------ | --------- |
| `src/LinuxDevTyper.Core` | Motor portátil: digitação, avaliação, tendências, dificuldade, perfis, comunidade, pedagogia, calibração, planejador, fraquezas, mapa de calor, modo guiado. |
| `src/LinuxDevTyper.Core.Tests` | Testes xUnit (817 testes). |
| `src/LinuxDevTyper.App` | Shell de desktop Avalonia: UI, serviços de plataforma, importação/exportação. |
| `assets/snippets` | Pacotes de trechos JSON integrados. |
| `assets/sounds` | Arquivos WAV (sons ambiente + efeitos sonoros de teclado). |
| `lib/meta-content-system` | Biblioteca de conteúdo compartilhada. |
| `docs/` | Documentação da arquitetura e do esquema, planos de fase, guias de extensão. |

---

## Persistência

Arquivo de estado: `~/.config/linux-dev-typer/state.json` (esquema v12).

Para redefinir: `rm -rf ~/.config/linux-dev-typer`

---

## Adicionando Seu Próprio Código

Existem três maneiras de praticar com seu próprio código:

### Opção 1: Colar Código (mais fácil)

1. Abra a barra lateral (clique no ícone de engrenagem).
2. Encontre a seção **Colar Código**.
3. Cole qualquer trecho de código na caixa de texto.
4. Clique em **Adicionar** — a linguagem é detectada automaticamente.
5. Seu código aparecerá imediatamente na sequência de trechos.

### Opção 2: Importar um Arquivo ou Pasta

1. Abra a barra lateral → encontre **Importar**.
2. Clique em **Importar Arquivo** para adicionar um único arquivo de origem, ou em **Importar Pasta** para analisar um projeto inteiro.
3. O aplicativo detecta automaticamente a linguagem pelas extensões dos arquivos (`.py`, `.rs`, `.js`, `.cs`, `.java`, `.sh`).
4. O código importado é desduplicado por hash de conteúdo — o mesmo código nunca é adicionado duas vezes.

### Opção 3: Criar um Pacote de Trechos (JSON)

Para conjuntos de trechos de prática selecionados:

1. Crie um arquivo JSON na sua pasta de pacotes:
```
~/.config/linux-dev-typer/packs/
```

2. Nomeie o arquivo com o nome da linguagem (por exemplo, `python.json`):
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "List comprehension",
"difficulty": 3,
"topics": ["lists", "comprehension"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "Dictionary comprehension",
"difficulty": 4,
"topics": ["dicts", "comprehension"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. Reinicie o aplicativo — seus trechos serão combinados com os trechos integrados e poderão ser ativados/desativados a partir da barra lateral.

**Dicas:**
- `id` deve ser único em todos os pacotes.
- `difficulty` varia de 1 (fácil) a 7 (difícil).
- `code` deve terminar com `\n`.
- Os pacotes do usuário podem ser ativados/desativados sem excluir o arquivo.

### Compartilhando Conteúdo

Exporte seus trechos personalizados como um pacote portátil `.ldtpack`:

1. Abra a barra lateral → clique em **Exportar**.
2. Compartilhe o arquivo `.ldtpack` com outras pessoas.
3. Elas podem importá-lo através da barra lateral → **Importar**.

Apenas o conteúdo criado pelo usuário é transferido — nunca o histórico de uso ou as configurações.

---

## Privacidade

O linux-dev-typer funciona totalmente offline. Nenhum dado é coletado, transmitido ou compartilhado.

## Licença

[MIT](LICENSE)
