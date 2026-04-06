---
title: Build Governor
description: How automatic OOM protection works.
sidebar:
  order: 2
---

The build governor prevents memory exhaustion during parallel C++ builds by monitoring commit charge and throttling compiler processes.

## The problem

Each `cl.exe` process can use 1--4 GB of RAM. With `-j16`, that is potentially 64 GB of memory demand. When commit charge hits 100%, Windows becomes unresponsive and builds fail silently.

The error you see is often `STATUS_STACK_BUFFER_OVERRUN (0xC0000409)`, which is misleading -- the real cause is `std::bad_alloc`. This happens because:

1. Exception not caught -- `std::terminate()` called
2. `terminate()` calls `abort()`
3. MSVC's `/GS` security checks interpret this as a buffer overrun

## How it works

The governor uses compiler wrappers that intercept `cl.exe` and `link.exe` calls:

1. You run `cmake --build . --parallel 16`
2. Each `cl.exe` invocation hits the wrapper (placed ahead in PATH)
3. The wrapper checks if the governor service is running -- auto-starts it if not
4. The wrapper requests tokens from the governor based on current commit charge
5. The real `cl.exe` runs once tokens are granted
6. Tokens are released when compilation finishes

If the governor is down or unreachable, the wrapper falls back to running the real compiler directly (fail-safe behavior).

## Architecture

The governor is a .NET 9.0 application with six components:

| Component | Project | Purpose |
|-----------|---------|---------|
| **Service** | `Gov.Service` | Background process that tracks commit charge, manages token pool, and grants/revokes leases |
| **CL Wrapper** | `Gov.Wrapper.CL` | Replacement `cl.exe` that requests tokens before compiling and classifies failures on exit |
| **Link Wrapper** | `Gov.Wrapper.Link` | Replacement `link.exe` that requests tokens before linking |
| **Common** | `Gov.Common` | Shared library: governor client, Windows memory metrics, GPU metrics, auto-start logic, process monitoring |
| **Protocol** | `Gov.Protocol` | Message types for named-pipe communication (acquire, release, heartbeat, status) |
| **CLI** | `Gov.Cli` | Command-line tool (`gov run`, `gov status`) for governed builds without PATH manipulation |

Communication between wrappers and service uses a named pipe (`BuildGovernor`). The wrappers are published as self-contained executables, so they do not require .NET to be installed at runtime. The .NET SDK is only needed during the initial `setup-governor.ps1` build step.

### Token budget and throttle levels

The service calculates a token budget based on available memory. Each token represents roughly 2 GB of commit headroom. Three throttle levels control behavior:

| Level | Commit ratio | Effect |
|-------|-------------|--------|
| Normal | below 80% | Tokens granted immediately |
| Caution | 80--88% | Retry delay increases to 200 ms between attempts |
| Soft stop | 88--92% | Retry delay increases to 500 ms |
| Hard stop | above 92% | Token requests are denied outright |

Leases have a 30-minute TTL. If a wrapper crashes without releasing its tokens, the service reclaims them automatically.

### Failure classification

When a compilation finishes, the wrapper reports exit code and memory metrics to the service. The service classifies the result as one of: `Success`, `NormalCompileError`, `LikelyOOM`, `LikelyPagingDeath`, or `Unknown`. OOM and paging-death classifications trigger diagnostic messages printed to stderr.

## Why commit charge, not free RAM

The governor monitors **commit charge** because:

- Commit charge = promised memory (even if not yet paged in)
- When the commit limit is reached, allocations fail immediately
- Free RAM is misleading -- file cache and standby pages inflate the number

You can see your current commit charge in Task Manager under the Performance tab (Memory section, "Committed" line).

## Supported build systems

The wrappers work with any build system that invokes `cl.exe` or `link.exe`:

```powershell
cmake --build . --parallel 16
msbuild /m:16
ninja -j 8
```

## Auto-shutdown

The governor service automatically exits after 30 minutes of idle (no token requests). This means it does not linger after your build finishes. The next build will auto-start it again through the wrapper.
