// scripts/patch-registry.mjs
// Usage: node scripts/patch-registry.mjs --from-env
// Expects JSON payload in env var: TOOL_SUBMISSION

import { readFile, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const registryPath = join(rootDir, "registry.json")
const bundlesDir = join(rootDir, "bundles")

async function main() {
  try {
    console.log("🔧 Starting Registry Patch...")

    const payloadStr = process.env.TOOL_SUBMISSION
    if (!payloadStr) {
      throw new Error("Missing TOOL_SUBMISSION environment variable")
    }

    const submission = JSON.parse(payloadStr)
    console.log(`   Processing submission for ID: ${submission.id}`)

    // 1. Validate Input Basics
    if (!submission.id || !submission.id.match(/^[a-z0-9]+(-[a-z0-9]+)*$/)) {
      throw new Error(`Invalid ID format: ${submission.id}`)
    }
    if (!submission.name || !submission.description || !submission.repo) {
      throw new Error("Missing required fields")
    }

    // 2. Load Registry
    const registryContent = await readFile(registryPath, "utf-8")
    const registry = JSON.parse(registryContent)

    // 3. Construct Tool Object
    // Normalize tags
    let tags = []
    if (typeof submission.tags === "string") {
      tags = submission.tags
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)
    } else if (Array.isArray(submission.tags)) {
      tags = submission.tags
    }

    // Parse Install (safely)
    let install = {}
    if (typeof submission.install === "string") {
      try {
        install = JSON.parse(submission.install)
      } catch {
        throw new Error("Invalid JSON in install field")
      }
    } else {
      install = submission.install
    }

    const newTool = {
      id: submission.id,
      name: submission.name,
      description: submission.description,
      repo: submission.repo,
      install: install,
      tags: tags
      // Ecosystem/Compatibility? Optional, defaults for now.
    }

    // 4. Update Registry (Idempotent: Update if exists, else append)
    const existingIndex = registry.tools.findIndex(t => t.id === newTool.id)
    if (existingIndex >= 0) {
      console.log("   Updating existing tool...")
      registry.tools[existingIndex] = {
        ...registry.tools[existingIndex],
        ...newTool
      }
    } else {
      console.log("   Adding new tool...")
      registry.tools.push(newTool)
    }

    // 5. Sort Tools
    registry.tools.sort((a, b) => a.id.localeCompare(b.id))

    // 6. Write Registry
    await writeFile(registryPath, JSON.stringify(registry, null, 2))
    console.log("   ✅ registry.json updated")

    // 7. Handle Suggested Bundle (Optional)
    // This is trickier because bundles are generated via rules now (Phase 8).
    // If the user requested a bundle, we might need to add a "bundle_hint"
    // to the tool metadata if we want to support manual overrides,
    // OR we just rely on tags.
    // For Phase 12 MVP, let's just log it. The rule system (Phase 8) uses tags.
    if (submission.bundle && submission.bundle !== "none") {
      console.log(
        `   ℹ️  User requested bundle: ${submission.bundle}. Ensure tags match bundle rules.`
      )
    }
  } catch (error) {
    console.error("❌ Error patching registry:", error.message)
    process.exit(1)
  }
}

main()
