---
title: Finding Codes
description: Complete reference of diagnostic finding codes emitted by venvkit.
sidebar:
  order: 4
---

When doctorLite checks a Python environment, it reports issues as **finding codes**. Each code has a severity (`bad` or `warn`) and a description explaining what was detected and why it matters.

## Severity levels

- **bad** — The environment has a critical problem that will likely cause failures at runtime. Address these first.
- **warn** — The environment has a potential issue that may cause unexpected behavior. These are less urgent but worth investigating.

## Finding codes reference

### PYTHON_EXEC_MISSING
| | |
|---|---|
| **Severity** | bad |
| **Description** | The Python interpreter cannot be executed at the given path. |
| **Impact** | No checks can run. The environment is completely unusable. |
| **Common causes** | The venv was deleted or moved, the path is wrong, or the interpreter was uninstalled. |
| **Fix** | Verify the path exists and is executable. If this is a venv, recreate it. |

### SUBPROCESS_BROKEN
| | |
|---|---|
| **Severity** | bad |
| **Description** | Python runs but returns unexpected output that cannot be parsed. |
| **Impact** | venvkit cannot collect facts about the environment, so health scoring is unreliable. |
| **Common causes** | A `sitecustomize.py` or `usercustomize.py` prints to stdout, or the environment is otherwise unstable. |
| **Fix** | Run `python -c "import sys; print(sys.version)"` manually. If that works but JSON probes fail, check for startup scripts that write to stdout. |

### NOT_A_VENV
| | |
|---|---|
| **Severity** | info |
| **Description** | The interpreter is a base Python installation, not a virtual environment. |
| **Impact** | Not inherently a problem, but packages installed here affect all projects that share this interpreter. |
| **Common causes** | Pointing venvkit at a system or user-installed Python rather than a project venv. |
| **Fix** | Create a virtual environment for your project: `python -m venv .venv`. |

### SSL_BROKEN
| | |
|---|---|
| **Severity** | bad |
| **Description** | The `ssl` module fails to import in this Python interpreter. |
| **Impact** | Any code that makes HTTPS requests (pip install, API calls, model downloads) will fail. |
| **Common causes** | Missing or corrupted OpenSSL libraries, incomplete Python installation. |
| **Fix** | Reinstall Python ensuring the SSL option is included, or install OpenSSL system-wide. |

### CERT_STORE_FAIL
| | |
|---|---|
| **Severity** | warn |
| **Description** | HTTPS certificate verification fails against standard certificate authorities. |
| **Impact** | pip and other tools may refuse to connect to PyPI or other HTTPS endpoints. |
| **Common causes** | Corporate proxy with custom CA, outdated `certifi` package, missing system certificates. |
| **Fix** | Update `certifi` (`pip install --upgrade certifi`), or configure `SSL_CERT_FILE` to point to your corporate CA bundle. |

### DLL_LOAD_FAIL
| | |
|---|---|
| **Severity** | bad |
| **Description** | A native extension DLL fails to load. |
| **Impact** | Packages like PyTorch, TensorFlow, and NumPy that rely on compiled C/C++ extensions will crash on import. This is the most common silent failure in Windows ML workflows. |
| **Common causes** | Missing CUDA runtime DLLs, mismatched Visual C++ redistributable, path issues preventing DLL resolution. |
| **Fix** | Install the correct CUDA toolkit version, ensure Visual C++ Redistributable is installed, verify that DLL directories are on the system PATH. |

### ABI_MISMATCH
| | |
|---|---|
| **Severity** | bad |
| **Description** | Binary incompatibility detected between the interpreter and installed packages. |
| **Impact** | Extensions compiled for a different ABI (e.g. ARM vs x86) will segfault or fail to load. |
| **Common causes** | Copying a venv between machines with different architectures, or installing packages from wheels built for a different platform. |
| **Fix** | Recreate the virtual environment on the target machine and reinstall packages from scratch. |

### PIP_MISSING
| | |
|---|---|
| **Severity** | warn |
| **Description** | pip is not available in this environment. |
| **Impact** | You cannot install or manage packages in this environment without pip. |
| **Common causes** | Virtual environment created with `--without-pip`, or pip was uninstalled. |
| **Fix** | Run `python -m ensurepip --upgrade` to bootstrap pip. |

### PIP_CHECK_FAIL
| | |
|---|---|
| **Severity** | warn |
| **Description** | `pip check` reports dependency conflicts. |
| **Impact** | Installed packages have incompatible version requirements. This can cause import errors or runtime bugs that are difficult to diagnose. |
| **Common causes** | Installing packages with `--no-deps`, mixing pip and conda installs, or pinning conflicting versions. |
| **Fix** | Run `pip check` to see the specific conflicts, then update or reinstall the affected packages. |

