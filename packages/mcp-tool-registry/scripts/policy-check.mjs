import { readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")

async function checkPolicy() {
  console.log("👮 Running policy check...")
  let errors = 0

  try {
    const registryPath = join(rootDir, "registry.json")
    const registry = JSON.parse(await readFile(registryPath, "utf-8"))
    const tools = registry.tools || []

    // Policy regexes
    const idRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/

    tools.forEach(tool => {
      // 1. ID Format
      if (!idRegex.test(tool.id)) {
        console.error(
          `❌ Policy violation: Tool ID "${tool.id}" must be lower-kebab-case (a-z, 0-9, -).`
        )
        errors++
      }

      // 2. Description Quality
      if (!tool.description || tool.description.length < 10) {
        console.error(
          `❌ Policy violation: Tool "${tool.id}" description is too short (<10 chars).`
        )
        errors++
      }
      if (tool.description && tool.description.toUpperCase().includes("TODO")) {
        console.error(
          `❌ Policy violation: Tool "${tool.id}" description contains "TODO".`
        )
        errors++
      }

      // 3. Repo URL
      if (tool.repo && !tool.repo.startsWith("https://")) {
        console.error(
          `❌ Policy violation: Tool "${tool.id}" repo must be HTTPS.`
        )
        errors++
      }

      // 4. Tags
      if (tool.tags) {
        tool.tags.forEach(tag => {
          if (tag !== tag.toLowerCase()) {
            console.error(
              `❌ Policy violation: Tool "${tool.id}" tag "${tag}" must be lowercase.`
            )
            errors++
          }
          // Optional: match regex for tags (alphanumeric+dash)
          if (!/^[a-z0-9\-]+$/.test(tag)) {
            console.error(
              `❌ Policy violation: Tool "${tool.id}" tag "${tag}" contains invalid characters.`
            )
            errors++
          }
        })
      }
      // 5. Lifecycle Policy (Verification & Deprecation)
      if (
        tool.verification &&
        !["none", "community", "official"].includes(tool.verification)
      ) {
        console.error(
          `❌ Policy violation: Tool "${tool.id}" has invalid verification level '${tool.verification}'.`
        )
        errors++
      }

      if (tool.deprecated === true) {
        if (!tool.deprecation_reason) {
          console.error(
            `❌ Policy violation: Deprecated tool "${tool.id}" must have a "deprecation_reason".`
          )
          errors++
        }
        if (!tool.deprecated_at) {
          console.error(
            `❌ Policy violation: Deprecated tool "${tool.id}" must have a "deprecated_at" ISO date (YYYY-MM-DD).`
          )
          errors++
        }
      }

      if (tool.deprecated_at) {
        if (isNaN(Date.parse(tool.deprecated_at))) {
          console.error(
            `❌ Policy violation: Tool "${tool.id}" 'deprecated_at' must be a valid ISO date.`
          )
          errors++
        }
      }

      if (tool.sunset_at) {
        if (isNaN(Date.parse(tool.sunset_at))) {
          console.error(
            `❌ Policy violation: Tool "${tool.id}" 'sunset_at' must be a valid ISO date.`
          )
          errors++
        }
        if (
          tool.deprecated_at &&
          !isNaN(Date.parse(tool.deprecated_at)) &&
          new Date(tool.sunset_at) <= new Date(tool.deprecated_at)
        ) {
          console.error(
            `❌ Policy violation: Tool "${tool.id}" 'sunset_at' must be strictly after 'deprecated_at'.`
          )
          errors++
        }
      }
    })

    if (errors > 0) {
      console.error(
        `❌ Tool Registry Policy Check failed with ${errors} violations.`
      )
      process.exit(1)
    }

    console.log("✅ Policy check passed.")
  } catch (err) {
    console.error("❌ Policy check execution error:", err)
    process.exit(1)
  }
}

checkPolicy()
