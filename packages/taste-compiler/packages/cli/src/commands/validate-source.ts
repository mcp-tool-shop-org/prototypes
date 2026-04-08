import { resolve } from "node:path";
import { loadSourceDir } from "@taste-compiler/compiler";

export async function validateSourceCommand(args: string[]): Promise<void> {
  const dir = findArg(args, "--dir") || "./taste/source";

  console.log(`Validating source at ${resolve(dir)}...`);
  console.log("");

  try {
    const { source, warnings } = await loadSourceDir(dir);

    console.log("Schema: VALID");
    console.log(`Product: ${source.product.name}`);
    console.log(`Principles: ${source.principles.length}`);
    console.log(`Anti-examples: ${source.antiExamples.length}`);
    console.log(`Flows: ${source.flows.length}`);
    console.log(`Critique notes: ${source.critique.length}`);
    console.log(`Budgets: ${source.budgets ? "defined" : "not set"}`);

    if (warnings.length > 0) {
      console.log("");
      console.log(`Warnings (${warnings.length}):`);
      for (const w of warnings) {
        console.log(`  - ${w}`);
      }
    }

    // Quality checks
    const issues: string[] = [];
    if (source.antiExamples.length === 0) {
      issues.push("No anti-examples defined — consider adding what this product is NOT");
    }
    if (source.flows.length === 0) {
      issues.push("No core flows defined — consider adding at least one soul path");
    }
    if (!source.budgets) {
      issues.push("No budgets defined — consider setting complexity limits");
    }

    if (issues.length > 0) {
      console.log("");
      console.log(`Suggestions (${issues.length}):`);
      for (const issue of issues) {
        console.log(`  - ${issue}`);
      }
    }

    console.log("");
    console.log("Source is valid and ready to compile.");
  } catch (err) {
    console.error(`Validation failed: ${(err as Error).message}`);
    process.exit(1);
  }
}

function findArg(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}
