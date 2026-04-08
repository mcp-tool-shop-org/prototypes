#!/usr/bin/env node

/**
 * scripts/query.mjs
 *
 * A dependency-free CLI for searching the MCP Tool Registry.
 *
 * Usage:
 *   node scripts/query.mjs [--id <id>] [--tag <tag>] [--cap <cap>] [--bundle <bundle>] [--q <text>] [--json] [--explain]
 */

import { readFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const distDir = join(rootDir, "dist")
const indexPath = join(distDir, "registry.index.json")

// Simple arg parser
function parseArgs(args) {
  const options = {
    id: null,
    tag: null,
    cap: null,
    bundle: null,
    q: null,
    json: false,
    explain: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === "--id") options.id = args[++i]
    else if (arg === "--tag") options.tag = args[++i]
    else if (arg === "--cap") options.cap = args[++i]
    else if (arg === "--bundle") options.bundle = args[++i]
    else if (arg === "--q") options.q = args[++i]
    else if (arg === "--json") options.json = true
    else if (arg === "--explain") options.explain = true
  }
  return options
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  try {
    const indexContent = await readFile(indexPath, "utf-8")
    const index = JSON.parse(indexContent)

    let results = index.map(item => ({ ...item, score: 0, reasons: [] }))

    // 1. Filter by ID (Exact)
    if (options.id) {
      results = results.filter(item => {
        const match = item.id === options.id
        if (match && options.explain) item.reasons.push(`ID match: ${item.id}`)
        return match
      })
    }

    // 2. Filter by Bundle
    if (options.bundle) {
      results = results.filter(item => {
        const membership = item.bundle_membership || []
        const match = membership.includes(options.bundle)
        if (match && options.explain)
          item.reasons.push(`In bundle: ${options.bundle}`)
        return match
      })
    }

    // 3. Filter by Tag
    if (options.tag) {
      results = results.filter(item => {
        const tags = item.tags || []
        const match = tags.includes(options.tag)
        if (match && options.explain)
          item.reasons.push(`Has tag: ${options.tag}`)
        return match
      })
    }

    // 4. Filter by Capability
    if (options.cap) {
      // Assuming capabilities are stored on the item, if not yet, this filter effectively returns empty
      // unless we relax it or check tags implicitly. Standard is explicit field.
      results = results.filter(item => {
        const caps = item.capabilities || []
        const match = caps.includes(options.cap)
        if (match && options.explain)
          item.reasons.push(`Has capability: ${options.cap}`)
        return match
      })
    }

    // 5. Keyword Search (Ranking)
    if (options.q) {
      const query = options.q.toLowerCase()
      const queryTokens = query.split(/\s+/).filter(t => t.length > 0)

      results = results.filter(item => {
        let score = 0
        const reasons = []

        // Exact ID match
        if (item.id === query) {
          score += 100
          reasons.push(`Exact ID match`)
        }

        // Exact Keyword match
        if ((item.keywords || []).includes(query)) {
          score += 50
          reasons.push(`Exact keyword match`)
        }

        // Prefix match on Name/ID/Keywords
        if (
          item.id.startsWith(query) ||
          item.name.toLowerCase().startsWith(query)
        ) {
          score += 30
          reasons.push(`Prefix match`)
        }

        // Substring match
        if (
          item.description &&
          item.description.toLowerCase().includes(query)
        ) {
          score += 10
          reasons.push(`Description substring match`)
        }

        // Keyword match
        const keywordMatches = (item.keywords || []).filter(k =>
          k.includes(query)
        )
        if (keywordMatches.length > 0) {
          score += 5 * keywordMatches.length
          reasons.push(`Keyword match (${keywordMatches.length})`)
        }

        if (score > 0) {
          item.score += score
          if (options.explain) item.reasons.push(...reasons)
          return true
        }
        return false
      })

      // Sort by score
      results.sort((a, b) => b.score - a.score)
    }

    // Output
    if (options.json) {
      // Clean output for JSON
      const output = results.map(r => {
        const { score, reasons, ...data } = r
        if (options.explain)
          return { ...data, _score: score, _reasons: reasons }
        return data
      })
      console.log(JSON.stringify(output, null, 2))
    } else {
      console.log(`🔍 Found ${results.length} tools`)
      console.log("---")
      results.forEach(item => {
        console.log(`🛠️  ${item.name} (${item.id})`)
        console.log(`   ${item.description}`)
        if (item.tags && item.tags.length)
          console.log(`   Tags: ${item.tags.join(", ")}`)
        if (item.bundle_membership && item.bundle_membership.length)
          console.log(`   Bundles: ${item.bundle_membership.join(", ")}`)
        if (options.explain && item.reasons.length) {
          console.log(`   Why: ${item.reasons.join(", ")}`)
        }
        console.log("")
      })
    }
  } catch (error) {
    console.error("❌ Error executing query:", error.message)
    process.exit(1)
  }
}

main()
