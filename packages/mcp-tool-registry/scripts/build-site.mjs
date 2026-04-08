import { cp, copyFile, mkdir, readdir, readFile, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const siteSrc = join(rootDir, "site")
const distSrc = join(rootDir, "dist")
const curationSrc = join(rootDir, "curation")
const siteOut = join(rootDir, "_site")

async function buildSite() {
  console.log("🏗️  Building Static Site...")

  try {
    await mkdir(siteOut, { recursive: true })

    // 1. Copy Site Scaffold
    await cp(siteSrc, siteOut, { recursive: true })

    // 2. Prepare Data Directory
    // Copy everything from dist to _site/dist
    await cp(distSrc, join(siteOut, "dist"), { recursive: true })

    // 3. (Legacy) Copy Curation Data to curation/ for backward compatibility
    // if anything external relies on it, or just to keep source structure.
    // But the app now uses dist/featured.json.
    // We'll leave the code to copy it but warn it might be deprecated.
    // Actually, let's remove the manual curation copy since it's now in dist.
    /* 
        await mkdir(join(siteOut, 'curation'), { recursive: true });
        let featuredData = { featured: [], collections: [] };
        try { ... } 
        */

    // Load featured data for LLMs.txt from the generated artifact
    let featuredData = { featured: [], collections: [] }
    try {
      featuredData = JSON.parse(
        await readFile(join(distSrc, "featured.json"), "utf-8")
      )
    } catch (e) {
      /* ignore */
    }

    // 4. Copy Logo
    try {
      await copyFile(
        join(rootDir, "logo.png"),
        join(siteOut, "mcp-tool-registry_logo.png")
      )
    } catch (e) {
      console.warn("⚠️  Logo not found, skipping copy.")
    }

    // 5. Generate LLMs.txt (AI-Native Context)
    // We copy the canonical version from dist/registry.llms.txt to output as LLMs.txt
    // This ensures consistency between the packaged artifact and the site file.
    console.log("🤖 Copying LLMs.txt...")

    try {
      await copyFile(
        join(distSrc, "registry.llms.txt"),
        join(siteOut, "LLMs.txt")
      )
      console.log("   ✅ Wrote LLMs.txt")
    } catch (e) {
      console.warn("⚠️  registry.llms.txt not found in dist/, skipping copy.")
    }

    console.log("✅ Site build complete in _site/")
  } catch (error) {
    console.error("❌ Error building site:", error)
    process.exit(1)
  }
}

buildSite()
