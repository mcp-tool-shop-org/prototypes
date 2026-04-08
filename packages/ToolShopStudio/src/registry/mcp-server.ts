import { z } from "zod";
import { registryMcpTools } from "./mcp-tools.js";
import {
  getRegistryResource,
  RegistryResourceSchema,
  getToolResource,
  ToolResourceRequestSchema,
} from "./resource.js";

// ── Unified MCP registration table ──────────────────────────────
//
// Single object with every registry-related MCP tool + resource.
// Wire this into your MCP server with a single loop:
//
//   for (const [name, entry] of Object.entries(allRegistryMcpTools)) {
//     server.addTool(name, entry.schema, entry.handler);
//   }

/**
 * Complete set of registry MCP tools + resources.
 *
 * Includes:
 *  - registry.listTools — list all tools with preset counts
 *  - registry.getToolInfo — full ToolDefinition by ID
 *  - registry.searchPresets — cross-tool preset search
 *  - registry.getResource — full registry snapshot (tools + summary)
 *  - registry.getToolResource — single tool's full data
 */
export const allRegistryMcpTools = {
  // Phase 3 introspection tools
  ...registryMcpTools,

  // Phase 4 resource tools
  "registry.getResource": {
    schema: z.object({}),
    handler: getRegistryResource,
    description: "Get the full registry resource (all tools + summary)",
  },
  "registry.getToolResource": {
    schema: ToolResourceRequestSchema,
    handler: getToolResource,
    description: "Get a single tool's full data as a resource",
  },
} as const;

/**
 * All MCP tool names available from the registry.
 */
export const registryMcpToolNames = Object.keys(allRegistryMcpTools) as readonly string[];
