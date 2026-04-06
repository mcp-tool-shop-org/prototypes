import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RCClient } from '../client/rc-client.js';
import { UE } from '../client/rc-client.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerLevelTools(server: McpServer, rc: RCClient): void {
  server.tool(
    'ue_save_current_level',
    'Save the currently open level',
    {},
    async () => {
      try {
        await rc.callFunction(
          UE.EditorLoadingAndSavingUtils,
          'SaveCurrentLevel',
          {},
        );
        return successResult({ saved: true });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to save level: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_load_level',
    'Open a level by its asset path',
    {
      levelPath: z.string().describe('Level asset path (e.g., "/Game/Maps/MyLevel")'),
    },
    async ({ levelPath }) => {
      try {
        await rc.callFunction(
          UE.EditorLoadingAndSavingUtils,
          'LoadMap',
          { Filename: levelPath },
        );
        return successResult({ loaded: levelPath });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to load level: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_get_current_level',
    'Get the name and path of the currently open level',
    {},
    async () => {
      try {
        const result = await rc.callFunction(
          UE.GameplayStatics,
          'GetCurrentLevelName',
          { WorldContextObject: '/Script/Engine.Default__GameplayStatics' },
        );
        return successResult({
          level: (result as Record<string, unknown>)?.ReturnValue ?? result,
        });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to get current level: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_save_all',
    'Save all dirty (modified) packages/assets',
    {},
    async () => {
      try {
        await rc.callFunction(
          UE.EditorLoadingAndSavingUtils,
          'SaveDirtyPackages',
          { bPromptUserToSave: false, bSaveMapPackages: true, bSaveContentPackages: true },
        );
        return successResult({ savedAll: true });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to save all: ${error.message}`);
      }
    },
  );
}
