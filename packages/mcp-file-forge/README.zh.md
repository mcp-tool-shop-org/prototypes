<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

## 概要介绍

MCP File Forge 是一个 [模型上下文协议](https://modelcontextprotocol.io) (MCP) 服务器，它为人工智能代理提供在本地文件系统中进行隔离且受策略控制的访问。它包含 **17 个工具**，分为五个类别：

| 类别。 | 工具。 | 描述。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | 读取文件和目录列表。 |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | 创建、修改、复制、移动和删除。 |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | 通过文件名模式或内容查找文件。 |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | 检查尺寸、时间戳和是否存在。 |
| **Scaffolding** | `scaffold_project`, `list_templates` | 从模板创建项目，并支持变量替换。 |

主要特性：

- **沙盒模式：** 运行仅限于明确允许的目录。
- **只读模式：** 通过修改一个环境变量来禁用所有写入工具。
- **符号链接安全：** 默认情况下禁用符号链接跟踪，以防止沙盒逃逸。
- **以Windows为优先：** 专为Windows路径和约定设计，可在所有平台上使用。
- **模板引擎：** 支持 `{{var}}` / `${var}` 变量替换，以及在路径级别进行 `__var__` 重命名。

---

## 安装

```bash
npm install -g @mcptoolshop/file-forge
```

或者，可以直接使用 npx 命令运行。

```bash
npx @mcptoolshop/file-forge
```

---

## Claude 桌面配置

请将以下内容添加到您的 `claude_desktop_config.json` 文件中：

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

如果您是全局安装的，可以直接指定可执行文件的路径：

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

## 工具参考

### 阅读

| 工具。 | 描述。 | 关键参数。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `read_file` | 读取文件内容。 | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | 列出目录条目。 | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | 批量读取多个文件。 | `paths`, `encoding?`, `fail_on_error?` |

### 写作

| 工具。 | 描述。 | 关键参数。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `write_file` | 写入或覆盖文件。 | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | 创建目录。 | `path`, `recursive?` |
| `copy_file` | 复制文件或目录。 | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | 移动或重命名。 | `source`, `destination`, `overwrite?` |
| `delete_file` | 删除文件或目录。 | `path`, `recursive?`, `force?` |

### 搜索

| 工具。 | 描述。 | 关键参数。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `glob_search` | 通过通配符模式查找文件。 | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | 使用正则表达式搜索文件内容。 | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | 精确文本搜索（不支持正则表达式）。 | `text`, `path?`, `file_pattern?`, `max_results?` |

### 元数据

| 工具。 | 描述。 | 关键参数。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `file_stat` | 文件/目录统计信息。 | `path` |
| `file_exists` | 检查是否存在以及类型。 | `path`: 路径
`type?`: 类型 (可选，默认为 "any"，可选择 "file" 或 "directory") |
| `get_disk_usage` | 目录大小明细。 | `path`, `max_depth?` |
| `compare_files` | 比较两条路径。 | `path1`, `path2` |

### 脚手架

| 工具。 | 描述。 | 关键参数。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `scaffold_project` | 从模板创建项目。 | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | 列出可用的模板。 | `category?` |

完整的参数说明、示例和错误代码请参考 [HANDBOOK.md] 文件。

---

## 环境变量

| 变量。 | 描述。 | 默认设置。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | 允许访问的根目录列表，目录之间用逗号分隔。 | `.` (当前工作目录) |
| `MCP_FILE_FORGE_DENIED_PATHS` | 用逗号分隔的、用于排除的文件路径模式。 | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | 禁用所有写入操作。 | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | 文件最大尺寸（以字节为单位）。 | `104857600` (100 MB) |
| `MCP_FILE_FORGE_MAX_DEPTH` | 最大递归深度 | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | 允许跟踪沙箱外部的符号链接 | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | 逗号分隔的模板目录 | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | 日志详细程度（`error`、`warn`、`info`、`debug`） | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | 日志文件路径（除了标准错误输出） | _none_ |

---

## 配置文件

在您的工作目录或其上级目录中创建 `mcp-file-forge.json`（或 `.mcp-file-forge.json`）文件：

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

配置优先级（优先级最高的生效）：

1. 环境变量
2. 配置文件
3. 内置默认值

---

## 安全性

MCP File Forge 强制执行多层保护，以防止 AI 代理超出其指定的工作空间：

- **路径沙箱**：每个路径都会解析为绝对路径，并在任何 I/O 操作之前，与 `allowed_paths` 列表进行检查。
- **禁止路径**：glob 模式，即使在允许的目录中也会被阻止（例如 `**/secrets/**`）。
- **符号链接保护**：默认情况下，不跟踪符号链接；如果符号链接的目标位于沙箱外部，则操作将被拒绝。
- **路径遍历检测**：包含 `..` 序列，用于尝试逃离沙箱的路径将被拒绝。
- **大小限制**：大于 `max_file_size` 的文件将被拒绝，以防止内存耗尽。
- **深度限制**：递归操作的深度限制为 `max_depth` 层级。
- **只读模式**：设置 `MCP_FILE_FORGE_READ_ONLY=true` 以禁用 `write_file`、`create_directory`、`copy_file`、`move_file`、`delete_file` 和 `scaffold_project`。
- **空字节拒绝**：包含 `\0` 的路径将被拒绝。
- **Windows 路径长度限制**：超过 32,767 个字符的路径将被拒绝。

---

## 文档

| 文档 | 描述 |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | 深入了解：安全模型、工具参考、模板、架构、常见问题解答 |
| [CHANGELOG.md](CHANGELOG.md) | 版本历史（采用 Changelog 格式） |
| [docs/PLANNING.md](docs/PLANNING.md) | 内部规划和研究笔记 |

---

## 开发

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

## 许可证

[MIT](LICENSE)

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
