---
title: Tool Reference
description: All 17 tools across five categories.
sidebar:
  order: 2
---

MCP File Forge provides 17 tools organized into five categories. All tools enforce sandbox restrictions -- operations outside allowed paths are rejected.

## Reading

### read_file

Read the contents of a single file.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Absolute or relative path to the file |
| `encoding` | string | `utf-8` | File encoding |
| `start_line` | number | _(none)_ | Start line (1-indexed, inclusive) |
| `end_line` | number | _(none)_ | End line (inclusive) |
| `max_size_kb` | number | `10240` | Maximum file size in KB before rejection |

Line ranges are optional. When `start_line` or `end_line` is provided, only the specified range of lines is returned.

### read_directory

List entries in a directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to the directory |
| `recursive` | boolean | `false` | Include subdirectories |
| `max_depth` | number | `5` | Maximum recursion depth |
| `include_hidden` | boolean | `false` | Include hidden files (dotfiles) |
| `pattern` | string | _(none)_ | Glob pattern to filter entry names |

Returns an array of entries with `name`, `path`, `isFile`, `isDirectory`, and `size` (for files).

### read_multiple

Read several files in a single call.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `paths` | string[] | _(required)_ | Array of file paths to read |
| `encoding` | string | `utf-8` | File encoding for all files |
| `fail_on_error` | boolean | `false` | Stop on first error instead of collecting partial results |

Returns an array of results, each with `path`, `success`, and either `content` or `error`.

## Writing

All writing tools are disabled when `MCP_FILE_FORGE_READ_ONLY=true`.

### write_file

Write content to a file.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to write to |
| `content` | string | _(required)_ | Content to write |
| `encoding` | string | `utf-8` | File encoding |
| `create_dirs` | boolean | `true` | Create parent directories if they do not exist |
| `overwrite` | boolean | `true` | Overwrite existing file |
| `backup` | boolean | `false` | Create a `.bak` copy before overwriting |

Returns the absolute path and bytes written on success.

### create_directory

Create a directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to create |
| `recursive` | boolean | `true` | Create parent directories |

Succeeds silently if the directory already exists.

### copy_file

Copy a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | _(required)_ | Source path |
| `destination` | string | _(required)_ | Destination path |
| `overwrite` | boolean | `false` | Overwrite if destination exists |
| `recursive` | boolean | `true` | Copy directories recursively |

When copying a directory with `recursive: false`, the operation fails with `INVALID_PATH`.

### move_file

Move or rename a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | string | _(required)_ | Source path |
| `destination` | string | _(required)_ | Destination path |
| `overwrite` | boolean | `false` | Overwrite if destination exists |

Parent directories of the destination are created automatically.

### delete_file

Delete a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to delete |
| `recursive` | boolean | `false` | Delete directories recursively |
| `force` | boolean | `false` | Ignore errors (returns success even on failure) |

Non-recursive delete on a non-empty directory fails with `DIRECTORY_NOT_EMPTY`.

## Search

### glob_search

Find files matching a glob pattern.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pattern` | string | _(required)_ | Glob pattern (e.g., `**/*.ts`) |
| `base_path` | string | cwd | Base directory for the search |
| `max_results` | number | `1000` | Maximum results to return |
| `include_dirs` | boolean | `false` | Include directories in results |

Returns match count, whether results were truncated, and an array of matched files with `path`, `name`, `isFile`, `isDirectory`, and `size`.

### grep_search

Search file contents using a regular expression.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pattern` | string | _(required)_ | Regex pattern to search for |
| `path` | string | cwd | File or directory to search |
| `glob` | string | `**/*` | File pattern filter (e.g., `*.ts`) |
| `case_sensitive` | boolean | `true` | Case-sensitive matching |
| `max_results` | number | `100` | Maximum matches to return |
| `context_lines` | number | `0` | Lines of context before and after each match |

Returns each match with `file`, `line`, `column`, `match` (the matched line), and optional `context` with `before` and `after` arrays.

### find_by_content

Find files containing specific literal text. This is a simplified wrapper around `grep_search` that escapes regex special characters for you.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | _(required)_ | Literal text to search for |
| `path` | string | cwd | Directory to search |
| `file_pattern` | string | _(none)_ | File pattern filter |
| `max_results` | number | `100` | Maximum results |

Always performs a case-sensitive search with no context lines.

## Metadata

### file_stat

Get detailed statistics for a file or directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to file or directory |

Returns `path`, `name`, `size`, `sizeFormatted`, `isFile`, `isDirectory`, `isSymlink`, `created`, `modified`, and `accessed` (ISO 8601 timestamps).

### file_exists

Check whether a file or directory exists.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to check |
| `type` | `file` / `directory` / `any` | `any` | Type to check for |

When `type` is `file` and the path is a directory (or vice versa), returns `exists: false` with `reason` and `actualType`.

### get_disk_usage

Calculate size breakdown for a directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | _(required)_ | Path to directory |
| `max_depth` | number | `1` | Depth for size breakdown |

Returns `totalSize`, `totalSizeFormatted`, `fileCount`, `directoryCount`, and a `breakdown` array sorted by size descending.

### compare_files

Compare two files or directories by metadata.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path1` | string | _(required)_ | First path |
| `path2` | string | _(required)_ | Second path |

Returns `sameType`, `sameSize`, individual stats for each path, `newerFile` (which was modified more recently), and `sizeDifference`.

## Scaffolding

### scaffold_project

Create a project from a template directory.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `template` | string | _(required)_ | Template name or path |
| `destination` | string | _(required)_ | Destination directory |
| `variables` | Record | _(none)_ | Key-value pairs for template substitution |
| `overwrite` | boolean | `false` | Overwrite existing files |

Three automatic variables are always available: `PROJECT_NAME`, `CURRENT_YEAR`, `CURRENT_DATE`. See the [Templates](/mcp-file-forge/handbook/templates/) page for details.

### list_templates

List available project templates from all configured template paths.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | _(none)_ | Filter by template category |

Returns the searched paths, template count, and an array of templates with `name`, `path`, `description`, `category`, and `variables`.
