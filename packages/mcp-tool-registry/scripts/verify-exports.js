// scripts/verify-exports.js

const fs = require("fs")
const path = require("path")

const ROOT_DIR = path.resolve(__dirname, "..")
const DIST_DIR = path.join(ROOT_DIR, "dist")
const PACKAGE_JSON = path.join(ROOT_DIR, "package.json")

const EXPECTED_ARTIFACTS = [
  "registry.json",
  "registry.index.json",
  "capabilities.json",
  "registry.llms.txt",
  "bundles/core.index.json",
  "bundles/ops.index.json",
  "bundles/agents.index.json",
  "bundles/evaluation.index.json"
]

async function verify() {
  console.log("Validating registry exports and artifacts...")

  // 1. Check generated artifacts exist
  let missing = []
  for (const file of EXPECTED_ARTIFACTS) {
    // Some are in dist root, some in subdirs
    // But verify logic usually runs POST-build.
    // Let's assume dist/ structure mirrors expected output.

    // Actually, registry.json is source root.
    // Dist artifacts are in dist/.

    let filePath
    if (file === "registry.json") {
      filePath = path.join(ROOT_DIR, "registry.json")
    } else {
      filePath = path.join(DIST_DIR, file)
    }

    if (!fs.existsSync(filePath)) {
      missing.push(file)
    }
  }

  if (missing.length > 0) {
    console.error(`❌ Missing critical artifacts: ${missing.join(", ")}`)
    process.exit(1)
  }
  console.log("✅ All critical artifacts present.")

  // 2. Check package.json exports/files
  const pkg = require(PACKAGE_JSON)

  if (!pkg.files.includes("dist")) {
    console.error('❌ package.json "files" missing "dist"')
    process.exit(1)
  }

  if (!pkg.files.includes("registry.json")) {
    console.error('❌ package.json "files" missing "registry.json"')
    process.exit(1)
  }

  console.log("✅ package.json export configuration verified.")
}

verify().catch(err => {
  console.error(err)
  process.exit(1)
})
