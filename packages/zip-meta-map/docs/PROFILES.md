# zip-meta-map Profiles — v1.1

Profiles define how zip-meta-map categorizes files and constructs traversal plans for specific project types. A profile provides:

- **Default ignore globs** — files excluded from indexing
- **Entrypoint detection** — what counts as a "start here" file
- **Default traversal plans** — named strategies for navigating the project

## Profile: `python_cli`

For Python projects with a CLI entry point (Click, argparse, Typer, etc.).

### Entrypoint detection

Files matching (in priority order):
1. `src/*/cli.py` or `src/*/main.py`
2. `src/*/__main__.py`
3. `cli.py` or `main.py` at root
4. `__main__.py` at root

Also includes: `README.md`, `pyproject.toml`

### Default ignore globs

```
__pycache__/**
*.pyc
.venv/**
venv/**
*.egg-info/**
dist/**
build/**
.git/**
.pytest_cache/**
.mypy_cache/**
.tox/**
```

### Default plans

**overview**
> Quick orientation — what is this tool and how is it structured?
1. READ `README.md`
2. READ `pyproject.toml` (dependencies, entry points)
3. READ entrypoint file
4. LIST `src/` directory structure

**debug**
> Find and fix a bug
1. READ entrypoint file
2. READ `tests/` to understand test coverage
3. SCAN `src/` for error handling patterns
4. CHECK `pyproject.toml` for dependency versions

**add_feature**
> Understand where to add new functionality
1. READ `README.md` for project context
2. READ entrypoint to understand CLI structure
3. LIST `src/` modules to find related code
4. READ `tests/` for test patterns to follow

**security_review**
> Identify security-sensitive code paths
1. SCAN for `subprocess`, `eval`, `exec`, `os.system` calls
2. CHECK for hardcoded secrets or credentials
3. REVIEW dependency list in `pyproject.toml`
4. SCAN for file I/O operations on user-supplied paths

---

## Profile: `node_ts_tool`

For Node.js/TypeScript tool projects (CLI tools, MCP servers, utilities).

### Entrypoint detection

Files matching (in priority order):
1. `src/index.ts` or `src/main.ts`
2. `src/cli.ts`
3. `index.ts` or `index.js` at root
4. `main` field in `package.json`

Also includes: `README.md`, `package.json`

### Default ignore globs

```
node_modules/**
dist/**
build/**
.git/**
coverage/**
.nyc_output/**
*.tsbuildinfo
.turbo/**
```

### Default plans

**overview**
> Quick orientation
1. READ `README.md`
2. READ `package.json` (scripts, dependencies, main/bin)
3. READ entrypoint file
4. LIST `src/` directory structure

**debug**
> Find and fix a bug
1. READ entrypoint file
2. READ `tsconfig.json` for compilation settings
3. SCAN `src/` for error handling patterns
4. READ relevant test files

**add_feature**
> Understand where to add new functionality
1. READ `README.md` for project context
2. READ entrypoint and trace imports
3. LIST `src/` for module layout
4. READ existing tests for patterns

**security_review**
> Identify security-sensitive code paths
1. SCAN for `child_process`, `eval`, dynamic `require`/`import`
2. CHECK for hardcoded secrets or tokens
3. REVIEW `package.json` dependencies
4. SCAN for file/network I/O with user-supplied input

---

## Profile: `monorepo`

For multi-package repositories with a workspace root.

### Entrypoint detection

Files matching:
1. `README.md` at root
2. Workspace config: `pnpm-workspace.yaml`, root `package.json` with `workspaces`, `lerna.json`
3. First-level `packages/*/README.md` or `packages/*/package.json`

### Default ignore globs

```
**/node_modules/**
**/__pycache__/**
**/dist/**
**/build/**
.git/**
**/*.egg-info/**
**/coverage/**
**/.venv/**
```

### Default plans

**overview**
> Understand the monorepo structure
1. READ root `README.md`
2. READ workspace config (pnpm-workspace.yaml / package.json / lerna.json)
3. LIST top-level packages/directories
4. READ `README.md` in each package (first 3)

**debug**
> Find and fix a bug across packages
1. IDENTIFY which package owns the bug
2. READ that package's entrypoint
3. TRACE cross-package dependencies
4. READ related tests

**add_feature**
> Add functionality to the right package
1. READ root README for architecture overview
2. LIST packages to identify the right target
3. READ target package entrypoint and structure
4. CHECK for shared utilities or common packages

**security_review**
> Security review across all packages
1. LIST all packages
2. SCAN each package for security-sensitive patterns
3. REVIEW all dependency manifests
4. CHECK for shared secrets or credential handling

---

## Profile: `rust_cli`

For Rust projects with a CLI or library entry point.

### Entrypoint detection

Files matching:
1. `src/main.rs`
2. `src/bin/*.rs`
3. `src/lib.rs`

Also includes: `README.md`, `Cargo.toml`

### Custom roles

| Role | Description | Patterns |
|------|-------------|----------|
| `bench` | Rust benchmark files | `benches/**`, `benches/*.rs` |

### Default ignore globs

```
target/**
.git/**
**/*.rlib
**/*.rmeta
**/*.d
```

### Default plans

**overview**
> Quick orientation — what does this Rust crate do and how is it structured?
1. READ `README.md`
2. READ `Cargo.toml` for dependencies, features, and binary targets
3. READ `src/main.rs` or `src/lib.rs` for crate entry point
4. LIST `src/` directory structure

