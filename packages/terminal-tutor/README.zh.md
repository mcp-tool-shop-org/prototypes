<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/terminal-tutor/readme.png" width="400" alt="Terminal Tutor" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/terminal-tutor/actions"><img src="https://github.com/mcp-tool-shop-org/terminal-tutor/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/terminal-tutor/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

通过实践学习终端技能——在终端中，即实际工作发生的场所。

Terminal Tutor 是一种情境式辅导系统。它创建了一个安全的练习环境，提供真实的任务，观察您输入的命令，并告诉您发生了什么以及原因。没有沙箱，没有测验，没有视频，只有您的终端中的一位实时导师。

## 快速开始

```bash
npx @mcptoolshop/terminal-tutor doctor    # Check what's ready
npx @mcptoolshop/terminal-tutor tracks    # See skill tracks
npx @mcptoolshop/terminal-tutor next      # Get your first lesson
npx @mcptoolshop/terminal-tutor start files-and-navigation
```

## 工作原理

1. **您选择一个课程。** 每个课程都有一个明确的目标，例如“查找代码库中所有分散的 TODO 注释”，而不是仅仅“学习 grep 命令”。

2. **导师创建一个练习环境。** 包含真实的 文件、目录和 Git 仓库。您在安全的环境中进行操作，而不是在您的实际项目中。

3. **您运行真实的命令。** 不是模拟的，也不是在沙箱中运行的。 而是实际的 `grep`、`git`、`sed`、`pip` 命令，具体取决于课程的需求。

4. **导师评估结果。** 是否出现了正确的文件？输出是否包含预期的内容？它会检查发生了什么，而不是您输入的具体命令。

5. **如果您遇到问题，它会提供帮助。** 提示会从简单的建议开始（例如“尝试递归搜索”），然后逐渐变得更具体（例如“尝试 `grep -r 'TODO' src/`”）。 如果您犯了常见的错误，它会诊断具体的错误原因。

6. **您的进度会保存。** 稍后回来，您可以从上次中断的地方继续。

## 技能路径

| 路径 | 课程 | 运行环境 | 您将学习的内容 |
|-------|---------|---------|-------------------|
| **Shell Fundamentals** | 3 | shell | ls, cat, grep, find, sed, awk, diff, 管道 |
| **Shell Triage** | 1 | shell | ps, 后台任务, 日志分析 |
| **Git Survival** | 1 | shell | init, commit, 分支, 切换 |
| **Python Debugging** | 2 | venv | pytest, 堆栈跟踪, pip, 导入, 依赖 |
| **Service Debugging** | 1 | docker | 日志, 进程, 配置, 接口 |

## 运行环境

Terminal Tutor 使用三种运行环境，每种环境都有其特定的用途：

- **shell**：您的系统 shell。用于文件导航、文本处理和 Git。 启动速度快。
- **venv**：一个真实的 Python 虚拟环境。用于 pip、pytest 和导入调试。 创建一个包含实际软件包的虚拟环境。
- **docker**：一个容器。用于服务诊断、进程检查以及需要完全隔离的任何操作。 默认情况下禁用网络。

运行 `terminal-tutor doctor` 命令，以查看您的系统上可用的运行环境。

## 命令行参考

```
terminal-tutor list                    Show available lessons
terminal-tutor start <lesson-id>       Start or resume a lesson
terminal-tutor tracks                  Show skill tracks and progress
terminal-tutor track <track-id>        Show detailed track progress
terminal-tutor next                    Suggest next lesson
terminal-tutor mastery <lesson-id>     Show fluency signal for completed lesson
terminal-tutor progress                Show all lesson progress
terminal-tutor doctor                  Check system readiness
terminal-tutor runtimes                Show runtime availability
terminal-tutor reset <lesson-id>       Reset a lesson
terminal-tutor help                    Show help
```

## Claude Code 用户

Terminal Tutor 的设计是为了与 Claude Code 作为对话层进行配合。 Claude 可以：
- 启动课程并自然地呈现步骤
- 通过导师引擎运行命令并评估结果
- 在上下文中解释错误，而不仅仅是提供预定义的提示
- 适应意外的问题或方法

命令行输出结构化的 JSON 数据，这使得 Claude 能够轻松地解析课程状态、评估结果并指导学习者。

## 安全性

Terminal Tutor 仅在**本地**运行，不收集任何遥测数据，不进行任何网络调用，也不处理任何凭据。

- **访问的数据：** 临时工作目录（操作系统临时目录），课程进度（`~/.terminal-tutor/progress.json`）
- **未访问的数据：** 您的项目、主目录、系统配置、浏览器数据、凭据
- **不收集或发送任何遥测数据**
- **工作区隔离：** 练习文件创建在隔离的临时目录中。 `workspace_only` 安全标志可防止命令逃离练习区域。 Docker 课程默认禁用网络。
- **权限：** 仅具有对操作系统临时目录和 `~/.terminal-tutor/` 目录的读/写权限。 不需要或请求任何提升的权限。

请参阅 [SECURITY.md](SECURITY.md)，了解漏洞报告政策。

## 编写课程

请参考 [AUTHORING.md](AUTHORING.md) 文件，了解课程编写规范。主要规则如下：

- 每个课程对应一个 YAML 文件。
- 基于结果的检查（验证发生了什么，而不是执行了哪个命令）。
- 从提示到解决方案的逐步提示。
- 使用满足课程需求的尽可能轻量级的运行时环境。
- 每个课程都必须包含一个 `flavor`，即一个场景描述，用于设置背景。

## 许可证

MIT

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
