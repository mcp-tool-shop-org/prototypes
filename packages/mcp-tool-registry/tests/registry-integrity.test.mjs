// tests/registry-integrity.test.mjs
// Structured tests for registry data integrity using node:test
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")

const registry = JSON.parse(
  readFileSync(join(rootDir, "registry.json"), "utf-8")
)
const pkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"))
const tools = registry.tools || []

describe("registry.json structure", () => {
  it("has required top-level fields", () => {
    assert.ok(registry.schema_version, "schema_version required")
    assert.ok(Array.isArray(registry.tools), "tools must be an array")
  })

  it("has at least one tool", () => {
    assert.ok(tools.length > 0, "registry must contain tools")
  })

  it("schema_version is a valid semver-like string", () => {
    assert.match(registry.schema_version, /^\d+\.\d+/)
  })
})

describe("tool entries", () => {
  it("all tools have required fields", () => {
    for (const tool of tools) {
      assert.ok(tool.id, `tool missing id`)
      assert.ok(tool.name, `${tool.id} missing name`)
      assert.ok(tool.description, `${tool.id} missing description`)
      assert.ok(tool.repo, `${tool.id} missing repo`)
      assert.ok(tool.install, `${tool.id} missing install`)
      assert.ok(Array.isArray(tool.tags), `${tool.id} missing tags array`)
    }
  })

  it("all tool IDs are unique", () => {
    const ids = tools.map(t => t.id)
    const unique = new Set(ids)
    assert.equal(ids.length, unique.size, "duplicate IDs found")
  })

  it("all tool IDs are lower-kebab-case", () => {
    const idRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
    for (const tool of tools) {
      assert.ok(
        idRegex.test(tool.id),
        `${tool.id} is not valid lower-kebab-case`
      )
    }
  })

  it("all repo URLs use HTTPS", () => {
    for (const tool of tools) {
      assert.ok(
        tool.repo.startsWith("https://"),
        `${tool.id} repo not HTTPS: ${tool.repo}`
      )
    }
  })

  it("all install URLs use HTTPS", () => {
    for (const tool of tools) {
      if (tool.install && tool.install.url) {
        assert.ok(
          tool.install.url.startsWith("https://"),
          `${tool.id} install URL not HTTPS`
        )
      }
    }
  })

  it("descriptions are at least 10 characters", () => {
    for (const tool of tools) {
      assert.ok(
        tool.description.length >= 10,
        `${tool.id} description too short (${tool.description.length} chars)`
      )
    }
  })

  it("no descriptions contain TODO", () => {
    for (const tool of tools) {
      assert.ok(
        !tool.description.toUpperCase().includes("TODO"),
        `${tool.id} description contains TODO`
      )
    }
  })

  it("tags are lowercase kebab-case", () => {
    for (const tool of tools) {
      for (const tag of tool.tags) {
        assert.ok(/^[a-z0-9-]+$/.test(tag), `${tool.id} tag "${tag}" invalid`)
      }
    }
  })

  it("deprecated tools have required deprecation fields", () => {
    for (const tool of tools) {
      if (tool.deprecated === true) {
        assert.ok(
          tool.deprecation_reason,
          `${tool.id} deprecated without reason`
        )
      }
    }
  })
})

describe("bundle integrity", () => {
  it("all bundle exports reference existing files", () => {
    for (const [key, relativePath] of Object.entries(pkg.exports)) {
      if (typeof relativePath === "string") {
        const fullPath = join(rootDir, relativePath)
        assert.doesNotThrow(
          () => readFileSync(fullPath),
          `export ${key} -> ${relativePath} not found`
        )
      }
    }
  })

  it("all bundle tool references exist in registry", () => {
    const toolIds = new Set(tools.map(t => t.id))
    for (const [key, relativePath] of Object.entries(pkg.exports)) {
      if (key.startsWith("./bundles/") && typeof relativePath === "string") {
        const bundle = JSON.parse(
          readFileSync(join(rootDir, relativePath), "utf-8")
        )
        if (Array.isArray(bundle.tools)) {
          for (const refId of bundle.tools) {
            assert.ok(
              toolIds.has(refId),
              `bundle ${key} references unknown tool: ${refId}`
            )
          }
        }
      }
    }
  })
})

describe("version alignment", () => {
  it("package.json version is semver", () => {
    assert.match(pkg.version, /^\d+\.\d+\.\d+/)
  })

  it("CHANGELOG mentions current version", () => {
    const changelog = readFileSync(join(rootDir, "CHANGELOG.md"), "utf-8")
    assert.ok(
      changelog.includes(`[${pkg.version}]`),
      `CHANGELOG missing entry for v${pkg.version}`
    )
  })
})
