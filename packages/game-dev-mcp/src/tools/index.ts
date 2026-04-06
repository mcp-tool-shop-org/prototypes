import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RCClient } from '../client/rc-client.js';
import { registerActorTools } from './actors.js';
import { registerPropertyTools } from './properties.js';
import { registerAssetTools } from './assets.js';
import { registerLevelTools } from './levels.js';
import { registerBlueprintTools } from './blueprints.js';
import { registerEditorTools } from './editor.js';
import { registerAsideTools } from './aside.js';

export function registerAllTools(server: McpServer, rc: RCClient): void {
  registerActorTools(server, rc);
  registerPropertyTools(server, rc);
  registerAssetTools(server, rc);
  registerLevelTools(server, rc);
  registerBlueprintTools(server, rc);
  registerEditorTools(server, rc);
  registerAsideTools(server);
}
