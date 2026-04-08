import { ToolDefinitionSchema } from "./types.js";
import { TOOL_REGISTRY } from "./tools.js";
import { SHARED_PATTERNS } from "./helpers.js";

// ── Registry validation — pure, deterministic, no I/O ────────────

/**
 * Error entry from registry validation.
 */
export interface RegistryValidationError {
  toolId: string;
  message: string;
}

/**
 * Validate every tool in TOOL_REGISTRY against ToolDefinitionSchema
 * and structural invariants.
 *
 * Returns `true` if all tools are valid.
 * Throws an `Error` with all collected messages if any tool fails.
 *
 * Checks performed:
 *  1. Zod schema parse (fields, types, refinements)
 *  2. Every shared pattern must appear in every tool (substring match)
 *  3. Every premium preset must have a non-null fallbackTo
 *  4. No orphan fallback references (fallbackTo must exist in same tool)
 *  5. At least one example per tool
 */
export function validateRegistry(): true {
  const errors: RegistryValidationError[] = [];

  for (const [toolId, tool] of Object.entries(TOOL_REGISTRY)) {
    // 1. Zod schema validation (includes refinements)
    const result = ToolDefinitionSchema.safeParse(tool);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ toolId, message: issue.message });
      }
    }

    // 2. Every shared pattern must appear (substring match)
    for (const required of SHARED_PATTERNS) {
      const found = tool.commonPatterns.some((p) =>
        p.toLowerCase().includes(required.toLowerCase()),
      );
      if (!found) {
        errors.push({
          toolId,
          message: `missing shared pattern: "${required}"`,
        });
      }
    }

    // 3. Premium presets must have non-null fallbackTo
    for (const [presetName, info] of Object.entries(tool.presets)) {
      if (info.isPremium && !info.fallbackTo) {
        errors.push({
          toolId,
          message: `premium preset "${presetName}" has no fallbackTo`,
        });
      }
    }

    // 4. fallbackTo must reference existing preset in same tool
    for (const [presetName, info] of Object.entries(tool.presets)) {
      if (info.fallbackTo && !(info.fallbackTo in tool.presets)) {
        errors.push({
          toolId,
          message: `preset "${presetName}" fallbackTo "${info.fallbackTo}" does not exist`,
        });
      }
    }

    // 5. At least one example
    if (tool.examples.length === 0) {
      errors.push({ toolId, message: "no examples provided" });
    }
  }

  if (errors.length > 0) {
    const formatted = errors
      .map((e) => `  ${e.toolId}: ${e.message}`)
      .join("\n");
    throw new Error(`Registry validation failed:\n${formatted}`);
  }

  return true;
}

/**
 * Validate a single tool definition against the schema.
 * Returns the list of errors (empty if valid).
 */
export function validateTool(toolId: string): RegistryValidationError[] {
  const tool = TOOL_REGISTRY[toolId];
  if (!tool) {
    return [{ toolId, message: "tool not found in registry" }];
  }

  const errors: RegistryValidationError[] = [];
  const result = ToolDefinitionSchema.safeParse(tool);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({ toolId, message: issue.message });
    }
  }

  return errors;
}