### USER_SITE_LEAK
| | |
|---|---|
| **Severity** | warn |
| **Description** | User site-packages is enabled inside a virtual environment. |
| **Impact** | Packages installed with `pip install --user` outside the venv leak into the venv's import path. This breaks environment isolation and can cause version conflicts. |
| **Common causes** | The `ENABLE_USER_SITE` flag was not disabled when the venv was created, or `PYTHONNOUSERSITE` is not set. |
| **Fix** | Recreate the venv (most venv tools disable user-site by default), or set `PYTHONNOUSERSITE=1`. |

### PYTHONPATH_INJECTED
| | |
|---|---|
| **Severity** | warn |
| **Description** | The `PYTHONPATH` environment variable is set. |
| **Impact** | Directories on `PYTHONPATH` are prepended to `sys.path`, which can shadow packages inside the venv and cause unpredictable behavior. |
| **Common causes** | Development tooling, IDE configurations, or system-wide environment variable set by another application. |
| **Fix** | Unset `PYTHONPATH` before running your ML tasks, or ensure it only contains directories you intentionally want on the import path. |

### ARCH_MISMATCH
| | |
|---|---|
| **Severity** | bad |
| **Description** | 32-bit Python is installed where 64-bit is required. |
| **Impact** | 32-bit Python cannot address more than ~3 GB of memory, making it unusable for ML workloads. Many ML packages do not publish 32-bit wheels at all. |
| **Common causes** | Downloading the wrong installer from python.org, or using a system-managed Python that defaulted to 32-bit. |
| **Fix** | Install 64-bit Python and recreate your virtual environments. |

### PYVENV_CFG_INVALID
| | |
|---|---|
| **Severity** | warn |
| **Description** | The `pyvenv.cfg` file is missing or contains invalid entries. |
| **Impact** | The virtual environment may not activate correctly or may not properly isolate from the base interpreter. |
| **Common causes** | Manual edits to `pyvenv.cfg`, moving the venv to a different directory, or filesystem corruption. |
| **Fix** | Recreate the virtual environment. If you need to preserve installed packages, export them with `pip freeze` first. |

### PIP_POINTS_TO_OTHER_PYTHON
| | |
|---|---|
| **Severity** | warn |
| **Description** | pip reports a different Python version than the interpreter it is running under. |
| **Impact** | Package installations may target the wrong Python, leading to missing or incompatible modules. |
| **Common causes** | Upgrading Python without recreating the venv, or a stale pip binary left from a previous installation. |
| **Fix** | Rebind pip by running `python -m pip install -U pip setuptools wheel`. If it persists, recreate the venv. |

### USER_SITE_ENABLED
| | |
|---|---|
| **Severity** | warn |
| **Description** | The `ENABLE_USER_SITE` flag is active, meaning user site-packages can be loaded. |
| **Impact** | Packages installed with `pip install --user` outside the venv may be importable inside it, weakening isolation. |
| **Common causes** | Some Python builds enable user-site by default. |
| **Fix** | Set `PYTHONNOUSERSITE=1` in your shell environment, or recreate the venv (most venv tools disable this automatically). |

### MULTI_VERSION_ON_PATH
| | |
|---|---|
| **Severity** | warn |
| **Description** | Multiple installations of the same package are present on `sys.path` from different locations. |
| **Impact** | Python imports whichever copy appears first on `sys.path`, which may not be the version you expect. |
| **Common causes** | Mixing pip and conda installs, leftover packages from a previous environment, or user-site leakage. |
| **Fix** | Recreate the venv. If you must repair in place, uninstall all copies and reinstall the one you need. |

### IMPORT_FAIL
| | |
|---|---|
| **Severity** | bad (for required modules) or warn (for optional modules) |
| **Description** | A Python module failed to import but the failure is not a DLL or ABI issue. |
| **Impact** | The package is either not installed, incompatible, or shadowed by another module on `sys.path`. |
| **Common causes** | Missing `pip install`, version incompatibility, or `PYTHONPATH`/user-site shadowing. |
| **Fix** | Install or reinstall the module: `python -m pip install -U <module>`. Check for path shadowing if already installed. |

## Next steps

- **[Reference](/venvkit/handbook/reference/)** — Full CLI and API reference
- **[Outputs](/venvkit/handbook/outputs/)** — Output file formats and schemas
