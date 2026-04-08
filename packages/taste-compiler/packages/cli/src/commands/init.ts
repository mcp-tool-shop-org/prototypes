import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const PRODUCT_YAML = `name: "My Product"
summary: "A brief description of what this product is and who it serves"
`;

const PRINCIPLES_YAML = `# At least one principle is required
- id: example-principle
  statement: "The product should feel intentional and considered"
  rationale: "Every element should earn its place"
`;

const ANTI_EXAMPLES_YAML = `# Anti-examples show what this product is NOT
# - id: generic-dashboard
#   uri: "ref://dashboard-01"
#   reason: "Too enterprise. Too many stat blocks."
#   category: too-enterprise
`;

const REFERENCES_YAML = `# Visual and interaction references
# - id: ref-01
#   type: image
#   uri: "./refs/mood-01.png"
#   notes: "Calm, editorial feel"
`;

const FLOWS_YAML = `# Core user flows — the soul paths through the product
# - id: create-item
#   name: Create Item
#   steps:
#     - route: /home
#       purpose: "Starting point"
#     - route: /item/new
#       purpose: "Creation form"
#     - route: /item/review
#       purpose: "Review before save"
#   invariants:
#     - "No more than one primary CTA per screen"
#     - "Save draft survives back navigation"
`;

const CRITIQUE_YAML = `# Critique notes from reviews
# - id: crit-01
#   target: /dashboard
#   note: "Too many actions competing for attention"
#   severity: important
`;

const BUDGETS_YAML = `maxTopLevelNavItems: 5
maxPrimaryActionsPerScreen: 1
maxModalDepth: 1
maxDistinctInteractionModesPerFlow: 2
`;

const METADATA_YAML = `createdBy: "author"
createdAt: "${new Date().toISOString().split("T")[0]}"
version: "0.1.0"
`;

export async function initCommand(args: string[]): Promise<void> {
  const dir = args[0] || ".";
  const base = resolve(dir, "taste");

  await mkdir(join(base, "source"), { recursive: true });
  await mkdir(join(base, "pack"), { recursive: true });
  await mkdir(join(base, "goldens"), { recursive: true });

  await writeFile(join(base, "source", "product.yaml"), PRODUCT_YAML);
  await writeFile(join(base, "source", "principles.yaml"), PRINCIPLES_YAML);
  await writeFile(
    join(base, "source", "anti-examples.yaml"),
    ANTI_EXAMPLES_YAML
  );
  await writeFile(join(base, "source", "references.yaml"), REFERENCES_YAML);
  await writeFile(join(base, "source", "flows.yaml"), FLOWS_YAML);
  await writeFile(join(base, "source", "critique.yaml"), CRITIQUE_YAML);
  await writeFile(join(base, "source", "budgets.yaml"), BUDGETS_YAML);
  await writeFile(join(base, "source", "metadata.yaml"), METADATA_YAML);

  console.log(`Taste workspace created at ${base}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Edit taste/source/product.yaml with your product details");
  console.log("  2. Add principles, anti-examples, and flows");
  console.log("  3. Run: taste validate-source --dir taste/source");
  console.log("  4. Run: taste compile --source taste/source --out taste/pack/taste-pack.json");
}
