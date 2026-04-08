import { readFile, access } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import assert from "assert"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const distDir = join(rootDir, "dist")

async function runSmokeTests() {
  console.log("🔥 Running registry artifact smoke tests...")

  try {
    // 1. Check Dist Directory Existence
    try {
      await access(distDir)
    } catch {
      throw new Error(
        `dist directory not found at ${distDir}. Did you run build:derived?`
      )
    }
    console.log("   ✅ dist directory exists")

    // 2. Check Search Index
    const indexContent = await readFile(
      join(distDir, "registry.index.json"),
      "utf-8"
    )
    const index = JSON.parse(indexContent)
    assert.ok(Array.isArray(index), "registry.index.json should be an array")
    assert.ok(index.length > 0, "registry.index.json should not be empty")
    console.log("   ✅ registry.index.json is valid")

    // 3. Check Known Tool (Deterministic)
    const knownTool = index.find(t => t.id === "accessibility-suite")
    assert.ok(knownTool, 'Must contain known tool "accessibility-suite"')
    console.log("   ✅ Known tool accessibility-suite found")

    // 4. Check LLMs.txt
    const llmsTxt = await readFile(join(distDir, "registry.llms.txt"), "utf-8")
    assert.ok(
      llmsTxt.includes("MCP Tool Registry Context"),
      "llms.txt has correct header"
    )
    console.log("   ✅ registry.llms.txt is valid")

    console.log("🎉 Registry artifact smoke tests passed!")
  } catch (error) {
    console.error("❌ Smoke test failed:", error.message)
    process.exit(1)
  }
}

runSmokeTests()
