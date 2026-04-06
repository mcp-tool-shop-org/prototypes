import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RCClient } from '../client/rc-client.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerPropertyTools(server: McpServer, rc: RCClient): void {
  server.tool(
    'ue_get_property',
    'Read any UPROPERTY on any UObject. Use ue_describe_object first to discover available properties.',
    {
      objectPath: z.string().describe('Full object path'),
      propertyName: z.string().describe('Property name (e.g., "RelativeLocation", "Mobility", "LightColor")'),
    },
    async ({ objectPath, propertyName }) => {
      try {
        const value = await rc.getProperty(objectPath, propertyName);
        return successResult({ objectPath, propertyName, value });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to read property: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_set_property',
    'Write any UPROPERTY on any UObject. Use ue_describe_object first to discover available properties and their types.',
    {
      objectPath: z.string().describe('Full object path'),
      propertyName: z.string().describe('Property name'),
      value: z.unknown().describe('Value to set (type must match the property)'),
    },
    async ({ objectPath, propertyName, value }) => {
      try {
        await rc.setProperty(objectPath, propertyName, value);
        return successResult({ objectPath, propertyName, value, success: true });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to set property: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_describe_object',
    'Introspect a UObject — lists all callable functions and readable/writable properties. Essential for discovering what you can do with an object.',
    {
      objectPath: z.string().describe('Full object path (e.g., an actor path, or a subsystem like "/Script/UnrealEd.Default__EditorActorSubsystem")'),
    },
    async ({ objectPath }) => {
      try {
        const description = await rc.describeObject(objectPath);
        return successResult(description);
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to describe object: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_batch_set_properties',
    'Set multiple properties on one or more objects in a single request. More efficient than individual ue_set_property calls.',
    {
      operations: z.array(z.object({
        objectPath: z.string(),
        propertyName: z.string(),
        value: z.unknown(),
      })).describe('Array of property set operations'),
    },
    async ({ operations }) => {
      try {
        const entries = operations.map((op, i) => ({
          requestId: i,
          url: '/remote/object/property',
          verb: 'PUT',
          body: {
            objectPath: op.objectPath,
            propertyName: op.propertyName,
            access: 'WRITE_ACCESS',
            propertyValue: op.value,
          },
        }));

        const results = await rc.batch(entries);
        const successes = results.filter((r) => r.responseCode >= 200 && r.responseCode < 300).length;
        const failures = results.length - successes;

        return successResult({
          total: operations.length,
          successes,
          failures,
          results,
        });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Batch set failed: ${error.message}`);
      }
    },
  );
}
