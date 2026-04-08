import { readFile, writeFile, readdir } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createHash } from "crypto"
import chalk from "chalk"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const distDir = join(rootDir, "dist")
const bundlesDir = join(rootDir, "bundles")

async function generateHealthReport() {
  console.log("🩺 Generating registry health report...")

  try {
    // 1. Load Registry
    const registryPath = join(rootDir, "registry.json")
    const registryContent = await readFile(registryPath, "utf-8")
    const registry = JSON.parse(registryContent)
    const tools = registry.tools || []

    // 2. Load Bundles (Generated)
    const bundleFiles = (await readdir(bundlesDir)).filter(
      f => f.endsWith(".json") && !f.includes("rules")
    )

    const bundles = {}
    for (const f of bundleFiles) {
      const content = await readFile(join(bundlesDir, f), "utf-8")
      const b = JSON.parse(content)
      bundles[b.id] = {
        count: b.tools.length,
        size_bytes: Buffer.byteLength(content, "utf8")
      }
    }

    // 3. Compute Stats
    const stats = {
      generated_at: new Date().toISOString(),
      registry_hash: createHash("sha256").update(registryContent).digest("hex"),
      totals: {
        tools: tools.length,
        bundles: Object.keys(bundles).length,
        active: tools.filter(t => !t.deprecated).length,
        deprecated: tools.filter(t => t.deprecated).length
      },
      bundles: bundles,
      tags: {},
      ecosystems: {}
    }

    // Aggregations
    tools.forEach(tool => {
      // Tags
      ;(tool.tags || []).forEach(tag => {
        stats.tags[tag] = (stats.tags[tag] || 0) + 1
      })

      // Ecosystems
      if (tool.ecosystem) {
        stats.ecosystems[tool.ecosystem] =
          (stats.ecosystems[tool.ecosystem] || 0) + 1
      }
    })

    // 4. Quality Metrics (Commit 9.2 logic)
    const recommendedFields = ["description", "tags", "ecosystem", "repo"]
    const quality = {
      missing_fields: {},
      description_issues: []
    }

    recommendedFields.forEach(field => (quality.missing_fields[field] = 0))

    tools.forEach(tool => {
      // Missing Fields
      recommendedFields.forEach(field => {
        if (
          !tool[field] ||
          (Array.isArray(tool[field]) && tool[field].length === 0)
        ) {
          quality.missing_fields[field]++
        }
      })

      // Description Quality
      if (tool.description) {
        if (tool.description.length < 15) {
          quality.description_issues.push({
            id: tool.id,
            issue: "Too short (<15 chars)"
          })
        }
        if (tool.description.toLowerCase().includes("todo")) {
          quality.description_issues.push({
            id: tool.id,
            issue: "Contains 'TODO'"
          })
        }
      } else {
        quality.description_issues.push({
          id: tool.id,
          issue: "Missing description"
        })
      }
    })

    // 5. Output JSON
    const report = { stats, quality }
    await writeFile(
      join(distDir, "registry.report.json"),
      JSON.stringify(report, null, 2)
    )
    console.log("   ✅ Wrote dist/registry.report.json")

    // 6. Output Markdown (Commit 9.3 logic)
    const mdLines = [
      `# Registry Health Report`,
      ``,
      `**Generated At:** ${stats.generated_at}`,
      `**Registry Hash:** \`${stats.registry_hash.substring(0, 8)}\``,
      ``,
      `## 📊 Totals`,
      `- **Tools**: ${stats.totals.tools}`,
      `- **Active**: ${stats.totals.active}`,
      `- **Deprecated**: ${stats.totals.deprecated}`,
      `- **Bundles**: ${stats.totals.bundles}`,
      ``,
      `## 📦 Bundle Sizes`,
      `| Bundle | Count | Size |`,
      `| :--- | :--- | :--- |`,
      ...Object.entries(bundles).map(
        ([k, v]) =>
          `| ${k} | ${v.count} | ${(v.size_bytes / 1024).toFixed(2)} KB |`
      ),
      ``,
      `## ⚠️ Quality Check`,
      `### Missing Recommended Fields`,
      `| Field | Count | % |`,
      `| :--- | :--- | :--- |`,
      ...Object.entries(quality.missing_fields).map(([k, v]) => {
        const pct = ((v / tools.length) * 100).toFixed(1)
        return `| \`${k}\` | ${v} | ${pct}% |`
      }),
      ``,
      `### Description Issues`,
      quality.description_issues.length === 0
        ? "None!"
        : `Found **${quality.description_issues.length}** description issues.`,
      ``,
      `## 🏷️ Top Tags`,
      Object.entries(stats.tags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k, v]) => `- **${k}**: ${v}`)
        .join("\n")
    ]

    await writeFile(join(distDir, "REGISTRY_HEALTH.md"), mdLines.join("\n"))
    console.log("   ✅ Wrote dist/REGISTRY_HEALTH.md")

    // 7. SLO Check (Optional CLI flag --check-slo)
    if (process.argv.includes("--check-slo")) {
      console.log(chalk.bold("🛡️  Running Quality Gates & SLO Checks..."))
      const errors = []
      const warnings = []

      // Rule 1: No more than 10% missing recommended fields (Strict for some, lenient for others)
      Object.entries(quality.missing_fields).forEach(([field, count]) => {
        const pct = count / tools.length
        // Description and Repo are critical
        if (["description", "repo"].includes(field)) {
          if (pct > 0.05)
            errors.push(
              `SLO Violation: >5% tools missing '${field}' (${(pct * 100).toFixed(1)}%)`
            )
        }
        // Tags and Ecosystem are nice-to-have for now (Warning only)
        else if (pct > 0.1) {
          warnings.push(
            `Quality Warning: >10% tools missing '${field}' (${(pct * 100).toFixed(1)}%)`
          )
        }
      })

      // Rule 2: Description Quality (Example: 95% pass)
      const descFailures = quality.description_issues.length
      const descPct = descFailures / tools.length
      if (descPct > 0.05)
        errors.push(
          `SLO Violation: >5% tools have description issues (${(descPct * 100).toFixed(1)}%)`
        )

      // Rule 3: Deprecation Budget (Hard Gate: <20%)
      const depRate = stats.totals.deprecated / stats.totals.tools
      if (depRate > 0.2) {
        errors.push(
          `Budget Exceeded: >20% tools are deprecated (${(depRate * 100).toFixed(1)}%)`
        )
      } else if (depRate > 0.1) {
        warnings.push(
          `Budget Warning: >10% tools are deprecated (${(depRate * 100).toFixed(1)}%)`
        )
      }

      // Rule 4: Bundle Integrity
      if (!bundles["core"]) {
        errors.push("Critical: Core bundle is missing!")
      } else if (bundles["core"].count < 5) {
        warnings.push(
          `Core bundle is suspiciously small (${bundles["core"].count} tools)`
        )
      }

      if (warnings.length > 0) {
        console.log(chalk.yellow("⚠️  Quality Warnings:"))
        warnings.forEach(w => console.log(chalk.yellow(`   - ${w}`)))
      }

      if (errors.length > 0) {
        console.error(chalk.red("❌ Quality Gate Failed:"))
        errors.forEach(e => console.error(chalk.red(`   - ${e}`)))
        process.exit(1)
      } else {
        console.log(chalk.green("   ✅ All Quality Gates passed."))
      }
    }
  } catch (error) {
    console.error("❌ Error generating health report:", error)
    process.exit(1)
  }
}

generateHealthReport()
