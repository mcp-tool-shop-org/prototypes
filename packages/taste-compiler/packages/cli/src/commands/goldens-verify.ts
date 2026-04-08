import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { TastePackSchema, formatViolation } from "@taste-compiler/core";
import { runChecks } from "@taste-compiler/check";
import { extractTarget } from "@taste-compiler/adapters-web";
import { scanRoutes } from "@taste-compiler/adapters-web";
import { verifyAllGoldens } from "@taste-compiler/goldens";

export async function goldensVerifyCommand(args: string[]): Promise<void> {
  const packPath =
    findArg(args, "--pack") || "./taste/pack/taste-pack.json";
  const targetDir = findArg(args, "--target") || "./app";

  const raw = await readFile(resolve(packPath), "utf-8");
  const pack = TastePackSchema.parse(JSON.parse(raw));

  if (pack.goldens.length === 0) {
    console.log("No golden flows defined in pack.");
    return;
  }

  console.log(`Verifying ${pack.goldens.length} golden flow(s)...`);
  console.log("");

  // Get routes from target
  const { routes } = await scanRoutes(targetDir);
  console.log(`Found ${routes.length} routes in target`);

  // Get violations from full check for cross-referencing
  const target = await extractTarget(targetDir);
  const packViolations = runChecks(pack, target);

  const results = verifyAllGoldens(pack, { routes }, packViolations);

  let totalPassed = 0;
  let totalFailed = 0;

  for (const result of results) {
    const status = result.passed ? "PASS" : "FAIL";
    console.log(
      `[${status}] ${result.flow.name} (${result.flow.routes.join(" → ")})`
    );

    if (!result.passed) {
      totalFailed++;
      for (const v of result.violations) {
        console.log(`  ${formatViolation(v)}`);
      }
    } else {
      totalPassed++;
    }
    console.log("");
  }

  console.log(`Results: ${totalPassed} passed, ${totalFailed} failed`);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

function findArg(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}
