---
title: Tools Reference
description: Complete reference for all 9 brain-dev MCP tools — analysis, generation, security, and utility.
sidebar:
  order: 2
---

brain-dev exposes 9 tools organized into four categories. Each tool is callable via the MCP protocol from any compatible client.

## Analysis tools

### coverage_analyze

Compare observed behavior patterns against test coverage to surface the gaps that matter most. Returns a list of coverage gaps sorted by support (frequency), each with a priority level and suggested test name.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `patterns` | array of objects | yes | Observed patterns from a context engine. Each object has `sequence` (array of strings), `support` (number), and `occurrence_count` (integer). |
| `test_patterns` | array of string arrays | no | Patterns already covered by existing tests. |
| `min_support` | number | no | Minimum support threshold for reporting a gap. Default: `0.05`. |

**Response fields:** `total_flows`, `covered_flows`, `coverage_percentage`, `gaps_found`, `gaps` (array of gap objects with `gap_id`, `pattern`, `support`, `priority`, `suggested_test`, `suggested_file`, `description`).

### behavior_missing

Find user behaviors observed in production that are not handled in code. Compares observed event patterns against handler functions found in your codebase.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `patterns` | array of objects | yes | Observed behavior patterns. Each object has `sequence` (array of strings) and `occurrence_count` (integer). |
| `code_symbols` | array of objects | no | Code symbols with `name` fields. The analyzer looks for handler patterns (`handle_*`, `on_*`, `process_*`). |
| `min_count` | integer | no | Minimum occurrence count to consider a pattern. Default: `5`. |

**Response fields:** `missing_behaviors` (array with `behavior_id`, `pattern`, `observed_count`, `description`, `suggested_action`, `affected_files`), `total_found`.

### refactor_suggest

Spot complexity hotspots, duplicated logic, and naming inconsistencies. Analyzes code symbols for refactoring opportunities.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbols` | array of objects | yes | Code symbols to analyze. Each object should include `name`, `file_path`, `line`, and `source_code`. |
| `patterns` | array of objects | no | Usage patterns for duplication detection. |
| `analysis_type` | string | no | Type of analysis: `complexity`, `duplication`, `naming`, or `all`. Default: `all`. |

**Analysis details:**
- **complexity** -- flags functions with more than 5 control flow branches (`if`, `for`, `while`, `elif`, `except`).
- **duplication** -- groups functions by base name similarity and flags sets of 3 or more.
- **naming** -- flags single-letter variable names and names longer than 50 characters.

**Response fields:** `suggestions` (array with `suggestion_id`, `type`, `location`, `reason`, `confidence`, `code_before`, `code_after`), `total_found`.

### ux_insights

Extract UX signals from usage patterns -- dropoff points, error clusters, and behavior anomalies.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `patterns` | array of objects | yes | Behavior patterns with `sequence` (array of strings) and `occurrence_count` (integer). |
| `flow_type` | string | no | Type of flow being analyzed (e.g., `search`, `checkout`, `onboarding`). Default: `general`. |
| `metric` | string | no | Metric to focus on: `dropoff`, `error_rate`, or `all`. Default: `all`. |

**Analysis details:**
- **dropoff** -- identifies steps where more than 50% of users stop continuing, by comparing prefix occurrence counts.
- **error_rate** -- finds patterns containing error or failure events that occur more than 5 times.

**Response fields:** `insights` (array with `insight_id`, `finding`, `supporting_patterns`, `confidence`, `suggestion`, `metric`), `total_found`, `flow_type`, `metric`.

## Generation tools

### tests_generate

Generate test skeleton suggestions for a specific coverage gap. Returns a test stub in the chosen framework and style.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `gap` | object | yes | A coverage gap object with `pattern` (array of strings), `support` (number), and optionally `description`, `gap_id`, `suggested_test`, `suggested_file`. |
| `framework` | string | no | Test framework: `pytest`, `jest`, or `go`. Default: `pytest`. |
| `style` | string | no | Test style: `unit`, `integration`, or `e2e`. Default: `unit`. |

**Response fields:** `test_name`, `test_file`, `test_code`, `covers_pattern`, `framework`, `style`.

### smart_tests_generate

AST-based pytest generation with proper mocks, fixtures, and imports. Reads the source file, parses its AST, detects dependencies that need mocking, and produces a complete test file that compiles.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `file_path` | string | yes | Absolute path to the Python source file to generate tests for. Must be a `.py` file. |

**What the generator produces:**
- Import block with `pytest`, `unittest.mock`, and the module under test.
- Fixtures for each detected external dependency (database drivers, HTTP libraries, file I/O, etc.).
- A test class per source class, with a fixture for the class instance.
- Individual test methods for each public method and function.
- Edge case tests for `Optional` parameters.
- Error tests for functions that raise exceptions.
- Type-aware mock values (strings get `"test_value"`, ints get `42`, paths get `Path("/tmp/test")`, etc.).

**Example:**

```python
result = await client.call_tool(
    "smart_tests_generate",
    { "file_path": "/path/to/module.py" }
)
# result["test_code"] contains a complete pytest file
# result["lines"] shows the line count
# result["file_name"] shows the source file name
```

**Response fields:** `success`, `file_name`, `test_code`, `lines` (on success) or `error`, `success` (on failure).

### docs_generate

Find missing docstrings and generate templated documentation stubs for undocumented code symbols.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbols` | array of objects | yes | Code symbols to analyze. Each object should include `name`, `symbol_type` (`function` or `class`), `docstring` (empty string if missing), `file_path`, and `line`. |
| `doc_style` | string | no | Documentation style: `google`, `numpy`, or `sphinx`. Default: `google`. |

