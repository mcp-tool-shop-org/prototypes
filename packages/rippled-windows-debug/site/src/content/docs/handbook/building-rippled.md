---
title: Building rippled
description: Full build guide with prerequisites and two approaches.
sidebar:
  order: 5
---

Complete guide to building rippled on Windows with debug toolkit protection.

## Prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Visual Studio 2022 | Build Tools or full VS2022 | Provides `cl.exe`, `link.exe`, and Windows SDK |
| .NET 9.0 SDK | Latest | Builds the governor (only needed once for setup) |
| Python 3.x | 3.10+ | Runs Conan package manager |
| Conan | 2.x | Manages rippled's C++ dependencies (`pip install conan`) |
| CMake | 3.25+ | Build system generator (comes with Conan or install separately) |
| Ninja | Latest | Fast build backend (comes with Conan or install separately) |

## Option 1: One-command build (recommended)

The toolkit includes `build-rippled.ps1`, a PowerShell script that handles the full build pipeline:

```powershell
cd F:\rippled

# Copy the build script from the toolkit
copy F:\AI\rippled-windows-debug\scripts\build-rippled.ps1 .

# Run the full build with governor protection
powershell -ExecutionPolicy Bypass -File build-rippled.ps1 -Parallel 8
```

### Script parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-Parallel` | `8` | Number of parallel compilation jobs |
| `-BuildType` | `Release` | Build configuration (`Release`, `Debug`, `RelWithDebInfo`) |
| `-Clean` | off | Delete the build directory and rebuild from scratch |
| `-ToolkitPath` | auto-detect | Path to the rippled-windows-debug toolkit |

The script automatically:
- Finds and sources the VS2022 environment (`vcvars64.bat`)
- Adds Python Scripts to PATH (for Conan)
- Builds the governor if not already built
- Puts governor wrappers ahead of the real `cl.exe` in PATH
- Runs Conan install (skips if already configured)
- Configures CMake with Ninja (skips if `build.ninja` exists)
- Builds with governor protection
- Reports build duration and governor stats

## Option 2: Manual build steps

```batch
REM 1. Set up build protection
powershell -ExecutionPolicy Bypass -File scripts\setup-governor.ps1

REM 2. Set up VS2022 environment
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"

REM 3. Install dependencies
conan install . --output-folder=build --build=missing

REM 4. Configure with debug info in release
cmake -G Ninja -B build ^
    -DCMAKE_BUILD_TYPE=RelWithDebInfo ^
    -DCMAKE_TOOLCHAIN_FILE=build/generators/conan_toolchain.cmake ^
    -Dxrpld=ON

REM 5. Build (governor protects automatically)
cmake --build build --parallel 16
```

## PDB files for release builds

For symbol resolution in release builds (so crash handlers produce useful stack traces), add to CMakeLists.txt:

```cmake
if(MSVC)
    set(CMAKE_CXX_FLAGS_RELEASE "${CMAKE_CXX_FLAGS_RELEASE} /Zi")
    set(CMAKE_EXE_LINKER_FLAGS_RELEASE "${CMAKE_EXE_LINKER_FLAGS_RELEASE} /DEBUG /OPT:REF /OPT:ICF")
endif()
```

The `/Zi` flag generates PDB files during compilation. The `/DEBUG` linker flag embeds debug directory info in the executable. `/OPT:REF` and `/OPT:ICF` keep the binary size small despite debug info.
