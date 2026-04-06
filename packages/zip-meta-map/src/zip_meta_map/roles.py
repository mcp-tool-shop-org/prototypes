"""Role assignment for scanned files, with confidence scoring and reasons."""

from __future__ import annotations

from dataclasses import dataclass
from fnmatch import fnmatch
from pathlib import PurePosixPath

from zip_meta_map.profiles import Profile


@dataclass(frozen=True)
class RoleAssignment:
    role: str
    confidence: float
    reason: str


# ── Lockfile detection (highest specificity) ──

_LOCKFILES: set[str] = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "Pipfile.lock",
    "Cargo.lock",
    "composer.lock",
    "Gemfile.lock",
    "go.sum",
    "flake.lock",
    "bun.lockb",
    "uv.lock",
}

# ── CI path patterns ──

_CI_PATTERNS: list[str] = [
    ".github/workflows/**",
    ".github/actions/**",
    ".circleci/**",
    ".gitlab-ci.yml",
    ".travis.yml",
    "Jenkinsfile",
    "azure-pipelines.yml",
    ".buildkite/**",
]

# ── Generated / vendor directory patterns ──

_GENERATED_DIR_PATTERNS: list[str] = [
    "dist/**",
    "build/**",
    "out/**",
    "target/**",
    "_build/**",
    ".next/**",
    ".nuxt/**",
    ".output/**",
]

_VENDOR_DIR_PATTERNS: list[str] = [
    "vendor/**",
    "third_party/**",
    "third-party/**",
    "extern/**",
    "external/**",
]

# ── Fixture patterns ──

_FIXTURE_PATTERNS: list[str] = [
    "tests/fixtures/**",
    "test/fixtures/**",
    "tests/data/**",
    "test/data/**",
    "tests/testdata/**",
    "test/testdata/**",
    "**/fixtures/**",
    "**/__fixtures__/**",
]

# ── Test patterns ──

_TEST_PATTERNS: list[str] = [
    "tests/**",
    "test/**",
    "**/test_*.py",
    "**/*_test.py",
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.test.tsx",
    "**/*.test.jsx",
    "**/*.spec.ts",
    "**/*.spec.js",
    "**/*.spec.tsx",
    "**/*.spec.jsx",
    "**/conftest.py",
    "**/*_test.go",
    "**/*_test.rs",
]

# ── Script patterns ──

_SCRIPT_PATTERNS: list[str] = [
    "scripts/**",
    "script/**",
    "bin/**",
    "tools/**",
    "hack/**",
]

# ── Doc patterns ──

_DOC_API_PATTERNS: list[str] = [
    "docs/api/**",
    "doc/api/**",
    "api-docs/**",
    "reference/**",
]

_DOC_ARCH_NAMES: set[str] = {
    "ARCHITECTURE.md",
    "DESIGN.md",
    "ADR.md",
}

_DOC_ARCH_PATTERNS: list[str] = [
    "docs/adr/**",
    "doc/adr/**",
    "docs/architecture/**",
    "docs/design/**",
    "adr/**",
]

# ── Filename → role (high priority) ──

