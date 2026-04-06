#!/usr/bin/env node
/**
 * WebSketch MCP Server
 *
 * Exposes WebSketch IR tools via Model Context Protocol:
 * - websketch_validate: Validate a capture (preflight check)
 * - websketch_render: Render IR to ASCII wireframe
 * - websketch_diff: Compute diffs between captures
 * - websketch_fingerprint: Generate deterministic fingerprints
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  renderAscii,
  diff,
  fingerprintCapture,
  validateCapture,
  isWebSketchException,
  formatWebSketchError,
  type WebSketchCapture,
  type WebSketchLimits,
} from '@mcptoolshop/websketch-ir';

const server = new Server(
  {
    name: 'websketch-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// =============================================================================
// Helpers
// =============================================================================

/** Error response helper (tool crashed — use for unexpected failures). */
function errorResponse(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
    isError: true as const,
  };
}

/** Text response helper (normal tool output). */
function textResponse(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
  };
}

/**
 * Validate a capture argument. Returns typed capture or error response.
 */
function validateCaptureArg(
  argName: string,
  value: unknown,
): { capture: WebSketchCapture } | { error: ReturnType<typeof errorResponse> } {
  if (value === undefined || value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {
      error: errorResponse(
        `[WS_INVALID_ARGS] Missing or invalid '${argName}' argument. Expected a WebSketchCapture object.`
      ),
    };
  }

  const issues = validateCapture(value);
  if (issues.length > 0) {
    const details = issues.slice(0, 5).map((i) => `  ${i.path}: ${i.message}`).join('\n');
    const suffix = issues.length > 5 ? `\n  ... and ${issues.length - 5} more` : '';
    return {
      error: errorResponse(
        `[WS_INVALID_CAPTURE] Invalid capture in '${argName}': ${issues.length} issue${issues.length > 1 ? 's' : ''}\n${details}${suffix}`
      ),
    };
  }

  return { capture: value as WebSketchCapture };
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'websketch_validate',
        description:
          'Validate a WebSketch capture and return structured result. Use before render/diff/fingerprint to check if a capture is well-formed.',
        inputSchema: {
          type: 'object',
          properties: {
            capture: {
              type: 'object',
              description: 'WebSketch IR capture object to validate',
            },
            limits: {
              type: 'object',
              description: 'Optional resource limits',
              properties: {
                maxNodes: { type: 'number', description: 'Max node count (default: 10000)' },
                maxDepth: { type: 'number', description: 'Max tree depth (default: 50)' },
                maxStringLength: { type: 'number', description: 'Max string length (default: 10000)' },
              },
            },
          },
          required: ['capture'],
        },
      },
      {
        name: 'websketch_render',
        description: 'Render a WebSketch IR capture to ASCII wireframe',
        inputSchema: {
          type: 'object',
          properties: {
            capture: {
              type: 'object',
              description: 'WebSketch IR capture object',
            },
          },
          required: ['capture'],
        },
      },
      {
        name: 'websketch_diff',
        description: 'Compute a diff between two WebSketch IR captures',
        inputSchema: {
          type: 'object',
          properties: {
            before: {
              type: 'object',
              description: 'Before capture',
            },
            after: {
              type: 'object',
              description: 'After capture',
            },
          },
          required: ['before', 'after'],
        },
      },
      {
        name: 'websketch_fingerprint',
        description: 'Generate a deterministic fingerprint for a capture',
        inputSchema: {
          type: 'object',
          properties: {
            capture: {
              type: 'object',
              description: 'WebSketch IR capture object',
            },
          },
          required: ['capture'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // -----------------------------------------------------------------------
      // websketch_validate — preflight validation (never throws, never isError)
      // -----------------------------------------------------------------------
      case 'websketch_validate': {
        // Type guard
        if (
          !args?.capture ||
          typeof args.capture !== 'object' ||
          Array.isArray(args.capture)
        ) {
          return textResponse(
            JSON.stringify({
              ok: false,
              error: {
                code: 'WS_INVALID_ARGS',
                message: "Missing or invalid 'capture' argument. Expected an object.",
              },
            })
          );
        }

        // Resolve optional limits
        const limits: Partial<WebSketchLimits> =
          args.limits && typeof args.limits === 'object' && !Array.isArray(args.limits)
            ? (args.limits as Partial<WebSketchLimits>)
            : {};

        const issues = validateCapture(args.capture, limits);

        if (issues.length === 0) {
          // Capture is valid — include any embedded warnings
          const captureObj = args.capture as Record<string, unknown>;
          const warnings = Array.isArray(captureObj.warnings) ? captureObj.warnings : undefined;
          return textResponse(JSON.stringify(warnings ? { ok: true, warnings } : { ok: true }));
        }

        // Check for limit-exceeded issue
        const limitIssue = issues.find(
          (i) =>
            i.path === 'nodeCount' ||
            i.path === 'depth' ||
            i.message.includes('exceeds')
        );

        if (limitIssue) {
          return textResponse(
            JSON.stringify({
              ok: false,
              error: {
                code: 'WS_LIMIT_EXCEEDED',
                message: limitIssue.message,
                path: limitIssue.path,
                expected: limitIssue.expected,
                received: limitIssue.received,
              },
            })
          );
        }

        // General validation error
        return textResponse(
          JSON.stringify({
            ok: false,
            error: {
              code: 'WS_INVALID_CAPTURE',
              message: `Invalid capture: ${issues.length} validation issue${issues.length > 1 ? 's' : ''}`,
              issues,
            },
          })
        );
      }

      // -----------------------------------------------------------------------
      // websketch_render
      // -----------------------------------------------------------------------
      case 'websketch_render': {
        const result = validateCaptureArg('capture', args?.capture);
        if ('error' in result) return result.error;
        const ascii = renderAscii(result.capture);
        return textResponse(ascii);
      }

      // -----------------------------------------------------------------------
      // websketch_diff
      // -----------------------------------------------------------------------
      case 'websketch_diff': {
        const beforeResult = validateCaptureArg('before', args?.before);
        if ('error' in beforeResult) return beforeResult.error;
        const afterResult = validateCaptureArg('after', args?.after);
        if ('error' in afterResult) return afterResult.error;
        const diffResult = diff(beforeResult.capture, afterResult.capture);
        return textResponse(JSON.stringify(diffResult, null, 2));
      }

      // -----------------------------------------------------------------------
      // websketch_fingerprint
      // -----------------------------------------------------------------------
      case 'websketch_fingerprint': {
        const result = validateCaptureArg('capture', args?.capture);
        if ('error' in result) return result.error;
        const fp = fingerprintCapture(result.capture);
        return textResponse(fp);
      }

      default:
        return errorResponse(`[WS_INVALID_ARGS] Unknown tool: ${name}`);
    }
  } catch (error) {
    if (isWebSketchException(error)) {
      return errorResponse(formatWebSketchError(error.ws));
    }
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(`[WS_INTERNAL] ${message}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('WebSketch MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
