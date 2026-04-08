import { execSync } from "child_process"
import { readFile } from "fs/promises"

async function verifyPack() {
  console.log("📦 Verifying npm package contents...")

  try {
    // Get the tarball content list in JSON format
    // Ignore stdout from prepack scripts, only grab the JSON output from npm pack
    // Since npm pack might output logs from prepack to stdout, we need to be careful.
    // Actually, --json shoud suppress other output or we need to capture only the json part.
    // However, execSync captures all stdout.
    // Let's use stdio: 'pipe' and try to find the JSON array in the output.
    const output = execSync("npm pack --dry-run --json", { encoding: "utf-8" })

    // Find the JSON array in the output (it might be surrounded by logs)
    const jsonStartIndex = output.indexOf("[")
    const jsonEndIndex = output.lastIndexOf("]")
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("Could not find JSON output from npm pack")
    }
    const jsonStr = output.substring(jsonStartIndex, jsonEndIndex + 1)

    const packResult = JSON.parse(jsonStr)
    const files = packResult[0].files.map(f => f.path)

    const requiredFiles = [
      "registry.json",
      "schema/registry.schema.json",
      "bundles/core.json",
      "bundles/agents.json",
      "bundles/ops.json",
      "bundles/evaluation.json",
      "dist/derived.meta.json",
      "dist/registry.index.json",
      "dist/capabilities.json",
      "dist/registry.report.json",
      "dist/REGISTRY_HEALTH.md"
    ]

    const missing = requiredFiles.filter(f => !files.includes(f))

    if (missing.length > 0) {
      console.error("❌ Missing expected files in package:")
      missing.forEach(f => console.error(`   - ${f}`))
      process.exit(1)
    }

    console.log("✅ Package seems complete. Contains:")
    console.log(`   - ${files.length} files total`)
    console.log(`   - All critical registry/bundle files present`)
  } catch (error) {
    console.error("❌ Error verifying package:", error)
    process.exit(1)
  }
}

verifyPack()
