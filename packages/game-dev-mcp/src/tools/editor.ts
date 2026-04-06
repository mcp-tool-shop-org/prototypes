import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RCClient } from '../client/rc-client.js';
import { UE } from '../client/rc-client.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerEditorTools(server: McpServer, rc: RCClient): void {
  server.tool(
    'ue_ping',
    'Test connection to Unreal Engine. Returns true if the editor is running and the Remote Control API is enabled.',
    {},
    async () => {
      const connected = await rc.ping();
      if (connected) {
        return successResult({ connected: true, message: 'Unreal Engine is connected and ready' });
      }
      return errorResult(
        ErrorCode.CONNECTION_FAILED,
        'Cannot connect to Unreal Engine. Is the editor running with Remote Control API plugin enabled? (Edit > Plugins > search "Remote Control API" > enable > restart editor)',
      );
    },
  );

  server.tool(
    'ue_execute_console_command',
    'Execute a UE console command. Examples: "stat fps", "stat unit", "r.SetRes 1920x1080", "show collision"',
    {
      command: z.string().describe('Console command to execute'),
    },
    async ({ command }) => {
      try {
        await rc.callFunction(UE.KismetSystemLibrary, 'ExecuteConsoleCommand', {
          WorldContextObject: UE.GameplayStatics,
          Command: command,
        });
        return successResult({ executed: command });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to execute command: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_get_engine_info',
    'Get information about the running Unreal Engine instance (version, available API routes)',
    {},
    async () => {
      try {
        const info = await rc.getInfo();
        return successResult(info);
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.CONNECTION_FAILED, `Failed to get engine info: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_focus_viewport',
    'Focus the editor viewport on a specific actor',
    {
      actorPath: z.string().describe('Object path of the actor to focus on'),
    },
    async ({ actorPath }) => {
      try {
        // Select the actor first, then use editor focus
        await rc.callFunction(UE.EditorActorSubsystem, 'ClearActorSelectionSet', {});
        await rc.callFunction(UE.EditorActorSubsystem, 'SetActorSelectionState', {
          Actor: actorPath,
          bShouldBeSelected: true,
        });
        // Use console command to focus on selection
        await rc.callFunction(UE.KismetSystemLibrary, 'ExecuteConsoleCommand', {
          WorldContextObject: UE.GameplayStatics,
          Command: 'CAMERA ALIGN',
        });
        return successResult({ focused: actorPath });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to focus viewport: ${error.message}`);
      }
    },
  );
}
