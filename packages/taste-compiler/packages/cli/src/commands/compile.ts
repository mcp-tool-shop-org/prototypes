import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadSourceDir, normalize, compile } from "@taste-compiler/compiler";

export async function compileCommand(args: string[]): Promise<void> {
  const sourceDir = findArg(args, "--source") || "./taste/source";
  const outPath = findArg(args, "--out") || "./taste/pack/taste-pack.json";

  console.log(`Compiling source from ${resolve(sourceDir)}...`);

  const { source, warnings } = await loadSourceDir(sourceDir);
  const normalized = normalize(source);
  const pack = compile(normalized);

  await writeFile(resolve(outPath), JSON.stringify(pack, null, 2));

  console.log("");
  console.log(`Compiled: ${pack.product.name}@${pack.packVersion}`);
  console.log(`Source hash: ${pack.provenance.sourceHash}`);
  console.log(`Output: ${resolve(outPath)}`);
  console.log("");

  // Summary
  const a = pack.artifacts;
  console.log("Artifacts:");
  console.log(`  Visual tokens: ${a.visualTokens.colors.length} colors, ${a.visualTokens.spacing.length} spacing, ${a.visualTokens.motion.length} motion`);
  console.log(`  Component grammar: ${a.componentGrammar.banned.length} banned, ${a.componentGrammar.compositionRules.length} rules`);
  console.log(`  Interaction laws: ${a.interactionLaws.length}`);
  console.log(`  Copy rules: ${a.copyRules.bannedPhrases.length} banned phrases, ${a.copyRules.claimQualifiers.length} qualifiers`);
  console.log(`  Budgets: ${[a.complexityBudgets.maxTopLevelNavItems, a.complexityBudgets.maxPrimaryActionsPerScreen, a.complexityBudgets.maxModalDepth, a.complexityBudgets.maxDistinctInteractionModesPerFlow].filter(Boolean).length} active`);
  console.log(`  Forbidden patterns: ${a.forbiddenPatterns.length}`);
  console.log(`  Golden flows: ${pack.goldens.length}`);

  if (warnings.length > 0) {
    console.log("");
    console.log(`Warnings: ${warnings.length}`);
    for (const w of warnings) {
      console.log(`  - ${w}`);
    }
  }

  if (normalized.deduped.critiqueMerges > 0) {
    console.log(`  Merged ${normalized.deduped.critiqueMerges} duplicate critiques`);
  }
}

function findArg(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}
