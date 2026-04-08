#!/usr/bin/env node

/**
 * scripts/facets.mjs
 *
 * Provides a "map of the ecosystem" with top tags, bundles, and stats.
 *
 * Usage:
 *   node scripts/facets.mjs
 */

import { readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const distDir = join(rootDir, "dist")
const reportPath = join(distDir, "registry.report.json")

async function main() {
  try {
    const reportContent = await readFile(reportPath, "utf-8")
    const report = JSON.parse(reportContent)
    const stats = report.stats

    console.log("🗺️  Registry Facets")
    console.log("===================")

    // 1. Top Tags
    console.log("\n🏷️  Top Tags")
    const tags = Object.entries(stats.tags)
      .sort((a, b) => b[1] - a[1]) // Descending
      .slice(0, 10)

    tags.forEach(([tag, count]) => {
      console.log(`  - ${tag}: ${count}`)
    })

    // 2. Bundles Breakdown
    console.log("\n📦 Bundles")
    Object.entries(stats.bundles).forEach(([bundle, count]) => {
      // If count is object (from recent bundle size update), handle it
      const displayCount =
        typeof count === "object" && count.count ? count.count : count
      console.log(`  - ${bundle}: ${displayCount} tools`)
    })

    // 3. Ecosystems / Maturity
    console.log("\n🌱 Ecosystems")
    const ecosystems = Object.entries(stats.ecosystems || {}).sort(
      (a, b) => b[1] - a[1]
    )

    if (ecosystems.length === 0) {
      console.log("  (None defined)")
    } else {
      ecosystems.forEach(([eco, count]) => {
        console.log(`  - ${eco}: ${count}`)
      })
    }

    console.log("\n📊 Totals")
    console.log(`  Tools: ${stats.totals.tools}`)
    console.log(`  Active: ${stats.totals.active}`)
    console.log(`  Bundles: ${stats.totals.bundles}`)
  } catch (error) {
    console.error("❌ Error generating facets:", error.message)
    process.exit(1)
  }
}

main()
