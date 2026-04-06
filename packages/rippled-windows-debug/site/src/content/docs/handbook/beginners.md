---
title: Beginners
description: New to rippled or C++ debugging on Windows? Start here.
sidebar:
  order: 99
---

A gentle introduction to what this toolkit does, why it exists, and how to use it -- even if you have never debugged a C++ build on Windows before.

## What is this tool?

rippled-windows-debug is a Windows debugging toolkit for [rippled](https://github.com/XRPLF/rippled), the reference implementation of the XRP Ledger protocol. rippled is a large C++ codebase, and compiling it on Windows is notoriously resource-intensive.

This toolkit solves two problems:

1. **Build crashes** -- parallel compilation can exhaust all system memory, causing silent failures or system freezes. The Build Governor prevents this by throttling compiler processes before memory runs out.
2. **Misleading error codes** -- when a crash does happen, Windows reports `STATUS_STACK_BUFFER_OVERRUN (0xC0000409)` instead of the real cause. The crash handlers reveal the actual exception (often `std::bad_alloc`).

The toolkit is a collection of single-header C++ files and a .NET-based build governor. You do not need to modify rippled's build system to use most of it.

## Who is it for?

- **rippled contributors** building the node software on Windows
- **XRPL developers** who need to debug validator crashes
- **C++ developers** dealing with OOM (out-of-memory) build failures on Windows
- **Anyone** who has seen `cl.exe exited with code 1` with no explanation

You do not need to be an expert in Windows internals. The toolkit is designed to work with minimal configuration.

## Key concepts

### Commit charge vs free RAM

The Build Governor monitors **commit charge**, not free RAM. Commit charge is the total memory the operating system has promised to all processes. When commit charge reaches the system limit, new allocations fail immediately -- even if there appears to be free RAM (because that free RAM is being used for file cache and standby pages).

You can see commit charge in Task Manager: open the Performance tab, click Memory, and look at the "Committed" line.

### STATUS_STACK_BUFFER_OVERRUN explained

This Windows error code (0xC0000409) is one of the most misleading errors you will encounter. It usually does not mean your code has a buffer overrun. Here is what actually happens:

1. A memory allocation fails, throwing `std::bad_alloc`
2. The exception is not caught, so `std::terminate()` is called
3. `terminate()` calls `abort()`
4. MSVC's `/GS` security cookie check runs during cleanup
5. The cookie check reports `STATUS_STACK_BUFFER_OVERRUN`

The crash handlers in this toolkit intercept step 2 and print the real exception before the misleading error code appears.

### Single-header libraries

All C++ components in this toolkit (`crash_handlers.h`, `debug_log.h`, `minidump.h`, `build_info.h`) are single-header files. This means you include them with `#include` and they work -- no separate compilation step, no linking against a library file (linker dependencies like `dbghelp.lib` are handled automatically via `#pragma comment`).

## First steps

### Step 1: Install prerequisites

You need:
- **Visual Studio 2022** (Build Tools edition is sufficient) -- this provides the C++ compiler (`cl.exe`)
- **.NET 9.0 SDK** -- needed to build the governor from source during setup

### Step 2: Clone and set up

```powershell
git clone https://github.com/mcp-tool-shop-org/rippled-windows-debug.git
cd rippled-windows-debug
.\scripts\setup-governor.ps1
```

The setup script builds the governor and adds compiler wrappers to your PATH. Restart your terminal after setup.

### Step 3: Try the demo

The `examples/test_crash.cpp` file demonstrates all toolkit features:

```batch
cd examples

REM Build the demo (requires VS2022 developer command prompt)
cl /EHsc /Zi /utf-8 test_crash.cpp /link dbghelp.lib shell32.lib

REM See Rich-style colored logging
test_crash.exe 6

REM See build and system info
test_crash.exe 7

REM Trigger a bad_alloc crash and see the verbose report
test_crash.exe 1
```

### Step 4: Protect your rippled builds

Once the governor is set up, just build rippled normally:

```powershell
cmake --build build --parallel 16
```

The governor intercepts every `cl.exe` call and throttles automatically when memory pressure rises.

## Common questions

### Do I need admin rights?

No. The setup script modifies your user-level PATH only. The governor runs as a regular user process.

### Does the governor slow down my builds?

Only when memory pressure is high. Under normal conditions, the governor grants tokens immediately and adds negligible overhead. When commit charge rises, it throttles -- which is slower than unrestricted building, but far faster than a crashed build that needs to restart from scratch.

### Can I use this with projects other than rippled?

Yes. The Build Governor works with any project that uses `cl.exe` or `link.exe`. The crash handlers and logging headers are generic C++ and can be included in any Windows C++ project.

### What if I do not use Windows?

The headers compile to no-ops on non-Windows platforms (all macros expand to `((void)0)`). You can safely include them in cross-platform code without `#ifdef` guards in your source files.

## Troubleshooting your first build

If something goes wrong during setup or your first protected build, check these common issues.

### setup-governor.ps1 fails with "dotnet not found"

The .NET 9.0 SDK is not installed or not in your PATH. Download it from [dotnet.microsoft.com](https://dotnet.microsoft.com/download/dotnet/9.0) and restart your terminal.

### cl.exe still points to the real MSVC compiler after setup

The wrapper directory was not added to PATH, or your terminal session was not restarted. Run `Get-Command cl.exe | Select-Object Source` in PowerShell. The path should contain `build-governor\bin\wrappers`. If it does not, re-run `.\scripts\setup-governor.ps1` and open a new terminal window.

### Build fails immediately with "Cannot find real cl.exe"

The wrapper cannot locate the real MSVC compiler. Make sure you have sourced the VS2022 environment first (run `vcvars64.bat`) or set the `GOV_REAL_CL` environment variable to the full path of the real `cl.exe`.

### Governor does not seem to throttle anything

The governor only throttles when commit charge exceeds 80%. If your system has plenty of memory, it grants tokens immediately and you will not notice any slowdown. This is expected -- the governor is a safety net, not a bottleneck.

### Crash handlers print no symbols in the stack trace

Build with `/Zi` (debug info flag) and keep the `.pdb` files next to your executable. Without PDB files, the handler can only show raw addresses.

## Glossary

| Term | Definition |
|------|-----------|
| **cl.exe** | The Microsoft Visual C++ compiler |
| **link.exe** | The Microsoft linker |
| **commit charge** | Total memory promised by the OS to all processes; when this limit is reached, allocations fail |
| **PDB** | Program Database file -- contains debug symbols for stack traces |
| **DbgHelp** | Windows API library for stack walking, symbol resolution, and minidump writing |
| **minidump** | A `.dmp` file capturing process state at crash time, analyzable in WinDbg or Visual Studio |
| **WinDbg** | Microsoft's debugger for Windows; used to analyze minidumps |
| **SIGABRT** | Signal sent when `abort()` is called |
| **SIGSEGV** | Signal sent on invalid memory access (segmentation fault) |
| **/GS** | MSVC compiler flag that enables stack buffer overrun detection (security cookies) |
| **Conan** | C++ package manager used by rippled for dependency management |
| **Ninja** | Fast build system used as a backend by CMake |
