#!/usr/bin/env node
/**
 * Generate baseline violation snapshots for pilot repos.
 * Usage: node scripts/baseline-snapshot.mjs <baseline.json> <output.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const [,, inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error("Usage: node baseline-snapshot.mjs <baseline.json> <output.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(inputPath, "utf8"));

// Group violations by file
const byFile = {};
for (const v of data.violations) {
  // evidence can be an array or an object
  const evidenceItems = Array.isArray(v.evidence) ? v.evidence : [v.evidence];
  const f = evidenceItems[0]?.file || "unknown";
  if (!byFile[f]) {
    byFile[f] = { errors: 0, warnings: 0, rules: {} };
  }
  if (v.severity === "error") byFile[f].errors++;
  else if (v.severity === "warn") byFile[f].warnings++;

  const rule = v.ruleId || "unknown";
  byFile[f].rules[rule] = (byFile[f].rules[rule] || 0) + 1;
}

const baseline = {
  product: data.product,
  checkedAt: data.checkedAt,
  baselineLockedAt: new Date().toISOString(),
  summary: {
    totalErrors: data.violations.filter((v) => v.severity === "error").length,
    totalWarnings: data.violations.filter((v) => v.severity === "warn").length,
    totalViolations: data.violations.length,
    filesWithViolations: Object.keys(byFile).length,
  },
  byFile,
  pilotGatingRule: {
    description:
      "Trial runs are judged only on net-new violations in touched files, not historical debt",
    failOn: [
      "any new token bypass in touched files",
      "any forbidden-pattern hit",
      "any golden failure",
      "any new budget breach",
      "any new copy-rule violation",
    ],
    ignore: [
      "historical untouched-file token debt",
      "old violations outside the diff",
    ],
  },
};

writeFileSync(outputPath, JSON.stringify(baseline, null, 2));
console.log(
  `Baseline: ${baseline.summary.totalViolations} violations across ${baseline.summary.filesWithViolations} files`
);
