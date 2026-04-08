<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## Através de uma visão geral

MCP File Forge é um servidor [Model Context Protocol](https://modelcontextprotocol.io) (MCP) que oferece a agentes de IA acesso controlado por políticas ao sistema de arquivos local, em um ambiente isolado. Ele oferece **17 ferramentas** em cinco categorias:

| Categoria | Ferramentas | Descrição |
| ---------- | ------- | ------------- |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | Leitura de arquivos e listagem de diretórios |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | Criação, modificação, cópia, movimentação e exclusão |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | Localização de arquivos por padrão de nome ou conteúdo |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | Inspeção de tamanho, carimbos de data/hora e existência |
| **Scaffolding** | `scaffold_project`, `list_templates` | Criação de projetos a partir de modelos com substituição de variáveis |

Propriedades principais:

- **Ambiente isolado (sandboxed)**: as operações são restritas a diretórios explicitamente permitidos.
- **Modo somente leitura**: basta alterar uma variável de ambiente para desativar todas as ferramentas de escrita.
- **Compatível com links simbólicos**: o acompanhamento de links simbólicos está desativado por padrão para evitar escapes do ambiente isolado.
- **Prioridade para Windows**: projetado para caminhos e convenções do Windows, mas funciona em todos os sistemas.
- **Motor de templates**: substituição de variáveis usando `{{var}}` / `${var}`, além de renomeação em nível de caminho com `__var__`.

---

## Instalação

```bash
npm install -g @mcptoolshop/file-forge
```

Ou execute diretamente com npx:

```bash
npx @mcptoolshop/file-forge
```

---

## Configuração do Claude Desktop

Adicione o seguinte ao seu arquivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

Se você instalou globalmente, pode apontar diretamente para o executável:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## Referência das Ferramentas

### Leitura

| Ferramenta | Descrição | Parâmetros Principais |
| ------ | ------------- | ---------------- |
| `read_file` | Leitura do conteúdo de um arquivo | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | Listagem de entradas de um diretório | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | Leitura em lote de vários arquivos | `paths`, `encoding?`, `fail_on_error?` |

### Escrita

| Ferramenta | Descrição | Parâmetros Principais |
| ------ | ------------- | ---------------- |
| `write_file` | Escrita ou sobrescrita de um arquivo | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | Criação de um diretório | `path`, `recursive?` |
| `copy_file` | Cópia de um arquivo ou diretório | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | Movimentação ou renomeação | `source`, `destination`, `overwrite?` |
| `delete_file` | Exclusão de um arquivo ou diretório | `path`, `recursive?`, `force?` |

### Pesquisa

| Ferramenta | Descrição | Parâmetros Principais |
| ------ | ------------- | ---------------- |
| `glob_search` | Localização de arquivos por padrão glob | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | Pesquisa de conteúdo de arquivos com expressão regular | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | Pesquisa de texto literal (sem expressão regular) | `text`, `path?`, `file_pattern?`, `max_results?` |

### Metadados

| Ferramenta | Descrição | Parâmetros Principais |
| ------ | ------------- | ---------------- |
| `file_stat` | Estatísticas de arquivo/diretório | `path` |
| `file_exists` | Verificação de existência e tipo | `path`, `type?` (`file` / `directory` / `any`) |
| `get_disk_usage` | Distribuição do tamanho de um diretório | `path`, `max_depth?` |
| `compare_files` | Comparação de dois caminhos | `path1`, `path2` |

### Geração de Código (Scaffolding)

| Ferramenta | Descrição | Parâmetros Principais |
| ------ | ------------- | ---------------- |
| `scaffold_project` | Criação de projeto a partir de um modelo | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | Listagem de modelos disponíveis | `category?` |

A documentação completa dos parâmetros, exemplos e códigos de erro estão no arquivo [HANDBOOK.md](HANDBOOK.md).

---

## Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
| ---------- | ------------- | --------- |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | Lista separada por vírgulas de diretórios raiz permitidos | `.` (diretório atual) |
| `MCP_FILE_FORGE_DENIED_PATHS` | Lista separada por vírgulas de padrões de caminho negados | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | Desativa todas as operações de escrita | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | Tamanho máximo do arquivo em bytes | `104857600` (100 MB) |
| `MCP_FILE_FORGE_MAX_DEPTH` | Profundidade máxima de recursão | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | Permitir o acompanhamento de links simbólicos fora do ambiente isolado | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | Diretórios de modelos separados por vírgula | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | Nível de detalhe do log (`error`, `warn`, `info`, `debug`) | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | Caminho para um arquivo de log (além do stderr) | _nenhum_ |

---

## Arquivo de Configuração

Crie um arquivo `mcp-file-forge.json` (ou `.mcp-file-forge.json`) no diretório de trabalho ou em um diretório acima dele:

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

Prioridade da configuração (a configuração com maior prioridade é utilizada):

1. Variáveis de ambiente
2. Arquivo de configuração
3. Valores padrão internos

---

## Segurança

O MCP File Forge implementa várias camadas de proteção para impedir que agentes de IA acessem áreas fora do espaço de trabalho designado:

- **Isolamento de caminhos:** todos os caminhos são resolvidos para um caminho absoluto e verificados em relação à lista `allowed_paths` antes de qualquer operação de entrada/saída.
- **Caminhos bloqueados:** padrões glob que são bloqueados, mesmo dentro dos diretórios permitidos (por exemplo, `**/secrets/**`).
- **Proteção de links simbólicos:** links simbólicos não são seguidos por padrão; se o destino de um link simbólico estiver fora do ambiente isolado, a operação é negada.
- **Detecção de travessia de caminhos:** sequências `..` que escapariam do ambiente isolado são rejeitadas.
- **Limites de tamanho:** arquivos maiores que `max_file_size` são rejeitados para evitar o esgotamento da memória.
- **Limites de profundidade:** operações recursivas são limitadas a `max_depth` níveis.
- **Modo somente leitura:** defina `MCP_FILE_FORGE_READ_ONLY=true` para desativar `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` e `scaffold_project`.
- **Rejeição de bytes nulos:** caminhos que contenham `\0` são rejeitados.
- **Proteção contra caminhos longos no Windows:** caminhos com mais de 32.767 caracteres são rejeitados.

---

## Documentação

| Documento | Descrição |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Análise aprofundada: modelo de segurança, referência de ferramentas, modelos, arquitetura, perguntas frequentes |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de lançamentos (formato Keep a Changelog) |
| [docs/PLANNING.md](docs/PLANNING.md) | Notas internas de planejamento e pesquisa |

---

## Desenvolvimento

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## Licença

[MIT](LICENSE)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