**debug**
> Find and fix a bug in the Rust crate
1. READ `src/main.rs` or `src/lib.rs` for control flow
2. LIST `tests/` and `src/` for test structure
3. SCAN for `unwrap()`, `expect()`, `panic!` and error handling patterns
4. CHECK `Cargo.toml` for dependency versions and features

**security_review**
> Identify security-sensitive code paths in Rust
1. SCAN for `unsafe` blocks and raw pointer operations
2. CHECK for `std::process::Command`, shell invocations
3. REVIEW `Cargo.toml` for known-vulnerable dependencies
4. SCAN for file I/O on user-supplied paths, network listeners

---

## Profile: `go_cli`

For Go projects with a CLI entry point.

### Entrypoint detection

Files matching:
1. `main.go`
2. `cmd/*/main.go`

Also includes: `README.md`, `go.mod`

### Custom roles

| Role | Description | Patterns |
|------|-------------|----------|
| `go_generate` | Go generated code | `**/*_gen.go`, `**/*_generated.go`, `**/zz_generated*.go` |

### Default ignore globs

```
.git/**
vendor/**
**/testdata/**
```

### Default plans

**overview**
> Quick orientation — what does this Go module do?
1. READ `README.md`
2. READ `go.mod` for module path and dependencies
3. READ `main.go` or `cmd/*/main.go` for entry point
4. LIST top-level packages

**debug**
> Find and fix a bug in the Go module
1. READ `main.go` for control flow and flag parsing
2. LIST `*_test.go` files to understand test structure
3. SCAN for error handling patterns (`if err != nil`, `log.Fatal`)
4. CHECK `go.mod` for dependency versions

**security_review**
> Identify security-sensitive code paths in Go
1. SCAN for `os/exec`, `net/http`, `crypto` usage
2. CHECK for hardcoded credentials or embedded secrets
3. REVIEW `go.mod` dependencies for known CVEs
4. SCAN for SQL queries, template rendering, file path handling

---

## Profile: `dotnet_cli`

For .NET projects (console apps, web APIs, libraries).

### Entrypoint detection

Files matching:
1. `Program.cs` or `src/*/Program.cs`
2. `Startup.cs` or `src/*/Startup.cs`

Also includes: `README.md`

### Custom roles

| Role | Description | Patterns |
|------|-------------|----------|
| `project_file` | .NET project file | `*.csproj`, `*.fsproj`, `*.vbproj` |
| `solution_file` | Visual Studio solution | `*.sln` |

### Default ignore globs

```
bin/**
obj/**
**/bin/**
**/obj/**
.git/**
.vs/**
packages/**
**/*.nupkg
**/*.user
```

### Default plans

**overview**
> Quick orientation — what does this .NET project do?
1. READ `README.md`
2. READ `*.csproj` or `*.sln` for project structure and dependencies
3. READ `Program.cs` for application entry point
4. LIST `src/` or project directories

**debug**
> Find and fix a bug in the .NET project
1. READ `Program.cs` / `Startup.cs` for application pipeline
2. LIST `*Tests/` projects for test structure
3. SCAN for exception handling patterns (`try/catch`, `throw`)
4. CHECK `*.csproj` for package references and versions

**security_review**
> Identify security-sensitive code paths in .NET
1. SCAN for `Process.Start`, SQL commands, `HttpClient` usage
2. CHECK for hardcoded connection strings or credentials
3. REVIEW `*.csproj` package references for known vulnerabilities
4. SCAN for `[AllowAnonymous]`, CORS policies, authentication config

---

## Profile: `java_cli`

For Java projects (Maven or Gradle).

### Entrypoint detection

Files matching:
1. `src/main/java/**/Main.java`
2. `src/main/java/**/Application.java`
3. `src/main/java/**/App.java`

Also includes: `README.md`

### Custom roles

| Role | Description | Patterns |
|------|-------------|----------|
| `maven_config` | Maven POM configuration | `pom.xml`, `**/pom.xml` |
| `gradle_config` | Gradle build configuration | `build.gradle`, `build.gradle.kts`, `settings.gradle`, `settings.gradle.kts` |

### Default ignore globs

```
target/**
build/**
.gradle/**
.git/**
**/*.class
**/*.jar
.idea/**
*.iml
```

### Default plans

**overview**
> Quick orientation — what does this Java project do?
1. READ `README.md`
2. READ `pom.xml` or `build.gradle` for dependencies and build config
3. READ main entry point class
4. LIST `src/main/java/` directory structure

**debug**
> Find and fix a bug in the Java project
1. READ entry point class for control flow
2. LIST `src/test/` for test structure
3. SCAN for exception handling patterns (`try/catch`, `throws`)
4. CHECK dependency manifest for version conflicts

**security_review**
> Identify security-sensitive code paths in Java
1. SCAN for `Runtime.exec()`, `ProcessBuilder`, SQL queries
2. CHECK for hardcoded credentials, API keys in properties files
3. REVIEW dependency manifest for known CVEs
4. SCAN for deserialization, reflection, JNDI usage

---

## Custom roles

Profiles can define **custom roles** that extend the built-in vocabulary. Custom roles are defined with:

- **name** — lowercase identifier (e.g., `project_file`, `bench`)
- **description** — what files this role represents
- **patterns** — glob patterns to match (e.g., `*.csproj`, `benches/*.rs`)
- **confidence** — assignment confidence (default: 0.80)

Custom roles are checked at priority 14 in the role assignment chain (after schemas, before extension-based fallback). Built-in roles always take precedence.

When a profile defines custom roles, the index output includes a `custom_roles` field mapping role names to descriptions.
