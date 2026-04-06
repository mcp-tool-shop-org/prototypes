---
title: Reference
description: Common issues, toolkit files, and links.
sidebar:
  order: 6
---

## Common Windows issues

### std::bad_alloc appearing as STATUS_STACK_BUFFER_OVERRUN

**Cause:** Unhandled exception leads to `std::terminate()`, which calls `abort()`. MSVC's `/GS` security cookie check then reports `STATUS_STACK_BUFFER_OVERRUN (0xC0000409)`.

**Solutions:**
1. **Prevent it:** Use the Build Governor (`.\scripts\setup-governor.ps1`) to throttle parallel builds before memory runs out
2. **Diagnose it:** Use crash handlers to reveal the real exception type and get a stack trace

### Missing symbols in stack traces

**Cause:** No PDB files generated for release builds

**Solution:** Build with `/Zi` compiler flag and `/DEBUG` linker flag. See the [PDB section in Building rippled](/rippled-windows-debug/handbook/building-rippled/#pdb-files-for-release-builds) for the CMake snippet.

### Build hangs or system freezes

**Cause:** Too many parallel compilations exhausting commit charge

**Solution:** The Build Governor automatically throttles based on memory pressure. If you are not using the governor, reduce parallelism: `cmake --build . --parallel 4`

### cl.exe exits with code 1, no error message

**Cause:** Memory allocation failed inside the compiler itself, but the error is not surfaced

**Solution:** Install the crash handlers and governor. The governor prevents the OOM condition; the crash handlers report the real exception if it happens anyway.

## Toolkit files

| File | Purpose |
|------|---------|
| `src/crash_handlers.h` | Verbose crash diagnostics with exception identification and stack traces |
| `src/debug_log.h` | Rich-style terminal logging with color, timing, sections, and correlation IDs |
| `src/minidump.h` | Automatic crash dump capture (`.dmp` files for WinDbg/Visual Studio) |
| `src/build_info.h` | Build-time and runtime system info (version, git, compiler, CPU, memory) |
| `src/rippled_debug.h` | Single-include header that pulls in all four headers above |
| `tools/build-governor/` | .NET 9.0 governor: service, CL/Link wrappers, shared client library, protocol, and CLI tool |
| `scripts/setup-governor.ps1` | One-command governor build and PATH setup |
| `scripts/build-rippled.ps1` | Full rippled build pipeline with governor protection |
| `scripts/get_git_info.bat` | Batch script to extract git info for compiler defines |
| `cmake/GitInfo.cmake` | CMake module to set git defines automatically |
| `patches/rippled_main.patch` | Patch for rippled's Main.cpp to add crash handlers |
| `examples/test_crash.cpp` | Demo program with 7 test modes (crash types + logging demo) |

## Links

- [GitHub Repository](https://github.com/mcp-tool-shop-org/rippled-windows-debug)
- [rippled issue #6293](https://github.com/XRPLF/rippled/issues/6293) -- the issue that inspired this toolkit
- [rippled](https://github.com/XRPLF/rippled) -- the XRPL validator node
- [DbgHelp documentation](https://learn.microsoft.com/en-us/windows/win32/debug/debug-help-library) -- Microsoft's debug help library used for stack traces
- [WinDbg](https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/) -- Microsoft's debugger for analyzing minidumps
