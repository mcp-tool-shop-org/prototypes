import { readFile, writeFile, readdir } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const rulesDir = join(rootDir, "bundles", "rules")
const bundlesDir = join(rootDir, "bundles")

async function buildBundles() {
  console.log("📦 Generating bundles from rules...")

  try {
    // 1. Load Registry
    const registryPath = join(rootDir, "registry.json")
    const registry = JSON.parse(await readFile(registryPath, "utf-8"))
    const tools = registry.tools || []

    // Index tools by ID for fast lookup
    const toolMap = new Map()
    tools.forEach(t => toolMap.set(t.id, t))

    // 2. Load Rules
    const ruleFiles = (await readdir(rulesDir)).filter(f =>
      f.endsWith(".rules.json")
    )

    for (const ruleFile of ruleFiles) {
      console.log(`   - Processing ${ruleFile}...`)
      const rulePath = join(rulesDir, ruleFile)
      const ruleSet = JSON.parse(await readFile(rulePath, "utf-8"))

      const includedTools = new Set()

      // --- Inclusion Logic ---
      if (ruleSet.rules) {
        ruleSet.rules.forEach(rule => {
          // IDs (Explicit whitelist)
          if (rule.ids) {
            rule.ids.forEach(id => {
              if (toolMap.has(id)) includedTools.add(id)
              else
                console.warn(
                  `     ⚠️  Warning: Rule references unknown tool ID "${id}"`
                )
            })
          }

          // Tags
          if (rule.tags) {
            const op = rule.operator || "OR"
            tools.forEach(tool => {
              const toolTags = tool.tags || []
              if (op === "OR") {
                // Any tag matches
                if (rule.tags.some(t => toolTags.includes(t)))
                  includedTools.add(tool.id)
              } else {
                // All tags match
                if (rule.tags.every(t => toolTags.includes(t)))
                  includedTools.add(tool.id)
              }
            })
          }
        })
      }

      // --- Exclusion Logic ---
      if (ruleSet.exclude) {
        // Hard Exclude IDs
        if (ruleSet.exclude.ids) {
          ruleSet.exclude.ids.forEach(id => includedTools.delete(id))
        }

        // Deprecated
        if (ruleSet.exclude.deprecated === true) {
          const toRemove = []
          includedTools.forEach(id => {
            const tool = toolMap.get(id)
            if (tool.deprecated) toRemove.push(id)
          })
          toRemove.forEach(id => includedTools.delete(id))
        }
      }

      // --- Output ---
      const finalIds = Array.from(includedTools).sort() // Deterministic Sort

      const bundleOutput = {
        id: ruleSet.name || ruleFile.replace(".rules.json", ""),
        description: ruleSet.description || "",
        tools: finalIds
      }

      const outputPath = join(bundlesDir, `${bundleOutput.id}.json`)
      await writeFile(outputPath, JSON.stringify(bundleOutput, null, 2))
      console.log(
        `     ✅ Generated ${bundleOutput.id}.json with ${finalIds.length} tools.`
      )
    }

    console.log("✅ All bundles generated successfully.")
  } catch (error) {
    console.error("❌ Error building bundles:", error)
    process.exit(1)
  }
}

buildBundles()
