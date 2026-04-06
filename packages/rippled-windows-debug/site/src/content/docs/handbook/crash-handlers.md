---
title: Crash Handlers
description: Verbose crash diagnostics that reveal hidden exceptions.
sidebar:
  order: 3
---

When a crash does happen, the verbose crash handlers (`crash_handlers.h`) produce a comprehensive report instead of cryptic Windows error codes.

## What it captures

- **Actual exception type and message** -- reveals `std::bad_alloc` hidden behind `STATUS_STACK_BUFFER_OVERRUN`
- **Full stack trace** with symbol resolution via DbgHelp
- **Signal information** (SIGABRT, SIGSEGV, SIGFPE, SIGILL)
- **Build info** -- toolkit version, git commit, compiler, architecture
- **System info** -- Windows version, CPU, memory, computer name
- **Process info** -- working set, peak working set, private bytes, page faults
- **Thread info** -- current thread ID, process ID, total thread count
- **Loaded modules** -- first 10 DLLs with base addresses and sizes
- **Diagnostic hints** -- actionable suggestions based on the exception type

## How it works

The handler installs two hooks at startup:

1. **`std::set_terminate`** -- catches unhandled C++ exceptions. When `std::terminate()` is called, the handler re-throws the current exception to identify its real type (e.g., `std::bad_alloc`, `std::runtime_error`, `std::out_of_range`).
2. **Signal handlers** -- catches SIGABRT, SIGSEGV, SIGFPE, and SIGILL with `std::signal`. Each signal gets specific diagnostic hints about common root causes.

## Patching rippled

Apply the crash handlers to `src/xrpld/app/main/Main.cpp`. The actual patch uses the `RIPPLED_WINDOWS_DEBUG` define so the toolkit is opt-in at compile time:

```cpp
// Add at top of file (after existing includes)
#ifdef RIPPLED_WINDOWS_DEBUG
#include "rippled_debug.h"
#endif

// Add at start of main()
#if BOOST_OS_WINDOWS && defined(RIPPLED_WINDOWS_DEBUG)
    RIPPLED_DEBUG_INIT();
#endif
```

Compile with `-DRIPPLED_WINDOWS_DEBUG` to activate the toolkit. A ready-made patch file is at `patches/rippled_main.patch`.

## Using the single-include header

For the simplest setup, use `rippled_debug.h` which includes crash handlers, minidump, logging, and build info all at once:

```cpp
#include "rippled_debug.h"

int main() {
    RIPPLED_DEBUG_INIT();  // Installs crash handlers + minidump + prints build info
    // ... your code ...
}
```

If you only want crash handlers without minidump or logging:

```cpp
#include "crash_handlers.h"

int main() {
    installVerboseCrashHandlers();
    // ... your code ...
}
```

## What crash output looks like

Instead of a cryptic exit code, you get a full report showing:

- The real exception (`std::bad_alloc` / `bad allocation`)
- Why it appeared as `STATUS_STACK_BUFFER_OVERRUN`
- System memory state at the time of crash
- A complete stack trace with frame addresses and symbol names
- Build information for reproducibility

## Recognized exception types

The handler provides specific diagnostic hints for:

| Exception | Hint |
|-----------|------|
| `std::bad_alloc` | Memory allocation failure -- often the real cause behind `STATUS_STACK_BUFFER_OVERRUN` |
| `std::runtime_error` / `std::logic_error` | Standard library exception not caught |
| `std::out_of_range` | Vector/string index out of bounds, `map::at()` with missing key |
| `std::invalid_argument` | Invalid parameter passed to a function |

## Linker requirements

The crash handlers use `dbghelp.lib` and `psapi.lib` for stack traces and process information. These are linked automatically via `#pragma comment(lib, ...)` when using MSVC. No manual linker configuration is needed.

For best stack traces, build with `/Zi` (debug info) and keep PDB files alongside the executable.
