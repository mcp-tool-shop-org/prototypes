import { readFile, writeFile, mkdir, readdir } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { createHash } from "crypto"
import { execSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const distDir = join(rootDir, "dist")
const curationDir = join(rootDir, "curation")

async function buildDerived() {
  console.log("🏗️  Building derived metadata...")

  try {
    // Ensure dist exists
    await mkdir(distDir, { recursive: true })

    // Read Source Data
    const registryPath = join(rootDir, "registry.json")
    const registryContent = await readFile(registryPath, "utf-8")
    const registry = JSON.parse(registryContent)

    // Read Curation Data (Optional)
    let featuredData = null
    try {
      const featuredContent = await readFile(
        join(curationDir, "featured.json"),
        "utf-8"
      )
      featuredData = JSON.parse(featuredContent)
    } catch (e) {
      // ignore if missing
    }

    // Read Package Version
    const pkgPath = join(rootDir, "package.json")
    const pkgContent = await readFile(pkgPath, "utf-8")
    const pkg = JSON.parse(pkgContent)

    // Read Git SHA
    let commitSha = "unknown"
    try {
      commitSha = execSync("git rev-parse HEAD").toString().trim()
    } catch (e) {
      // ignore
    }

    // 1. derived.meta.json
    console.log("   - Generating derived.meta.json")
    const metaStr = JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        registry_hash: createHash("sha256")
          .update(registryContent)
          .digest("hex"),
        schema_version: registry.schema_version,
        registry_version: pkg.version,
        tool_count: registry.tools.length,
        commit_sha: commitSha
      },
      null,
      2
    )
    await writeFile(join(distDir, "derived.meta.json"), metaStr)

    // 2. registry.index.json
    console.log("   - Generating registry.index.json")
    const tools = registry.tools || []

    // Sort tools by ID for deterministic output
    tools.sort((a, b) => a.id.localeCompare(b.id))

    // Helper to normalize and tokenize text
    const tokenize = text => {
      if (!text) return []
      return text
        .toLowerCase()
        .split(/[\s\-_,]+/)
        .filter(t => t.length > 2) // Filter very short words
        .sort() // Sort for stability (though usually we just use set)
    }

    const index = tools.map(tool => {
      const keywords = new Set([
        ...tokenize(tool.name),
        ...tokenize(tool.description),
        ...(tool.tags || []).map(t => t.toLowerCase())
      ])

      // Find bundle membership (we'd need to read bundles for this, let's load them)
      // For now, we'll implement bundle loading if strictness requires it,
      // but let's first get the basic index structure.

      return {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        verification: tool.verification || "none",
        keywords: Array.from(keywords).sort(), // Stable order
        tags: (tool.tags || []).sort()
        // capabilities: tool.capabilities // If present in schema later
        // bundle_membership: [] // To be populated
      }
    })

    // Bundle Membership Logic
    const bundlesDir = join(rootDir, "bundles")
    const bundleMap = new Map() // toolId -> Set(bundleNames)

    // Read generated bundles directly from file system
    // Filter for JSON files, exclude rules directory (though readdir is shallow)
    const bundleFiles = (await readdir(bundlesDir)).filter(
      f => f.endsWith(".json") && !f.includes("rules")
    )

    for (const file of bundleFiles) {
      const bundleName = file.replace(".json", "")
      try {
        const bundleContent = await readFile(join(bundlesDir, file), "utf-8")
        const bundle = JSON.parse(bundleContent)
        if (bundle.tools && Array.isArray(bundle.tools)) {
          bundle.tools.forEach(tid => {
            if (!bundleMap.has(tid)) bundleMap.set(tid, new Set())
            bundleMap.get(tid).add(bundleName)
          })
        }
      } catch (e) {
        console.warn(
          `    ⚠️ Warning: Failed to read bundle ${file}: ${e.message}`
        )
      }
    }

    // Attach bundle membership & default capabilities
    index.forEach(entry => {
      if (bundleMap.has(entry.id)) {
        entry.bundle_membership = Array.from(bundleMap.get(entry.id)).sort()
      } else {
        entry.bundle_membership = []
      }
      // Capabilities placeholder - to be populated from tool definition if schema updates
      // For now, we initialize empty array to support querying
      entry.capabilities = []
    })

    await writeFile(
      join(distDir, "registry.index.json"),
      JSON.stringify(index, null, 2)
    )

    // 3. capabilities.json
    console.log(
      "   - Generating capabilities.json (placeholder for future schema)"
    )
    // Currently registry schema doesn't seem to have "capabilities" field on tools explicitly
    // based on previous "read_file" of registry.json.
    // Assuming if it existed or if we infer from tags simply for now?
    // The prompt says "capabilities (if present in registry)".
    // Let's implement the logic to check for it.

    const capabilitiesMap = {}
    tools.forEach(tool => {
      // Hypothethical 'capabilities' array in tool definition
      const toolCaps = tool.capabilities || []
      toolCaps.forEach(cap => {
        const capKey = cap.toLowerCase()
        if (!capabilitiesMap[capKey]) capabilitiesMap[capKey] = []
        capabilitiesMap[capKey].push(tool.id)
      })
    })

    // Ensure sorted tool lists
    const sortedCaps = {}
    Object.keys(capabilitiesMap)
      .sort()
      .forEach(key => {
        sortedCaps[key] = capabilitiesMap[key].sort()
      })

    await writeFile(
      join(distDir, "capabilities.json"),
      JSON.stringify(sortedCaps, null, 2)
    )

    // 4. featured.json (Processed Copy)
    // We copy this to dist/ so consumers can get the curated list from the same place as the index
    if (featuredData) {
      console.log("   - Generating featured.json")
      // We could enable "enrichment" here (e.g. expanding tool details inline),
      // but for now we keep it normalized (IDs only) as per data-first principles.
      // We do ensure stable key order though (canonicalization).
      // Note: featuredData.collections is an Object (dictionary) in the source file, NOT an array.
      // We will transform it to an array for the distribution format if we want consistency,
      // OR keep it as a map. The previous explorer code treated it as an array of objects with {id, ...}.
      // Looking at the error "map is not a function", it confirms source is an object.
      // Let's normalize it to an array of objects for easier consumption by clients.

      let normalizedCollections = []
      if (Array.isArray(featuredData.collections)) {
        normalizedCollections = featuredData.collections
      } else if (typeof featuredData.collections === "object") {
        normalizedCollections = Object.entries(featuredData.collections).map(
          ([key, value]) => ({
            id: key, // The key becomes the ID
            name: value.title || value.name, // Handle title vs name discrepancy
            description: value.description,
            tools: value.tools
          })
        )
      }

      const canonFeatured = {
        $schema: featuredData.$schema,
        featured: (featuredData.featured || []).sort(),
        collections: normalizedCollections
          .map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            tools: (c.tools || []).sort()
          }))
          .sort((a, b) => a.id.localeCompare(b.id))
      }
      await writeFile(
        join(distDir, "featured.json"),
        JSON.stringify(canonFeatured, null, 2)
      )
    }

    // 5. registry.llms.txt (AI-Native Context)
    console.log("   - Generating registry.llms.txt")
    let llmsTxt = `# MCP Tool Registry Context\n\n`
    llmsTxt += `This file provides context for LLMs to understand the tools available in the registry.\n`
    llmsTxt += `The registry contains ${index.length} tools for Model Context Protocol.\n\n`

    if (
      featuredData &&
      featuredData.featured &&
      featuredData.featured.length > 0
    ) {
      llmsTxt += `## Featured Tools\n`
      featuredData.featured.forEach(id => (llmsTxt += `- ${id}\n`))
      llmsTxt += `\n`
    }

    llmsTxt += `## Bundles\n`
    llmsTxt += `- core: Essential utilities (start here)\n`
    llmsTxt += `- agents: Autonomous agent frameworks\n`
    llmsTxt += `- ops: DevOps and infrastructure management\n`
    llmsTxt += `- evaluation: Benchmarking and testing tools\n\n`

    llmsTxt += `## Tool Index\n`
    index.forEach(tool => {
      const tags = (tool.tags || []).join(", ")
      llmsTxt += `- **${tool.id}**: ${tool.description} (Tags: ${tags})\n`
    })

    await writeFile(join(distDir, "registry.llms.txt"), llmsTxt)

    console.log("✅ Derived artifacts built successfully.")
  } catch (error) {
    console.error("❌ Error building derived metadata:", error)
    process.exit(1)
  }
}

buildDerived()
