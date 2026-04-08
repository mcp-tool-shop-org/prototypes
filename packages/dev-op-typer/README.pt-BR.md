<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Dev-Op-Typer

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Um aplicativo de prática de digitação focado em desenvolvedores para Windows — cada teste é com código real.**

> Também disponível para Linux/macOS: [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (Avalonia UI)

## Recursos

### Prática com Código Real
- Digite trechos de código reais em **Python, JavaScript, C#, Java, SQL e Bash**
- Rastreamento da precisão caractere por caractere com destaque de diferenças
- Correspondência exata de símbolos: `{ } [ ] ( ) < > ; : , . " ' \`
- Quebras de linha e indentação são importantes

### Aprendizado Adaptativo
- Seleção inteligente de trechos com base no seu nível de habilidade
- Sistema de classificação tipo Elo para cada linguagem
- Planejador de sessões: mistura de metas (50%) / revisão (30%) / desafio (20%)
- Mapa de calor de erros por caractere com trajetórias de fraquezas
- Modo Guiado: seleção opcional com foco em fraquezas e exercícios direcionados
- Escalonamento de dificuldade (D1–D7) com detecção da zona de conforto

### Estatísticas em Tempo Real
- WPM (palavras por minuto), precisão e contagem de erros em tempo real
- Conclusão da sessão com insights retrospectivos
- Rastreamento de tendências: WPM e precisão em cada linguagem
- Detecção de fadiga com sugestões de pausas
- Painel de pontos fracos com análise por caractere

### Ensino e Comunidade
- Dicas: sugestões contextuais progressivas com camadas de "Mais contexto"
- Demonstrações: implementações alternativas mostradas como opções equivalentes
- Sinais da comunidade: dicas e classificações de dificuldade (apenas para exibição)
- Notas de orientação de pacotes de conteúdo compartilhados
- Painel de camadas de habilidades para compreensão estrutural

### Sistema de Conteúdo
- 168+ trechos de calibração em 6 linguagens
- Pacotes de trechos do usuário: adicione arquivos JSON na pasta de pacotes
- Colar Código: cole qualquer código da área de transferência como conteúdo de prática
- Importar Arquivo/Pasta: indexe arquivos de origem com detecção automática da linguagem
- Exportar/Importar pacotes `.ldtpack` para compartilhamento de conteúdo
- IDs baseados em conteúdo (deduplicação SHA-256)

### Áudio
- Paisagens sonoras ambientais com vários temas
- Sons de teclado mecânico (5 temas, 8 variações cada)
- Controles de volume por canal (ambiente, teclado, interface)
- Mudo/Desmudo na barra de título

### Acessibilidade
- Navegação completa por teclado
- Suporte a tema de alto contraste
- Opção de movimento reduzido
- Propriedades de automação em todos os elementos interativos

### Persistência
- Perfil com XP, níveis e classificações por linguagem
- Configurações e seleção de linguagem salvas em todas as sessões
- Histórico de sessões (até 500 registros) com compressão mensal
- Configurações de prática: conjuntos de parâmetros nomeados para ajuste do sistema

## Instalação

### Microsoft Store (recomendado)
Em breve — aguardando certificação na loja.

### Construção a partir do código fonte

**Requisitos:**
- Windows 10 versão 1809+ ou Windows 11
- .NET 10.0 SDK
- Visual Studio 2022 (com workload do Windows App SDK) — ou CLI

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

Execute o executável construído:
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## Estrutura do Projeto

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## Atalhos de Teclado

| Key | Ação |
|-----| -------- |
| Tab / Shift+Tab | Navegar pelos controles |
| Enter | Iniciar um novo teste |
| Escape | Redefinir o teste atual |

## Adicionando Seu Próprio Código

Existem três maneiras de praticar com seu próprio código:

### Opção 1: Colar Código (mais fácil)

1. Abra o painel de **Configurações** (clique em ⚙ na barra de título)
2. Role para **Colar Código**
3. Cole qualquer trecho de código na caixa de texto
4. Clique em **Adicionar** — a linguagem é detectada automaticamente
5. Seu código aparecerá imediatamente na rotação de trechos

### Opção 2: Importar um Arquivo ou Pasta

1. Abra **Configurações** → role para baixo até **Importar**.
2. Clique em **Importar Arquivo** para adicionar um único arquivo de origem, ou em **Importar Pasta** para analisar um projeto inteiro.
3. O aplicativo detecta automaticamente a linguagem com base nas extensões dos arquivos (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`).
4. O código importado é desduplicado com base no hash do conteúdo — o mesmo código nunca é adicionado duas vezes.

### Opção 3: Criar um Pacote de Snippets (JSON)

Para conjuntos selecionados de exemplos de código:

1. Abra a pasta de snippets do usuário:
```
%LocalAppData%\DevOpTyper\UserSnippets\
```
(ou clique em **Abrir Pasta de Snippets** em Configurações).

2. Crie um arquivo JSON com o nome da linguagem (por exemplo, `python.json`):
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

3. Reinicie o aplicativo — seus snippets aparecerão junto com os snippets integrados.

**Dicas:**
- `id` deve ser único em todos os pacotes.
- `difficulty` varia de 1 (fácil) a 7 (difícil).
- `code` deve terminar com `\n`.
- Você pode organizar os pacotes em subdiretórios de um nível de profundidade.

### Compartilhando Conteúdo

Exporte seus snippets personalizados como um pacote portátil `.ldtpack`:

1. Abra **Configurações** → clique em **Exportar Pacote**.
2. Compartilhe o arquivo `.ldtpack` com outras pessoas.
3. Elas podem importá-lo através de **Configurações** → **Importar Pacote**.

Apenas o conteúdo criado pelo usuário é transferido — nunca o histórico de exercícios ou as configurações.

## Privacidade

O Dev-Op-Typer funciona totalmente offline. Nenhum dado é coletado, transmitido ou compartilhado. Consulte [PRIVACY.md](PRIVACY.md).

## Licença

[MIT](LICENSE)