_NAME_ROLES: dict[str, tuple[str, float, str]] = {
    "README.md": ("doc", 0.95, "README is primary documentation"),
    "README.rst": ("doc", 0.95, "README is primary documentation"),
    "README.txt": ("doc", 0.95, "README is primary documentation"),
    "LICENSE": ("doc", 0.90, "license file"),
    "LICENSE.md": ("doc", 0.90, "license file"),
    "LICENSE.txt": ("doc", 0.90, "license file"),
    "CHANGELOG.md": ("doc", 0.90, "changelog"),
    "CHANGES.md": ("doc", 0.90, "changelog"),
    "CONTRIBUTING.md": ("doc", 0.90, "contribution guide"),
    "CODE_OF_CONDUCT.md": ("doc", 0.85, "code of conduct"),
    "SECURITY.md": ("doc", 0.85, "security policy"),
    "pyproject.toml": ("config", 0.95, "Python project configuration"),
    "setup.py": ("config", 0.90, "Python setup script"),
    "setup.cfg": ("config", 0.90, "Python setup config"),
    "package.json": ("config", 0.95, "Node.js project configuration"),
    "tsconfig.json": ("config", 0.90, "TypeScript configuration"),
    ".gitignore": ("config", 0.80, "git ignore rules"),
    ".editorconfig": ("config", 0.80, "editor configuration"),
    ".prettierrc": ("config", 0.80, "Prettier configuration"),
    ".eslintrc.json": ("config", 0.80, "ESLint configuration"),
    ".eslintrc.js": ("config", 0.80, "ESLint configuration"),
    "eslint.config.js": ("config", 0.80, "ESLint configuration"),
    "eslint.config.mjs": ("config", 0.80, "ESLint configuration"),
    "ruff.toml": ("config", 0.80, "Ruff linter configuration"),
    ".flake8": ("config", 0.80, "Flake8 configuration"),
    "mypy.ini": ("config", 0.80, "mypy configuration"),
    "pnpm-workspace.yaml": ("config", 0.90, "pnpm workspace configuration"),
    "lerna.json": ("config", 0.90, "Lerna monorepo configuration"),
    "nx.json": ("config", 0.90, "Nx workspace configuration"),
    "turbo.json": ("config", 0.90, "Turborepo configuration"),
    "Makefile": ("build", 0.90, "Makefile build script"),
    "Dockerfile": ("build", 0.85, "Docker build definition"),
    "docker-compose.yml": ("build", 0.85, "Docker Compose definition"),
    "docker-compose.yaml": ("build", 0.85, "Docker Compose definition"),
    "Justfile": ("build", 0.85, "Just command runner"),
    "Taskfile.yml": ("build", 0.85, "Task runner definition"),
    "Procfile": ("build", 0.80, "process definition"),
    "tox.ini": ("build", 0.80, "tox test runner configuration"),
    "noxfile.py": ("build", 0.80, "nox test runner configuration"),
    # Rust
    "Cargo.toml": ("config", 0.95, "Rust crate configuration"),
    "build.rs": ("build", 0.85, "Rust build script"),
    "clippy.toml": ("config", 0.80, "Clippy linter configuration"),
    "rustfmt.toml": ("config", 0.80, "rustfmt configuration"),
    ".rustfmt.toml": ("config", 0.80, "rustfmt configuration"),
    # Go
    "go.mod": ("config", 0.95, "Go module definition"),
    # .NET
    "Directory.Build.props": ("config", 0.85, ".NET directory build props"),
    "Directory.Build.targets": ("config", 0.85, ".NET directory build targets"),
    "nuget.config": ("config", 0.80, "NuGet package configuration"),
    "global.json": ("config", 0.85, ".NET SDK version pinning"),
    # Java
    "pom.xml": ("config", 0.95, "Maven project configuration"),
    "build.gradle": ("build", 0.90, "Gradle build script"),
    "build.gradle.kts": ("build", 0.90, "Gradle Kotlin build script"),
    "settings.gradle": ("config", 0.90, "Gradle settings"),
    "settings.gradle.kts": ("config", 0.90, "Gradle Kotlin settings"),
    "gradlew": ("build", 0.80, "Gradle wrapper script"),
    "mvnw": ("build", 0.80, "Maven wrapper script"),
}

# ── Extension → role (fallback) ──

_EXT_ROLES: dict[str, tuple[str, float, str]] = {
    ".md": ("doc", 0.60, "markdown file"),
    ".rst": ("doc", 0.60, "reStructuredText file"),
    ".txt": ("doc", 0.50, "text file (could be doc or data)"),
    ".toml": ("config", 0.55, "TOML file (likely config)"),
    ".cfg": ("config", 0.55, "config file"),
    ".ini": ("config", 0.55, "INI config file"),
    ".env": ("config", 0.70, "environment variables"),
    ".env.example": ("config", 0.70, "environment template"),
}

# ── Asset extensions ──

_ASSET_EXTS: set[str] = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".webp",
    ".avif",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".otf",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".html",
    ".htm",
    ".hbs",
    ".ejs",
    ".pug",
    ".mp3",
    ".mp4",
    ".wav",
    ".ogg",
    ".webm",
}

# ── Data extensions ──

_DATA_EXTS: set[str] = {
    ".csv",
    ".tsv",
    ".parquet",
    ".sqlite",
    ".db",
    ".sql",
    ".xml",
    ".ndjson",
    ".jsonl",
}

# ── Source code extensions ──

_SOURCE_EXTS: set[str] = {
    ".py",
    ".ts",
    ".js",
    ".tsx",
    ".jsx",
    ".rs",
    ".go",
    ".java",
    ".cs",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".rb",
    ".php",
    ".swift",
    ".kt",
    ".scala",
    ".clj",
    ".ex",
    ".exs",
    ".zig",
    ".nim",
    ".lua",
    ".sh",
    ".bash",
    ".zsh",
    ".ps1",
    ".psm1",
}

# ── Schema extensions / patterns ──

_SCHEMA_PATTERNS: list[str] = [
    "**/*.schema.json",
    "**/*.schema.yaml",
    "**/*.schema.yml",
    "**/schema/**",
    "**/*.proto",
    "**/*.graphql",
    "**/*.gql",
    "**/openapi.json",
    "**/openapi.yaml",
    "**/openapi.yml",
    "**/swagger.json",
    "**/swagger.yaml",
]

# ── Public API detection ──

_PUBLIC_API_NAMES: set[str] = {
    "__init__.py",
    "mod.rs",
    "index.ts",
    "index.js",
    "index.tsx",
    "index.jsx",
}

# ── Internal module detection ──

_INTERNAL_INDICATORS: list[str] = [
    "_internal/**",
    "**/_*.py",
    "**/internal/**",
    "**/private/**",
]


