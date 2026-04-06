import { z } from 'zod';

// ============================================================================
// Tool Result Types (matches mcp-file-forge pattern)
// ============================================================================

export interface ToolSuccess {
  [x: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
}

export interface ToolError {
  [x: string]: unknown;
  isError: true;
  content: Array<{ type: 'text'; text: string }>;
}

export type ToolResult = ToolSuccess | ToolError;

// ============================================================================
// Error Codes
// ============================================================================

export const ErrorCode = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  OBJECT_NOT_FOUND: 'OBJECT_NOT_FOUND',
  FUNCTION_NOT_FOUND: 'FUNCTION_NOT_FOUND',
  PROPERTY_NOT_FOUND: 'PROPERTY_NOT_FOUND',
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  INVALID_PARAMS: 'INVALID_PARAMS',
  RC_API_ERROR: 'RC_API_ERROR',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface UnrealMcpError {
  code: ErrorCodeType;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Configuration Schema
// ============================================================================

export const ConfigSchema = z.object({
  host: z.string().default('127.0.0.1'),
  port: z.number().int().min(1).max(65535).default(30010),
  timeout: z.number().int().min(1000).max(60000).default(10000),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

// ============================================================================
// Shared Zod Schemas for Tool Parameters
// ============================================================================

export const VectorSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  z: z.number().default(0),
});

export const RotatorSchema = z.object({
  pitch: z.number().default(0),
  yaw: z.number().default(0),
  roll: z.number().default(0),
});