**Behavior:** Skips private symbols (names starting with `_`) except `__init__`. Flags missing docstrings with high confidence (0.9) and incomplete docstrings (missing Returns section, or very short descriptions) with lower confidence (0.7).

**Response fields:** `suggestions` (array with `suggestion_id`, `symbol_name`, `symbol_type`, `location`, `doc_type`, `suggested_doc`, `confidence`), `total_found`, `doc_style`.

## Security tools

### security_audit

Scan code for OWASP-style vulnerabilities with CWE references. Detects SQL injection, command injection, hardcoded secrets, path traversal, insecure crypto, and insecure deserialization.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symbols` | array of objects | yes | Code symbols to audit. Each object should include `name`, `file_path`, `line`, and `source_code`. |
| `severity_threshold` | string | no | Minimum severity to report: `low`, `medium`, `high`, or `critical`. Default: `low`. |

**Example:**

```python
result = await client.call_tool("security_audit", {
    "symbols": [{
        "name": "execute_query",
        "file_path": "db.py",
        "line": 10,
        "source_code": "cursor.execute(f\"SELECT * FROM users WHERE id={user_id}\")"
    }],
    "severity_threshold": "medium"
})
```

**Response fields:** `issues` (array with `issue_id`, `severity`, `category`, `location`, `description`, `recommendation`, `confidence`, `cwe_id`), `total_found`, `severity_counts`, `severity_threshold`.

See [Security Patterns](/brain-dev/handbook/security-patterns/) for the full list of vulnerability classes detected.

## Utility tools

### brain_stats

Return server statistics and configuration. Useful for verifying the server is running and checking current settings.

**Parameters:** none

**Response fields:** `server_name`, `server_version`, `min_gap_support`, `min_confidence`, `max_suggestions`, `default_test_framework`, `tools_available`.

## Tool summary

| Tool | Category | Description |
|------|----------|-------------|
| `coverage_analyze` | Analysis | Compare patterns to test coverage, find gaps |
| `behavior_missing` | Analysis | Find user behaviors not handled in code |
| `refactor_suggest` | Analysis | Complexity, duplication, and naming suggestions |
| `ux_insights` | Analysis | Extract UX signals from behavior patterns |
| `tests_generate` | Generation | Generate test skeletons for coverage gaps |
| `smart_tests_generate` | Generation | AST-based pytest with mocks and fixtures |
| `docs_generate` | Generation | Documentation templates for undocumented code |
| `security_audit` | Security | Scan for OWASP-style vulnerabilities |
| `brain_stats` | Utility | Server statistics and configuration |
