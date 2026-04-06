"""Built-in profiles for project type detection and categorization."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Plan:
    description: str
    steps: list[str]
    budget_bytes: int | None = None
    stop_after: list[str] | None = None
    max_total_bytes: int | None = None

    def to_dict(self) -> dict:
        d: dict = {"description": self.description, "steps": self.steps}
        if self.budget_bytes is not None:
            d["budget_bytes"] = self.budget_bytes
        if self.stop_after is not None:
            d["stop_after"] = self.stop_after
        if self.max_total_bytes is not None:
            d["max_total_bytes"] = self.max_total_bytes
        return d


@dataclass(frozen=True)
class CustomRole:
    """A profile-defined custom role with matching rules."""

    name: str
    description: str
    patterns: list[str]
    confidence: float = 0.80


@dataclass(frozen=True)
class Profile:
    name: str
    entrypoint_patterns: list[str]
    start_here_extras: list[str]
    ignore_globs: list[str]
    plans: dict[str, Plan]
    detect_files: list[str] = field(default_factory=list)
    custom_roles: list[CustomRole] = field(default_factory=list)


PYTHON_CLI = Profile(
    name="python_cli",
    detect_files=["pyproject.toml", "setup.py", "setup.cfg"],
    entrypoint_patterns=[
        "src/*/cli.py",
        "src/*/main.py",
        "src/*/__main__.py",
        "cli.py",
        "main.py",
        "__main__.py",
    ],
    start_here_extras=["README.md", "pyproject.toml"],
    ignore_globs=[
        "__pycache__/**",
        "*.pyc",
        ".venv/**",
        "venv/**",
        "*.egg-info/**",
        "dist/**",
        "build/**",
        ".git/**",
        ".pytest_cache/**",
        ".mypy_cache/**",
        ".tox/**",
    ],
    plans={
        "overview": Plan(
            description="Quick orientation \u2014 what is this tool and how is it structured?",
            steps=[
                "READ README.md for project purpose and usage",
                "READ pyproject.toml for dependencies and entry points",
                "READ entrypoint file to understand CLI structure",
                "LIST src/ directory structure for module layout",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "pyproject.toml", "src/*/cli.py", "src/*/main.py"],
            max_total_bytes=32768,
        ),
        "debug": Plan(
            description="Find and fix a bug",
            steps=[
                "READ entrypoint file for control flow",
                "LIST tests/ to understand coverage",
                "SCAN src/ for error handling patterns (try/except, raise)",
                "CHECK pyproject.toml for dependency versions",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "add_feature": Plan(
            description="Understand where to add new functionality",
            steps=[
                "READ README.md for project context",
                "READ entrypoint to understand CLI structure and subcommands",
                "LIST src/ modules to find related code",
                "READ tests/ for test patterns to follow",
            ],
            budget_bytes=12288,
            max_total_bytes=49152,
        ),
        "security_review": Plan(
            description="Identify security-sensitive code paths",
            steps=[
                "SCAN for subprocess, eval, exec, os.system, shlex calls",
                "CHECK for hardcoded secrets, tokens, or credentials",
                "REVIEW dependency list in pyproject.toml for known-vulnerable packages",
                "SCAN for file I/O operations on user-supplied paths (path traversal)",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "deep_dive": Plan(
            description="Read all source modules to understand full implementation",
            steps=[
                "READ start_here files for orientation",
                "READ each source module in dependency order (imports first)",
                "READ tests to understand expected behavior",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each chunk, decide if more detail is needed",
            ],
            budget_bytes=32768,
            max_total_bytes=131072,
        ),
    },
)

NODE_TS_TOOL = Profile(
    name="node_ts_tool",
    detect_files=["package.json", "tsconfig.json"],
    entrypoint_patterns=[
        "src/index.ts",
        "src/main.ts",
        "src/cli.ts",
        "index.ts",
        "index.js",
    ],
    start_here_extras=["README.md", "package.json"],
    ignore_globs=[
        "node_modules/**",
        "dist/**",
        "build/**",
        ".git/**",
        "coverage/**",
        ".nyc_output/**",
        "*.tsbuildinfo",
        ".turbo/**",
    ],
    plans={
        "overview": Plan(
            description="Quick orientation",
            steps=[
                "READ README.md for project purpose",
                "READ package.json for scripts, dependencies, main/bin fields",
                "READ entrypoint file for module structure",
                "LIST src/ directory structure",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "package.json", "src/index.ts", "src/cli.ts"],
            max_total_bytes=32768,
        ),
        "debug": Plan(
            description="Find and fix a bug",
            steps=[
                "READ entrypoint file",
                "READ tsconfig.json for compilation settings",
                "SCAN src/ for error handling patterns (try/catch, throw)",
                "READ relevant test files",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "add_feature": Plan(
            description="Understand where to add new functionality",
            steps=[
                "READ README.md for project context",
                "READ entrypoint and trace imports for module graph",
                "LIST src/ for module layout",
                "READ existing tests for patterns",
            ],
            budget_bytes=12288,
            max_total_bytes=49152,
        ),
        "security_review": Plan(
            description="Identify security-sensitive code paths",
            steps=[
                "SCAN for child_process, eval, Function(), dynamic require/import",
                "CHECK for hardcoded secrets, tokens, or API keys",
                "REVIEW package.json dependencies for known vulnerabilities",
                "SCAN for file/network I/O with user-supplied input",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "deep_dive": Plan(
            description="Read all source modules to understand full implementation",
            steps=[
                "READ start_here files for orientation",
                "READ each source module in dependency order (imports first)",
                "READ tests to understand expected behavior",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each chunk, decide if more detail is needed",
            ],
            budget_bytes=32768,
            max_total_bytes=131072,
        ),
    },
)

MONOREPO = Profile(
    name="monorepo",
    detect_files=["pnpm-workspace.yaml", "lerna.json"],
    entrypoint_patterns=[],
    start_here_extras=["README.md"],
    ignore_globs=[
        "**/node_modules/**",
        "**/__pycache__/**",
        "**/dist/**",
        "**/build/**",
        ".git/**",
        "**/*.egg-info/**",
        "**/coverage/**",
        "**/.venv/**",
    ],
    plans={
        "overview": Plan(
            description="Understand the monorepo structure",
            steps=[
                "READ root README.md for project purpose",
                "READ workspace config (pnpm-workspace.yaml / package.json / lerna.json)",
                "LIST top-level packages/directories",
                "READ README.md in each package (first 3 by name)",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "pnpm-workspace.yaml", "lerna.json"],
            max_total_bytes=49152,
        ),
        "debug": Plan(
            description="Find and fix a bug across packages",
            steps=[
                "IDENTIFY which package owns the bug by listing packages",
                "READ that package's entrypoint and package.json/pyproject.toml",
                "TRACE cross-package dependencies via workspace config",
                "READ related tests",
            ],
            budget_bytes=16384,
            max_total_bytes=81920,
        ),
        "add_feature": Plan(
            description="Add functionality to the right package",
            steps=[
                "READ root README for architecture overview",
                "LIST packages to identify the right target",
                "READ target package entrypoint and structure",
                "CHECK for shared utilities or common packages",
            ],
            budget_bytes=12288,
            max_total_bytes=65536,
        ),
        "security_review": Plan(
            description="Security review across all packages",
            steps=[
                "LIST all packages and their dependency manifests",
                "SCAN each package for security-sensitive patterns",
                "REVIEW all dependency manifests for known vulnerabilities",
                "CHECK for shared secrets or credential handling",
            ],
            budget_bytes=16384,
            max_total_bytes=131072,
        ),
        "deep_dive": Plan(
            description="Read all packages to understand full monorepo implementation",
            steps=[
                "READ start_here files and workspace config for orientation",
                "LIST all packages and their entrypoints",
                "READ each package's primary source in dependency order",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each package, decide which to explore deeper",
            ],
            budget_bytes=32768,
            max_total_bytes=262144,
        ),
    },
)

RUST_CLI = Profile(
    name="rust_cli",
    detect_files=["Cargo.toml"],
    entrypoint_patterns=[
        "src/main.rs",
        "src/bin/*.rs",
        "src/lib.rs",
    ],
    start_here_extras=["README.md", "Cargo.toml"],
    ignore_globs=[
        "target/**",
        ".git/**",
        "**/*.rlib",
        "**/*.rmeta",
        "**/*.d",
    ],
    custom_roles=[
        CustomRole(
            name="bench",
            description="Rust benchmark files",
            patterns=["benches/**", "benches/*.rs"],
            confidence=0.85,
        ),
    ],
    plans={
        "overview": Plan(
            description="Quick orientation — what does this Rust crate do and how is it structured?",
            steps=[
                "READ README.md for project purpose and usage",
                "READ Cargo.toml for dependencies, features, and binary targets",
                "READ src/main.rs or src/lib.rs for crate entry point",
                "LIST src/ directory structure for module layout",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "Cargo.toml", "src/main.rs", "src/lib.rs"],
            max_total_bytes=32768,
        ),
        "debug": Plan(
            description="Find and fix a bug in the Rust crate",
            steps=[
                "READ src/main.rs or src/lib.rs for control flow",
                "LIST tests/ and src/ for test structure",
                "SCAN for unwrap(), expect(), panic! and error handling patterns",
                "CHECK Cargo.toml for dependency versions and features",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "add_feature": Plan(
            description="Understand where to add new functionality",
            steps=[
                "READ README.md for project context",
                "READ src/lib.rs or src/main.rs for module declarations (mod statements)",
                "LIST src/ modules to find related code",
                "READ tests/ for test patterns to follow",
            ],
            budget_bytes=12288,
            max_total_bytes=49152,
        ),
        "security_review": Plan(
            description="Identify security-sensitive code paths in Rust",
            steps=[
                "SCAN for unsafe blocks and raw pointer operations",
                "CHECK for std::process::Command, shell invocations",
                "REVIEW Cargo.toml for known-vulnerable dependencies",
                "SCAN for file I/O on user-supplied paths, network listeners",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "deep_dive": Plan(
            description="Read all source modules to understand full implementation",
            steps=[
                "READ start_here files for orientation",
                "READ each source module following mod declarations",
                "READ tests to understand expected behavior and edge cases",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each module, decide if more detail is needed",
            ],
            budget_bytes=32768,
            max_total_bytes=131072,
        ),
    },
)

GO_CLI = Profile(
    name="go_cli",
    detect_files=["go.mod"],
    entrypoint_patterns=[
        "main.go",
        "cmd/*/main.go",
    ],
    start_here_extras=["README.md", "go.mod"],
    ignore_globs=[
        ".git/**",
        "vendor/**",
        "**/testdata/**",
    ],
    custom_roles=[
        CustomRole(
            name="go_generate",
            description="Go generated code (via go:generate)",
            patterns=["**/*_gen.go", "**/*_generated.go", "**/zz_generated*.go"],
            confidence=0.85,
        ),
    ],
    plans={
        "overview": Plan(
            description="Quick orientation — what does this Go module do?",
            steps=[
                "READ README.md for project purpose and usage",
                "READ go.mod for module path and dependencies",
                "READ main.go or cmd/*/main.go for entry point",
                "LIST top-level packages for module layout",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "go.mod", "main.go"],
            max_total_bytes=32768,
        ),
        "debug": Plan(
            description="Find and fix a bug in the Go module",
            steps=[
                "READ main.go for control flow and flag parsing",
                "LIST *_test.go files to understand test structure",
                "SCAN for error handling patterns (if err != nil, log.Fatal)",
                "CHECK go.mod for dependency versions",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "add_feature": Plan(
            description="Understand where to add new functionality",
            steps=[
                "READ README.md for project context",
                "READ main.go and trace imports for package graph",
                "LIST packages to find related code",
                "READ existing *_test.go files for patterns",
            ],
            budget_bytes=12288,
            max_total_bytes=49152,
        ),
        "security_review": Plan(
            description="Identify security-sensitive code paths in Go",
            steps=[
                "SCAN for os/exec, net/http, crypto usage",
                "CHECK for hardcoded credentials or embedded secrets",
                "REVIEW go.mod dependencies for known CVEs",
                "SCAN for SQL queries, template rendering, file path handling",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "deep_dive": Plan(
            description="Read all packages to understand full implementation",
            steps=[
                "READ start_here files for orientation",
                "READ each package's primary files in import-order",
                "READ *_test.go files to understand expected behavior",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each package, decide if more detail is needed",
            ],
            budget_bytes=32768,
            max_total_bytes=131072,
        ),
    },
)

DOTNET_CLI = Profile(
    name="dotnet_cli",
    detect_files=["*.csproj", "*.sln", "Directory.Build.props"],
    entrypoint_patterns=[
        "Program.cs",
        "src/*/Program.cs",
        "Startup.cs",
        "src/*/Startup.cs",
    ],
    start_here_extras=["README.md"],
    ignore_globs=[
        "bin/**",
        "obj/**",
        "**/bin/**",
        "**/obj/**",
        ".git/**",
        ".vs/**",
        "packages/**",
        "**/*.nupkg",
        "**/*.user",
    ],
    custom_roles=[
        CustomRole(
            name="project_file",
            description=".NET project file (.csproj/.fsproj/.vbproj)",
            patterns=["*.csproj", "**/*.csproj", "*.fsproj", "**/*.fsproj", "*.vbproj", "**/*.vbproj"],
            confidence=0.90,
        ),
        CustomRole(
            name="solution_file",
            description="Visual Studio solution file",
            patterns=["*.sln", "**/*.sln"],
            confidence=0.90,
        ),
    ],
    plans={
        "overview": Plan(
            description="Quick orientation — what does this .NET project do?",
            steps=[
                "READ README.md for project purpose and usage",
                "READ *.csproj or *.sln for project structure and dependencies",
                "READ Program.cs for application entry point",
                "LIST src/ or project directories for module layout",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "Program.cs"],
            max_total_bytes=32768,
        ),
        "debug": Plan(
            description="Find and fix a bug in the .NET project",
            steps=[
                "READ Program.cs / Startup.cs for application pipeline",
                "LIST *Tests/ projects for test structure",
                "SCAN for exception handling patterns (try/catch, throw)",
                "CHECK *.csproj for package references and versions",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "add_feature": Plan(
            description="Understand where to add new functionality",
            steps=[
                "READ README.md for project context",
                "READ Program.cs and trace dependency injection registrations",
                "LIST Controllers/ or Services/ for existing patterns",
                "READ existing test projects for test patterns",
            ],
            budget_bytes=12288,
            max_total_bytes=49152,
        ),
        "security_review": Plan(
            description="Identify security-sensitive code paths in .NET",
            steps=[
                "SCAN for Process.Start, SQL commands, HttpClient usage",
                "CHECK for hardcoded connection strings or credentials",
                "REVIEW *.csproj package references for known vulnerabilities",
                "SCAN for [AllowAnonymous], CORS policies, authentication config",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "deep_dive": Plan(
            description="Read all source files to understand full implementation",
            steps=[
                "READ start_here files for orientation",
                "READ each namespace/folder in dependency order",
                "READ test projects to understand expected behavior",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each module, decide if more detail is needed",
            ],
            budget_bytes=32768,
            max_total_bytes=131072,
        ),
    },
)

JAVA_CLI = Profile(
    name="java_cli",
    detect_files=["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"],
    entrypoint_patterns=[
        "src/main/java/**/Main.java",
        "src/main/java/**/Application.java",
        "src/main/java/**/App.java",
    ],
    start_here_extras=["README.md"],
    ignore_globs=[
        "target/**",
        "build/**",
        ".gradle/**",
        ".git/**",
        "**/*.class",
        "**/*.jar",
        ".idea/**",
        "*.iml",
    ],
    custom_roles=[
        CustomRole(
            name="maven_config",
            description="Maven POM configuration",
            patterns=["pom.xml", "**/pom.xml"],
            confidence=0.90,
        ),
        CustomRole(
            name="gradle_config",
            description="Gradle build configuration",
            patterns=["build.gradle", "build.gradle.kts", "settings.gradle", "settings.gradle.kts"],
            confidence=0.90,
        ),
    ],
    plans={
        "overview": Plan(
            description="Quick orientation — what does this Java project do?",
            steps=[
                "READ README.md for project purpose and usage",
                "READ pom.xml or build.gradle for dependencies and build config",
                "READ main entry point class for application structure",
                "LIST src/main/java/ directory structure for package layout",
            ],
            budget_bytes=8192,
            stop_after=["README.md", "pom.xml", "build.gradle"],
            max_total_bytes=32768,
        ),
        "debug": Plan(
            description="Find and fix a bug in the Java project",
            steps=[
                "READ entry point class for control flow",
                "LIST src/test/ for test structure",
                "SCAN for exception handling patterns (try/catch, throws)",
                "CHECK dependency manifest for version conflicts",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "add_feature": Plan(
            description="Understand where to add new functionality",
            steps=[
                "READ README.md for project context",
                "READ entry point and trace Spring beans or service injection",
                "LIST packages under src/main/java/ for existing patterns",
                "READ existing tests for test patterns",
            ],
            budget_bytes=12288,
            max_total_bytes=49152,
        ),
        "security_review": Plan(
            description="Identify security-sensitive code paths in Java",
            steps=[
                "SCAN for Runtime.exec(), ProcessBuilder, SQL queries",
                "CHECK for hardcoded credentials, API keys in properties files",
                "REVIEW dependency manifest for known CVEs",
                "SCAN for deserialization, reflection, JNDI usage",
            ],
            budget_bytes=16384,
            max_total_bytes=65536,
        ),
        "deep_dive": Plan(
            description="Read all source files to understand full implementation",
            steps=[
                "READ start_here files for orientation",
                "READ each package in dependency order (follow imports)",
                "READ tests to understand expected behavior",
                "SUMMARIZE_THEN_CHOOSE_NEXT: after each package, decide if more detail is needed",
            ],
            budget_bytes=32768,
            max_total_bytes=131072,
        ),
    },
)

ALL_PROFILES: dict[str, Profile] = {
    "python_cli": PYTHON_CLI,
    "node_ts_tool": NODE_TS_TOOL,
    "monorepo": MONOREPO,
    "rust_cli": RUST_CLI,
    "go_cli": GO_CLI,
    "dotnet_cli": DOTNET_CLI,
    "java_cli": JAVA_CLI,
}

DEFAULT_PROFILE = PYTHON_CLI
