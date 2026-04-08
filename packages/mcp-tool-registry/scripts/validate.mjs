import { readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")

async function validate() {
  console.log("Validating registry.json against schema/registry.schema.json...")
  try {
    const schemaPath = join(rootDir, "schema", "registry.schema.json")
    const registryPath = join(rootDir, "registry.json")

    const schema = JSON.parse(await readFile(schemaPath, "utf-8"))
    const registry = JSON.parse(await readFile(registryPath, "utf-8"))

    const ajv = new Ajv({ strict: false, allErrors: true })
    addFormats(ajv)

    // Validate the registry
    const validate = ajv.compile(schema)
    const valid = validate(registry)

    if (!valid) {
      console.error("❌ Registry validation failed:")
      console.error(JSON.stringify(validate.errors, null, 2))
      process.exit(1)
    }

    console.log("✅ Registry is valid.")

    // --- Featured Validation ---
    console.log("\nValidating curation/featured.json...")
    const featuredPath = join(rootDir, "curation", "featured.json")
    const featuredSchemaPath = join(rootDir, "schema", "featured.schema.json")

    try {
      const featuredContent = await readFile(featuredPath, "utf-8")
      const featured = JSON.parse(featuredContent)
      const featuredSchema = JSON.parse(
        await readFile(featuredSchemaPath, "utf-8")
      )

      const ajvFeatured = new Ajv({ strict: false })
      const validateFeatured = ajvFeatured.compile(featuredSchema)

      if (!validateFeatured(featured)) {
        console.error("❌ Featured validation failed:")
        console.error(JSON.stringify(validateFeatured.errors, null, 2))
        process.exit(1)
      }

      // We'll check tool existence during the invariant loop or after loading tools
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log("ℹ️ No curation/featured.json found, skipping.")
      } else {
        throw err
      }
    }

    // --- Invariant Checks ---
    console.log("\nChecking logic invariants...")
    const tools = registry.tools || []
    const toolIds = new Set()
    let invariantErrors = 0

    // 1. Unique IDs & HTTPS
    tools.forEach((tool, index) => {
      // Unique ID
      if (toolIds.has(tool.id)) {
        console.error(
          `❌ Invariant failed: Duplicate tool ID found: "${tool.id}"`
        )
        invariantErrors++
      }
      toolIds.add(tool.id)

      // HTTPS
      if (tool.repo && !tool.repo.startsWith("https://")) {
        console.error(
          `❌ Invariant failed: Tool "${tool.id}" repo URL must be HTTPS: ${tool.repo}`
        )
        invariantErrors++
      }
      if (
        tool.install &&
        tool.install.url &&
        !tool.install.url.startsWith("https://")
      ) {
        console.error(
          `❌ Invariant failed: Tool "${tool.id}" install URL must be HTTPS: ${tool.install.url}`
        )
        invariantErrors++
      }
    })

    // 2. Validate Bundles
    console.log("Checking bundle integrity...")
    const bundlesDir = join(rootDir, "bundles")
    // We already checked the package.json exports exist, now let's read them
    const pkgPath = join(rootDir, "package.json")
    const pkg = JSON.parse(await readFile(pkgPath, "utf-8"))

    for (const [key, relativePath] of Object.entries(pkg.exports)) {
      if (key.startsWith("./bundles/") && typeof relativePath === "string") {
        const bundlePath = join(rootDir, relativePath)
        try {
          const bundle = JSON.parse(await readFile(bundlePath, "utf-8"))
          if (Array.isArray(bundle.tools)) {
            bundle.tools.forEach(refId => {
              if (!toolIds.has(refId)) {
                console.error(
                  `❌ Invariant failed: Bundle "${key}" references unknown tool ID: "${refId}"`
                )
                invariantErrors++
              }
            })
          }
        } catch (err) {
          console.error(`❌ Could not read/parse bundle ${key}:`, err.message)
          invariantErrors++
        }
      }
    }

    // --- Curation Integrity ---
    const featuredPathCuration = join(rootDir, "curation", "featured.json")
    try {
      const content = await readFile(featuredPathCuration, "utf-8")
      const feat = JSON.parse(content)
      Array.isArray(feat.featured) &&
        feat.featured.forEach(id => {
          if (!toolIds.has(id)) {
            console.error(
              `❌ Featured ID invariant failed: Unknown tool ID "${id}".`
            )
            invariantErrors++
          }
        })
      feat.collections &&
        Object.entries(feat.collections).forEach(([name, config]) => {
          config.tools &&
            config.tools.forEach(id => {
              if (!toolIds.has(id)) {
                console.error(
                  `❌ Collection "${name}" invariant failed: Unknown tool ID "${id}".`
                )
                invariantErrors++
              }
            })
        })
    } catch (e) {
      if (e.code !== "ENOENT") console.error("Error checking curation:", e)
    }

    if (invariantErrors > 0) {
      console.error(`❌ ${invariantErrors} invariant checks failed.`)
      process.exit(1)
    }
    console.log(
      "✅ Invariants verified (Unique IDs, HTTPS, Bundle References)."
    )

    console.log("Checking bundle exports...")
    // pkg is already loaded above

    for (const [key, relativePath] of Object.entries(pkg.exports)) {
      // Skip object exports or conditional exports if complex, assuming strings for now based on known structure
      if (typeof relativePath === "string") {
        const fullPath = join(rootDir, relativePath)
        try {
          await readFile(fullPath)
        } catch {
          console.error(
            `❌ Export validation failed: ${key} -> ${relativePath} (File not found)`
          )
          process.exit(1)
        }
      }
    }
    console.log("✅ Bundle exports verified.")
  } catch (error) {
    console.error("❌ Fatal error during validation:", error)
    process.exit(1)
  }
}

validate()
