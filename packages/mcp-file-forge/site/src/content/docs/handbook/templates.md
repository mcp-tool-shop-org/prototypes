---
title: Templates
description: Project scaffolding with variable substitution.
sidebar:
  order: 5
---

MCP File Forge includes a template engine for project scaffolding. Templates let AI agents create entire project structures with variable substitution.

## How templates work

A template is a directory containing files with substitution markers. When `scaffold_project` runs:

1. The template directory is located by name (searched in template paths) or by absolute/relative path
2. The directory is copied to the destination
3. `{{var}}` and `${var}` markers in file contents are replaced with provided values
4. `__var__` markers in file and directory names are renamed
5. `template.json` (if present) is not copied to the output

## Using templates

### List available templates

```
list_templates({ category: "node" })
```

Returns all templates found in configured template paths. Filter by `category` to narrow results.

### Scaffold a project

```
scaffold_project({
  template: "node-cli",
  destination: "C:/Projects/my-tool",
  variables: {
    name: "my-tool",
    description: "A helpful CLI",
    author: "Your Name"
  }
})
```

The `template` parameter accepts a template name (searched in template paths) or an absolute/relative path to a template directory.

If the destination directory exists and is not empty, the operation fails unless `overwrite: true` is set.

## Automatic variables

Three variables are injected automatically into every scaffold operation. You can override them by providing your own values.

| Variable | Value |
|----------|-------|
| `PROJECT_NAME` | Base name of the destination directory |
| `CURRENT_YEAR` | Four-digit year at scaffold time (e.g., `2026`) |
| `CURRENT_DATE` | ISO date at scaffold time (e.g., `2026-03-26`) |

## Template paths

Templates are loaded from directories configured via:
- `MCP_FILE_FORGE_TEMPLATE_PATHS` environment variable (comma-separated)
- `templates.paths` in the config file
- Default: `./templates` relative to the working directory, plus `~/.mcp-file-forge/templates` in the user home directory

Both locations are searched in order. The first match wins.

## Writing templates

### Directory structure

Create a directory with your project structure. Add a `template.json` file at the root for metadata (optional but recommended).

### template.json

```json
{
  "name": "node-cli",
  "description": "Node.js CLI application template",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "node",
  "variables": [
    {
      "name": "name",
      "description": "Project name",
      "required": true
    },
    {
      "name": "description",
      "description": "Project description",
      "default": "A new project"
    },
    {
      "name": "author",
      "description": "Author name",
      "required": false
    }
  ]
}
```

The `variables` array documents what the template expects. Each entry can have `name`, `description`, `default`, and `required` fields. The `category` field is used by `list_templates` filtering.

### Substitution markers

**File contents:** Use `{{name}}` or `${name}` in any text file. Both syntaxes are supported and can be mixed.

**File and directory names:** Use `__name__` in the file or directory name. For example, a template file named `__name__/package.json` containing `"name": "{{name}}"` would create `my-tool/package.json` with `"name": "my-tool"` when scaffolded with `variables: { name: "my-tool" }`.

### Example template layout

```
my-template/
  template.json
  __name__/
    package.json        (contains {{name}}, {{description}})
    src/
      index.ts          (contains {{name}})
    README.md           (contains {{name}}, {{author}}, {{CURRENT_YEAR}})
```
