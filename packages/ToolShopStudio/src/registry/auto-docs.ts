import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "./runtime.js";

// ── Auto-docs — pure markdown generation from registry data ──────

/**
 * Generate a markdown document for a single tool.
 * Returns empty string if tool is not found.
 *
 * Output includes: name, description, preset table, patterns, example.
 * Pure function — no I/O, no file writes.
 */
export function generateToolMarkdown(toolId: string): string {
  const reg = loadRegistry();
  const tool = reg.get(toolId);

  if (!tool) return "";

  const lines: string[] = [
    `# ${tool.name}`,
    "",
    `> ${tool.description}`,
    "",
    `**Version:** ${tool.version}  `,
    `**Pipeline:** \`${tool.pipelineFn}\``,
    "",
    "## Presets",
    "",
    "| Preset | Format | Extension | Tier | Fallback |",
    "|--------|--------|-----------|------|----------|",
  ];

  for (const [name, info] of Object.entries(tool.presets)) {
    const tier = info.isPremium ? "Premium" : "Guaranteed";
    const fallback = info.fallbackTo ?? "—";
    lines.push(
      `| \`${name}\` | ${info.outputFormat} | \`.${info.outputExt}\` | ${tier} | ${fallback} |`,
    );
  }

  lines.push("", "## Architectural Patterns", "");
  for (const p of tool.commonPatterns) {
    lines.push(`- ${p}`);
  }

  if (tool.examples.length > 0) {
    lines.push("", "## Example", "");
    const ex = tool.examples[0]!;
    lines.push(`**${ex.description}**`, "", "```typescript", ex.code, "```");
  }

  return lines.join("\n");
}

/**
 * Generate a combined markdown document for all tools.
 * Useful for full registry documentation.
 */
export function generateRegistryMarkdown(): string {
  const reg = loadRegistry();
  const s = reg.summary;

  const header = [
    "# ToolShopStudio Registry",
    "",
    `> ${s.toolCount} tools, ${s.totalPresets} presets (${s.guaranteedPresets} guaranteed, ${s.premiumPresets} premium)`,
    "",
    `**Version:** ${s.version}  `,
    `**Output Formats:** ${s.uniqueOutputFormats.join(", ")}`,
    "",
    "---",
    "",
  ];

  const toolDocs = reg
    .ids()
    .map((id) => generateToolMarkdown(id))
    .filter(Boolean);

  return [...header, ...toolDocs.join("\n\n---\n\n").split("\n")].join("\n");
}

/**
 * Generate a preset cross-reference table across all tools.
 * Shows which presets are shared (e.g. stl-print-ready in FreeCAD + OpenSCAD).
 */
export function generatePresetCrossRef(): string {
  const reg = loadRegistry();
  const presetMap = new Map<string, string[]>();

  for (const tool of reg.all()) {
    for (const presetName of Object.keys(tool.presets)) {
      const list = presetMap.get(presetName) ?? [];
      list.push(tool.id);
      presetMap.set(presetName, list);
    }
  }

  const lines: string[] = [
    "# Preset Cross-Reference",
    "",
    "| Preset | Tools |",
    "|--------|-------|",
  ];

  for (const [preset, tools] of [...presetMap.entries()].sort()) {
    lines.push(`| \`${preset}\` | ${tools.join(", ")} |`);
  }

  return lines.join("\n");
}

// ── File-writing build step ──────────────────────────────────────

/**
 * Generate all tool docs and write them to disk.
 *
 * Creates:
 *   - `<outDir>/tools/<toolId>.md` for each tool
 *   - `<outDir>/registry.md` — combined registry doc
 *   - `<outDir>/presets.md` — preset cross-reference
 *
 * @param outDir Target directory (default: "docs")
 * @returns Array of file paths written
 */
export function generateAllToolDocs(outDir: string = "docs"): string[] {
  const reg = loadRegistry();
  const toolsDir = join(outDir, "tools");
  mkdirSync(toolsDir, { recursive: true });

  const written: string[] = [];

  // Per-tool docs
  for (const id of reg.ids()) {
    const md = generateToolMarkdown(id);
    if (md) {
      const filePath = join(toolsDir, `${id}.md`);
      writeFileSync(filePath, md + "\n", "utf8");
      written.push(filePath);
    }
  }

  // Combined registry doc
  const registryPath = join(outDir, "registry.md");
  writeFileSync(registryPath, generateRegistryMarkdown() + "\n", "utf8");
  written.push(registryPath);

  // Preset cross-reference
  const presetsPath = join(outDir, "presets.md");
  writeFileSync(presetsPath, generatePresetCrossRef() + "\n", "utf8");
  written.push(presetsPath);

  return written;
}