def _matches_any(path: str, patterns: list[str]) -> bool:
    """Check if path matches any of the given glob patterns."""
    for pattern in patterns:
        if fnmatch(path, pattern):
            return True
    return False


def assign_role(path: str, profile: Profile) -> RoleAssignment:
    """Assign a role to a file path based on the profile and heuristics.

    Returns a RoleAssignment with role, confidence (0.0-1.0), and reason.
    The assignment is deterministic: same inputs always produce same outputs.
    """
    posix = PurePosixPath(path)
    name = posix.name
    ext = posix.suffix.lower()

    # ── Priority 1: Profile entrypoints (highest confidence) ──
    for pattern in profile.entrypoint_patterns:
        if fnmatch(path, pattern):
            return RoleAssignment("entrypoint", 0.95, f"matches profile entrypoint pattern '{pattern}'")

    # ── Priority 2: Lockfiles (unambiguous) ──
    if name in _LOCKFILES:
        return RoleAssignment("lockfile", 0.95, f"'{name}' is a known lock file")

    # ── Priority 3: CI pipelines ──
    if _matches_any(path, _CI_PATTERNS):
        return RoleAssignment("ci", 0.90, "CI/CD pipeline definition")

    # ── Priority 4: Filename-based roles ──
    if name in _NAME_ROLES:
        role, conf, reason = _NAME_ROLES[name]
        return RoleAssignment(role, conf, reason)

    # ── Priority 5: Generated / vendor directories ──
    if _matches_any(path, _GENERATED_DIR_PATTERNS):
        return RoleAssignment("generated", 0.85, "file in generated/build output directory")

    if _matches_any(path, _VENDOR_DIR_PATTERNS):
        return RoleAssignment("vendor", 0.85, "file in vendored third-party directory")

    # ── Priority 6: Test fixtures (before tests, more specific) ──
    if _matches_any(path, _FIXTURE_PATTERNS):
        return RoleAssignment("fixture", 0.85, "test fixture or sample data")

    # ── Priority 7: Tests ──
    if _matches_any(path, _TEST_PATTERNS):
        return RoleAssignment("test", 0.85, "test file")

    # ── Priority 8: Schema files ──
    if _matches_any(path, _SCHEMA_PATTERNS):
        return RoleAssignment("schema", 0.85, "schema definition")

    # ── Priority 9: Architecture / design docs ──
    if name in _DOC_ARCH_NAMES:
        return RoleAssignment("doc_architecture", 0.90, f"'{name}' is an architecture document")

    if _matches_any(path, _DOC_ARCH_PATTERNS):
        return RoleAssignment("doc_architecture", 0.80, "file in architecture docs directory")

    # ── Priority 10: API docs ──
    if _matches_any(path, _DOC_API_PATTERNS):
        return RoleAssignment("doc_api", 0.80, "file in API documentation directory")

    # ── Priority 11: Scripts ──
    if _matches_any(path, _SCRIPT_PATTERNS):
        return RoleAssignment("script", 0.75, "file in scripts/tools directory")

    # ── Priority 12: Public API modules ──
    if name in _PUBLIC_API_NAMES and ext in _SOURCE_EXTS:
        # Only if it's in a src-like directory (not root-level)
        if len(posix.parts) >= 2:
            return RoleAssignment("public_api", 0.70, f"'{name}' is typically a public API surface")

    # ── Priority 13: Internal modules ──
    if _matches_any(path, _INTERNAL_INDICATORS):
        return RoleAssignment("internal", 0.70, "internal/private module")

    # ── Priority 14: Custom roles from profile ──
    for custom in profile.custom_roles:
        if _matches_any(path, custom.patterns):
            return RoleAssignment(custom.name, custom.confidence, f"custom role '{custom.name}' via pattern match")

    # ── Priority 15: Extension-based roles (lower confidence) ──
    if ext in _EXT_ROLES:
        role, conf, reason = _EXT_ROLES[ext]
        return RoleAssignment(role, conf, reason)

    # ── Priority 15: Asset files ──
    if ext in _ASSET_EXTS:
        return RoleAssignment("asset", 0.80, f"'{ext}' is a static asset extension")

    # ── Priority 16: Data files ──
    if ext in _DATA_EXTS:
        return RoleAssignment("data", 0.75, f"'{ext}' is a data file extension")

    # ── Priority 17: Source code (by extension) ──
    if ext in _SOURCE_EXTS:
        return RoleAssignment("source", 0.60, f"source code ('{ext}' extension)")

    # ── Priority 18: JSON/YAML without stronger signal ──
    if ext in {".json", ".yaml", ".yml"}:
        return RoleAssignment("data", 0.50, f"'{ext}' file without stronger classification signal")

    # ── Fallback: unknown ──
    return RoleAssignment("unknown", 0.30, f"no heuristic matched for '{name}'")
