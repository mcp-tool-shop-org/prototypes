import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execSync } from "node:child_process";
import {
  TastePackSchema,
  formatReportText,
} from "@taste-compiler/core";
import { runChecks, buildReport } from "@taste-compiler/check";
import { extractTarget } from "@taste-compiler/adapters-web";

export async function diffCommand(args: string[]): Promise<void> {
  const packPath =
    findArg(args, "--pack") || "./taste/pack/taste-pack.json";
  const base = findArg(args, "--base") || "origin/main";
  const head = findArg(args, "--head") || "HEAD";
  const targetDir = findArg(args, "--target") || "./app";

  // Get changed files from git
  let changedFiles: string[];
  try {
    const output = execSync(`git diff --name-only ${base}...${head}`, {
      encoding: "utf-8",
    }).trim();
    changedFiles = output
      .split("\n")
      .filter((f) => f.endsWith(".tsx") || f.endsWith(".jsx") || f.endsWith(".css"));
  } catch {
    console.error("Failed to get git diff. Make sure you're in a git repository.");
    process.exit(1);
    return;
  }

  if (changedFiles.length === 0) {
    console.log("No relevant files changed.");
    return;
  }

  console.log(`Changed files: ${changedFiles.length}`);
  for (const f of changedFiles) {
    console.log(`  ${f}`);
  }
  console.log("");

  const raw = await readFile(resolve(packPath), "utf-8");
  const pack = TastePackSchema.parse(JSON.parse(raw));

  // Extract and check the full target but filter violations to changed files
  const target = await extractTarget(targetDir);
  const allViolations = runChecks(pack, target);

  const relevantViolations = allViolations.filter((v) =>
    v.evidence.some((e) =>
      e.file ? changedFiles.some((cf) => e.file!.includes(cf)) : false
    )
  );

  const report = buildReport(pack, `diff(${base}...${head})`, relevantViolations);
  console.log(formatReportText(report));

  if (!report.summary.passed) {
    process.exit(1);
  }
}

function findArg(args: string[], name: string): string | undefined {
  const idx = args.indexOf(name);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  return undefined;
}
