---
title: For Beginners
description: New to venvkit? Start here for a gentle introduction to Python environment diagnostics.
sidebar:
  order: 99
---

If you are new to Python virtual environments or have never diagnosed environment issues before, this page walks you through the basics and shows how venvkit fits into your workflow.

## What is this tool?

venvkit is a diagnostic toolkit that scans your computer for Python environments and checks whether they are healthy. It finds problems like missing libraries, broken SSL, architecture mismatches, and path contamination -- issues that cause mysterious failures when you try to train an ML model or run a Python script.

Think of it as a health checkup for your Python installations. You run one command, and venvkit tells you which environments are healthy, which have warnings, and which are broken, along with specific instructions to fix each issue.

venvkit is read-only. It never modifies your Python installations or environments.

## Who is this for?

venvkit is built for:

- **ML practitioners on Windows** who use PyTorch, TensorFlow, or other GPU-accelerated libraries and run into DLL load failures or CUDA issues.
- **Python developers** managing multiple virtual environments across projects who want to audit their environment health in one pass.
- **Teams** that need a CI gate to catch broken environments before they cause pipeline failures.
- **Beginners** who are not sure why `import torch` fails even though they installed it, or why pip refuses to connect to PyPI.

You do not need to be a Python expert to use venvkit. The diagnostic output explains each problem in plain English with step-by-step fix instructions.

## Prerequisites

Before using venvkit you need:

- **Node.js 18 or later** -- venvkit is a Node.js tool. Download from [nodejs.org](https://nodejs.org/).
- **Python 3.8 or later** -- at least one Python interpreter installed on your system (the environments you want to scan).
- **Basic terminal skills** -- you should be comfortable running commands in a terminal (Command Prompt, PowerShell, or bash).
- **Windows** is the primary target. Linux and macOS work for core checks, but DLL and ABI diagnostics are Windows-specific.

## Your first 5 minutes

Follow these steps to go from zero to your first environment health report.

**Step 1: Install venvkit**

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit
cd venvkit
npm install
npm run build
```

Or install from npm if you prefer:

```bash
npm install @mcptoolshop/venvkit
```

**Step 2: Run your first scan**

Point venvkit at a directory that contains Python environments:

```bash
node dist/map_cli.js --root C:\my-project --httpsProbe
```

Replace `C:\my-project` with the path to your project. The `--httpsProbe` flag also checks whether each environment can make HTTPS connections (needed for pip installs).

**Step 3: View the results**

Open the interactive HTML report:

```bash
start .venvkit/venv-map.html
```

The report shows every discovered environment with its health score (0-100), status (`good`, `warn`, or `bad`), and a list of findings. Each finding includes a code like `DLL_LOAD_FAIL`, an explanation of the problem, and step-by-step fix instructions.

**Step 4: Check the output files**

The scan creates several files in `.venvkit/`:

| File | What it tells you |
|------|-------------------|
| `venv-map.html` | Interactive viewer -- open in a browser to explore the full map |
| `venv-map.json` | Machine-readable graph of environments and their relationships |
| `reports.json` | Raw health reports for every scanned environment |
| `insights.json` | Actionable recommendations ranked by severity |

**Step 5: Fix any issues**

Look at the findings for each environment. Start with anything marked `bad` -- those are critical problems. The fix instructions tell you exactly what to do. For example, if you see `DLL_LOAD_FAIL`, you need to install the correct CUDA toolkit or reinstall the failing package.

## Common mistakes

Here are the most frequent issues beginners encounter and how to resolve them:

**1. Scanning the wrong directory.** If venvkit reports zero environments, you may be scanning a directory that does not contain any `.venv`, `venv`, or `env` folders. Use `--root` to point at the parent directory of your Python projects.

**2. Forgetting to build before running.** If you cloned from source, you must run `npm run build` before using the CLI. The entry point is `dist/map_cli.js`, not the TypeScript source files.

**3. Ignoring DLL_LOAD_FAIL warnings on Windows.** This is the single most common failure in Windows ML workflows. It means a native library (usually CUDA or cuDNN) is not on the system PATH. Install the correct CUDA toolkit version for your GPU driver, and make sure its `bin` directory is on your PATH.

**4. Not using --httpsProbe.** Without this flag, venvkit skips SSL certificate verification. If your environments have certificate issues (common behind corporate proxies), you will not know until pip fails during a package install.

**5. Running as administrator unnecessarily.** venvkit is read-only and does not need elevated privileges. Running as admin can cause path resolution to behave differently than your normal development environment.

## Next steps

- **[Getting Started](/venvkit/handbook/getting-started/)** -- Detailed installation options (npm, source)
- **[Usage](/venvkit/handbook/usage/)** -- CLI options and workflow recipes for CI gates, multi-directory scans, and task tracking
- **[Finding Codes](/venvkit/handbook/finding-codes/)** -- Full reference of all diagnostic codes and what they mean
- **[Reference](/venvkit/handbook/reference/)** -- Programmatic API for integrating venvkit into your own tools

## Glossary

| Term | Definition |
|------|-----------|
| **venv** | A Python virtual environment -- an isolated copy of Python with its own installed packages, kept separate from your system Python. Created with `python -m venv`. |
| **base interpreter** | The system-wide or user-installed Python that a venv was created from. Shown as a `base` node in the ecosystem map. |
| **finding** | A single diagnostic result from venvkit, identified by a code (e.g. `SSL_BROKEN`) with a severity, explanation, and fix steps. |
| **health score** | A number from 0 to 100 assigned to each environment. 85+ is `good`, 60-84 is `warn`, below 60 is `bad`. Critical failures (like a missing interpreter) clamp the score to low values regardless of other checks. |
| **ecosystem map** | The graph output from venvkit showing how environments, base interpreters, and tasks relate to each other. Available as JSON, Mermaid diagrams, and an interactive HTML viewer. |
| **DLL** | Dynamic Link Library -- a shared library on Windows. Native Python packages like PyTorch ship compiled DLLs that must be loadable at runtime. |
| **ABI** | Application Binary Interface -- the low-level contract between compiled code and the runtime. An ABI mismatch means a compiled extension was built for a different platform or Python version. |
| **PYTHONPATH** | An environment variable that adds directories to Python's module search path. When set inside a venv, it can break isolation by importing packages from outside the venv. |
| **user site-packages** | A per-user directory where `pip install --user` puts packages. If enabled inside a venv, these packages leak into the venv's import path. |
| **JSONL** | JSON Lines -- a file format where each line is a valid JSON object. venvkit uses JSONL for run logs so entries can be appended without rewriting the file. |
| **task clustering** | venvkit groups repeated task executions by their signature (name, command, requirements) to surface patterns like flaky tests or environment-dependent failures. |
| **flaky task** | A task that inconsistently passes and fails across runs. venvkit flags tasks with a success rate between 20% and 95% as flaky. |
