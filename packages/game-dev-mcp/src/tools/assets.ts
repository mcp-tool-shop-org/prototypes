import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RCClient } from '../client/rc-client.js';
import { UE } from '../client/rc-client.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerAssetTools(server: McpServer, rc: RCClient): void {
  server.tool(
    'ue_search_assets',
    'Search the UE asset registry. Common class names: StaticMesh, Material, MaterialInstance, Texture2D, Blueprint, SoundWave, SkeletalMesh, AnimSequence, ParticleSystem, NiagaraSystem',
    {
      query: z.string().describe('Search query string'),
      classFilter: z.array(z.string()).optional().describe('Filter by class names (e.g., ["StaticMesh", "Material"])'),
      pathFilter: z.array(z.string()).optional().describe('Filter by content paths (e.g., ["/Game/MyProject"])'),
    },
    async ({ query, classFilter, pathFilter }) => {
      try {
        const assets = await rc.searchAssets(query, classFilter, pathFilter);
        return successResult({ count: assets.length, assets });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Asset search failed: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_list_assets',
    'List all assets in a content directory',
    {
      directoryPath: z.string().describe('Content directory path (e.g., "/Game/MyProject/Meshes")'),
      recursive: z.boolean().default(true).describe('Include subdirectories'),
    },
    async ({ directoryPath, recursive }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'ListAssets',
          { DirectoryPath: directoryPath, bRecursive: recursive },
        );
        const assets = ((result as Record<string, unknown>)?.ReturnValue ?? result) as string[];
        return successResult({ count: Array.isArray(assets) ? assets.length : 0, assets, directoryPath });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to list assets: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_asset_exists',
    'Check if an asset exists at the given path',
    {
      assetPath: z.string().describe('Asset path (e.g., "/Game/MyProject/Meshes/SM_Cube")'),
    },
    async ({ assetPath }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'DoesAssetExist',
          { AssetPath: assetPath },
        );
        const exists = (result as Record<string, unknown>)?.ReturnValue ?? result;
        return successResult({ assetPath, exists });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to check asset: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_duplicate_asset',
    'Duplicate an asset to a new path',
    {
      sourcePath: z.string().describe('Source asset path'),
      destPath: z.string().describe('Destination asset path'),
    },
    async ({ sourcePath, destPath }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'DuplicateAsset',
          { SourceAssetPath: sourcePath, DestinationAssetPath: destPath },
        );
        return successResult({ duplicated: true, sourcePath, destPath, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to duplicate asset: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_rename_asset',
    'Rename or move an asset to a new path',
    {
      sourcePath: z.string().describe('Current asset path'),
      destPath: z.string().describe('New asset path'),
    },
    async ({ sourcePath, destPath }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'RenameAsset',
          { SourceAssetPath: sourcePath, DestinationAssetPath: destPath },
        );
        return successResult({ renamed: true, sourcePath, destPath, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to rename asset: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_delete_asset',
    'Delete an asset from the content browser',
    {
      assetPath: z.string().describe('Asset path to delete'),
    },
    async ({ assetPath }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'DeleteAsset',
          { AssetPathToDelete: assetPath },
        );
        return successResult({ deleted: true, assetPath, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to delete asset: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_save_asset',
    'Save a modified asset to disk',
    {
      assetPath: z.string().describe('Asset path to save'),
    },
    async ({ assetPath }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'SaveAsset',
          { AssetToSave: assetPath, bOnlyIfIsDirty: true },
        );
        return successResult({ saved: true, assetPath, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to save asset: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_get_asset_info',
    'Get metadata about an asset (class, path, package)',
    {
      assetPath: z.string().describe('Asset path to inspect'),
    },
    async ({ assetPath }) => {
      try {
        // Use FindAssetData to get metadata
        const result = await rc.callFunction(
          UE.EditorAssetLibrary,
          'FindAssetData',
          { AssetPath: assetPath },
        );
        return successResult({ assetPath, info: result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to get asset info: ${error.message}`);
      }
    },
  );
}
