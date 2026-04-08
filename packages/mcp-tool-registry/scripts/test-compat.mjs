// scripts/test-compat.mjs
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import chalk from "chalk"
import Ajv from "ajv/dist/2020.js"
import addFormats from "ajv-formats"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, "..")
const FIXTURES_DIR = path.join(ROOT_DIR, "fixtures/compat")
const SCHEMA_PATH = path.join(ROOT_DIR, "schema/registry.schema.json")

const fixtures = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith(".json"))

console.log(
  chalk.bold.blue("Running Compatibility Tests against v1 Fixtures...")
)

let success = 0
let failures = 0

for (const fix of fixtures) {
  const fixName = path.basename(fix, ".json")
  console.log(chalk.cyan(`\nTest Case: ${fixName}`))

  const fixPath = path.join(FIXTURES_DIR, fix)

  try {
    // 1. Validate Schema
    console.log(chalk.dim("  Validating schema..."))
    const ajv = new Ajv.default({ allErrors: true, strict: false })
    addFormats(ajv)
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"))
    const validate = ajv.compile(schema)
    const data = JSON.parse(fs.readFileSync(fixPath, "utf8"))

    if (!validate(data)) {
      throw new Error(
        "Schema validation failed: " + JSON.stringify(validate.errors)
      )
    }
    console.log(chalk.green("  ✓ Schema valid"))

    // 2. Simulate Build (Bundles & Derived)
    const content = JSON.parse(fs.readFileSync(fixPath, "utf8"))

    // Invariant: Must have tools array
    if (!Array.isArray(content.tools)) throw new Error("Missing tools array")

    // Invariant: IDs must be valid (policy check subset)
    const idRegex = /^[a-z0-9-]+$/
    for (const t of content.tools) {
      if (!idRegex.test(t.id)) {
        throw new Error(`Invalid ID format in fixture: ${t.id}`)
      }
      if (t.install && !t.install.type) {
        throw new Error(`Missing install.type for ${t.id}`)
      }
    }
    console.log(chalk.green("  ✓ Policy Invariants passed"))

    // 3. Bundles Check (Logic Simulation)
    if (fixName.includes("bundles")) {
      const coreTool = content.tools.find(t => t.tags.includes("core"))
      if (!coreTool) throw new Error("Expected core tool in bundles fixture")
      console.log(chalk.green("  ✓ Bundle logic simulation passed"))
    }

    success++
  } catch (err) {
    console.error(chalk.red(`  ✗ FAILS: ${err.message}`))
    if (err.stdout) console.log(err.stdout.toString())
    if (err.stderr) console.error(err.stderr.toString())
    failures++
  }
}

console.log(chalk.bold(`\nSummary: ${success} passed, ${failures} failed.`))

if (failures > 0) process.exit(1)
