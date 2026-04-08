import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadRegistry } from "./runtime.js";
import { generateAllToolDocs } from "./auto-docs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "package.json"), "utf-8"),
);
export const VERSION: string = pkg.version;

// ── CLI registry commands — testable core logic ──────────────────

/**
 * Format the tool list as a printable table string.
 */
export function formatToolList(): string {
  const reg = loadRegistry();
  const tools = reg.all();

  const header = "ID              Presets  Premium  Version";
  const separator = "─".repeat(header.length);
  const rows = tools.map((t) => {
    const presetCount = Object.keys(t.presets).length;
    const premiumCount = Object.values(t.presets).filter((p) => p.isPremium).length;
    return [
      t.id.padEnd(16),
      String(presetCount).padStart(7),
      String(premiumCount).padStart(8),
      `  ${t.version}`,
    ].join("");
  });

  return [header, separator, ...rows].join("\n");
}

/**
 * Format a single tool's full info as a printable string.
 */
export function formatToolShow(toolId: string): string {
  const reg = loadRegistry();
  const tool = reg.get(toolId);

  if (!tool) {
    return `Error: tool "${toolId}" not found. Available: ${reg.ids().join(", ")}`;
  }

  const lines: string[] = [
    `${tool.name} (${tool.id}) v${tool.version}`,
    "",
    tool.description,
    "",
    "Presets:",
  ];

  for (const [name, info] of Object.entries(tool.presets)) {
    const tier = info.isPremium ? `Premium → ${info.fallbackTo}` : "Guaranteed";
    lines.push(`  ${name.padEnd(24)} .${info.outputExt}  [${tier}]`);
  }

  lines.push("", "Patterns:");
  for (const p of tool.commonPatterns) {
    lines.push(`  • ${p}`);
  }

  return lines.join("\n");
}

/**
 * Format the registry summary as a printable string.
 */
export function formatSummary(): string {
  const reg = loadRegistry();
  const s = reg.summary;

  return [
    `ToolShopStudio Registry v${s.version}`,
    "",
    `  Tools:       ${s.toolCount}`,
    `  Presets:     ${s.totalPresets} (${s.guaranteedPresets} guaranteed, ${s.premiumPresets} premium)`,
    `  Formats:     ${s.uniqueOutputFormats.join(", ")}`,
  ].join("\n");
}

/**
 * Format the registry summary as JSON string.
 */
export function formatJson(): string {
  const reg = loadRegistry();
  return JSON.stringify(reg.summary, null, 2);
}

/**
 * Run the docs generator and return a status message.
 * @param outDir Target directory (default: "docs")
 */
export function runDocsGenerate(outDir: string = "docs"): string {
  const files = generateAllToolDocs(outDir);
  return `Generated ${files.length} docs:\n${files.map((f) => `  ${f}`).join("\n")}`;
}

// ── CLI entry point ──────────────────────────────────────────────

/**
 * Process CLI arguments and return the output string.
 * Separated from I/O for testability.
 */
export function processCommand(args: string[]): string {
  const sub = args[0];

  switch (sub) {
    case "list":
      return formatToolList();
    case "show": {
      const toolId = args[1];
      if (!toolId) return "Usage: toolshop registry show <toolId>";
      return formatToolShow(toolId);
    }
    case "summary":
      return formatSummary();
    case "json":
      return formatJson();
    case "docs": {
      const outDir = args[1] || "docs";
      return runDocsGenerate(outDir);
    }
    default:
      return [
        "Usage: toolshop registry <command>",
        "",
        "Commands:",
        "  list        List all registered tools",
        "  show <id>   Show full details for a tool",
        "  summary     Show registry summary",
        "  json        Output registry summary as JSON",
        "  docs [dir]  Generate markdown docs (default: docs/)",
      ].join("\n");
  }
}

/**
 * CLI main — reads process.argv and writes to stdout.
 * Called from bin/toolshop.mjs.
 */
export function main(): void {
  const top = process.argv[2];

  if (top === "--version" || top === "-V") {
    console.log(`toolshop ${VERSION}`);
    return;
  }

  if (top === "registry") {
    const output = processCommand(process.argv.slice(3));
    console.log(output);
  } else {
    console.log(
      `Usage: toolshop <command>\n\nCommands:\n  registry   Registry tools\n\nFlags:\n  --version, -V   Show version`,
    );
  }
}
