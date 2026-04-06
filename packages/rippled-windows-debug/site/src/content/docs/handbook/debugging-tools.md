---
title: Debugging Tools
description: Rich-style logging, minidump generation, and build info.
sidebar:
  order: 4
---

Beyond the governor and crash handlers, the toolkit includes three more single-header tools.

## Rich-style logging (`debug_log.h`)

Beautiful terminal logging inspired by Python's Rich library:

- **Colored log levels** -- DEBUG (gray), INFO (cyan), WARN (yellow), ERROR (red), CRIT (bold red)
- **Box-drawing characters** -- visual section boundaries with Unicode
- **Delta timestamps** -- time elapsed since the last log entry
- **Automatic section timing** -- sections show elapsed time and memory delta on completion
- **Correlation IDs** -- track related log entries across threads
- **Multiple formats** -- Rich (colored), Text (plain), JSON (machine-parseable)
- **Memory tracking** -- optional per-log memory usage deltas

Use Windows Terminal or a terminal with VT/ANSI support for full color output.

### Log macros

```cpp
#include "debug_log.h"

DEBUG_LOG("Processing item %d", i);      // DEBUG level
DEBUG_INFO("Server started on port %d", port);
DEBUG_WARN("Connection timeout for %s", host);
DEBUG_ERROR("Failed to open file: %s", path);
DEBUG_CRITICAL("Database corrupted");
```

### Section tracking

Sections use RAII to automatically measure elapsed time:

```cpp
{
    DEBUG_SECTION("database_init");
    // ... work happens here ...
    DEBUG_INFO("Connected to database");
}
// Section end prints: database_init (156.2ms)
```

### Configuration

```cpp
DEBUG_FORMAT_JSON();             // Switch to JSON output
DEBUG_FORMAT_TEXT();             // Switch to plain text (no color)
DEBUG_FORMAT_RICH();             // Default: colored output
DEBUG_DELTA_TIME(true);          // Show time since last log
DEBUG_MEMORY_TRACKING(true);     // Show memory deltas per log
DEBUG_ENABLED(false);            // Disable all logging
```

### Variable inspection

```cpp
int count = 42;
DEBUG_VAR(count);     // Prints: count = 42
DEBUG_STR(name);      // Prints: name = "hello"
DEBUG_PTR(buffer);    // Prints: buffer = 0x00007ff...
DEBUG_MEMORY();       // Prints current working set, peak, and private bytes
```

## Minidump generation (`minidump.h`)

Automatic crash dump capture for post-mortem debugging with WinDbg or Visual Studio.

### Setup

```cpp
#include "minidump.h"

int main() {
    // Default: dumps go to %LOCALAPPDATA%\rippled\CrashDumps
    installMinidumpHandler();

    // Or specify a custom directory
    installMinidumpHandler("C:\\MyCrashDumps");
}
```

### What it captures

Dumps include full process memory, handle data, thread info, and unloaded modules. When a crash occurs, the handler writes a `.dmp` file named `rippled_YYYYMMDD_HHMMSS.dmp`.

You can also trigger a manual dump at any time for debugging:

```cpp
writeMinidump();  // Creates a dump without crashing
```

### Analyzing dumps

Open the dump file in WinDbg or Visual Studio:

```
windbg -z C:\...\rippled_20240212_143215.dmp
```

## Build information (`build_info.h`)

Captures comprehensive build and system info:

| Category | What it captures |
|----------|-----------------|
| Toolkit | Version (currently v1.1.0) |
| Git | Commit hash, branch, dirty status, describe, commit date |
| Compiler | Name and version (MSVC, Clang, or GCC) |
| Build | Date, time, architecture (x64/x86/ARM64), config (Debug/Release) |
| System | Windows version and edition, UBR (Update Build Revision) |
| Hardware | CPU brand (via CPUID), physical and logical core counts, total and available memory |
| Runtime | Computer name, username, admin status, WoW64 detection |

### Usage

```cpp
#include "build_info.h"

PRINT_BUILD_INFO();   // Full multi-line report to stderr
PRINT_VERSION();      // Single-line version string
```

Git information is captured at build time via compiler defines. Use the included `cmake/GitInfo.cmake` module to set them automatically, or pass them manually:

```
cl /DGIT_COMMIT_HASH=\"abc123\" /DGIT_BRANCH=\"main\" ...
```

## Demo

Run the included demo to see everything in action:

```batch
cd examples
cl /EHsc /Zi /utf-8 test_crash.cpp /link dbghelp.lib shell32.lib

test_crash.exe 6    REM Rich-style logging demo
test_crash.exe 7    REM Build and system info only
test_crash.exe 1    REM Trigger bad_alloc crash with full report
```

Other test modes: `2` (runtime_error), `3` (null pointer / SIGSEGV), `4` (abort / SIGABRT), `5` (stack overflow).
