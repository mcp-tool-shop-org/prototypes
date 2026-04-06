import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RCClient } from '../client/rc-client.js';
import { UE } from '../client/rc-client.js';
import { VectorSchema, RotatorSchema } from '../types.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerActorTools(server: McpServer, rc: RCClient): void {
  server.tool(
    'ue_spawn_actor',
    'Spawn an actor in the current level. Common classes: StaticMeshActor, PointLight, SpotLight, DirectionalLight, CameraActor, PlayerStart, TriggerBox, ExponentialHeightFog, SkyLight, PostProcessVolume',
    {
      className: z.string().describe('UE class name (e.g., "StaticMeshActor", "PointLight")'),
      location: VectorSchema.optional().describe('World location (default: origin)'),
      rotation: RotatorSchema.optional().describe('World rotation'),
      label: z.string().optional().describe('Actor display name in the outliner'),
    },
    async ({ className, location, rotation, label }) => {
      try {
        const classPath = className.startsWith('/Script/')
          ? className
          : `/Script/Engine.${className}`;

        const params: Record<string, unknown> = {
          ActorClass: classPath,
        };
        if (location) {
          params.Location = { X: location.x, Y: location.y, Z: location.z };
        }
        if (rotation) {
          params.Rotation = { Pitch: rotation.pitch, Yaw: rotation.yaw, Roll: rotation.roll };
        }

        const result = await rc.callFunction(
          UE.EditorActorSubsystem,
          'SpawnActorFromClass',
          params,
        );

        // Set label if provided
        if (label && result) {
          const actorPath = typeof result === 'string' ? result : (result as Record<string, string>).ReturnValue;
          if (actorPath) {
            try {
              await rc.callFunction(actorPath, 'SetActorLabel', { NewActorLabel: label });
            } catch {
              // Label setting is best-effort
            }
          }
        }

        return successResult({ spawned: result, className: classPath, location, rotation, label });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to spawn actor: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_delete_actor',
    'Delete an actor from the current level by its object path',
    {
      actorPath: z.string().describe('Full object path of the actor (e.g., "/Game/Maps/Main.Main:PersistentLevel.StaticMeshActor_0")'),
    },
    async ({ actorPath }) => {
      try {
        await rc.callFunction(UE.EditorActorSubsystem, 'DestroyActor', {
          ActorToDestroy: actorPath,
        });
        return successResult({ deleted: actorPath });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to delete actor: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_duplicate_actor',
    'Duplicate an existing actor in the level',
    {
      actorPath: z.string().describe('Object path of the actor to duplicate'),
      offset: VectorSchema.optional().describe('Offset from original position'),
    },
    async ({ actorPath, offset }) => {
      try {
        const result = await rc.callFunction(UE.EditorActorSubsystem, 'DuplicateActor', {
          ActorToDuplicate: actorPath,
        });

        if (offset && result) {
          const dupPath = typeof result === 'string' ? result : (result as Record<string, string>).ReturnValue;
          if (dupPath) {
            try {
              const transform = (await rc.callFunction(dupPath, 'GetActorLocation', {})) as Record<string, unknown>;
              const loc = transform?.ReturnValue as Record<string, number> | undefined;
              if (loc) {
                await rc.callFunction(dupPath, 'SetActorLocation', {
                  NewLocation: {
                    X: (loc.X ?? 0) + offset.x,
                    Y: (loc.Y ?? 0) + offset.y,
                    Z: (loc.Z ?? 0) + offset.z,
                  },
                  bSweep: false,
                  bTeleport: true,
                });
              }
            } catch {
              // Offset is best-effort
            }
          }
        }

        return successResult({ duplicated: result, source: actorPath, offset });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to duplicate actor: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_get_all_actors',
    'List all actors in the current level. Optionally filter by class.',
    {
      classFilter: z.string().optional().describe('Filter by class name (e.g., "StaticMeshActor", "PointLight")'),
    },
    async ({ classFilter }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorActorSubsystem,
          'GetAllLevelActors',
          {},
        );
        let actors = ((result as Record<string, unknown>)?.ReturnValue ?? result) as unknown[];
        if (!Array.isArray(actors)) actors = [];

        if (classFilter) {
          actors = actors.filter((a) => {
            const path = typeof a === 'string' ? a : String(a);
            return path.toLowerCase().includes(classFilter.toLowerCase());
          });
        }

        return successResult({ count: actors.length, actors });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to list actors: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_get_selected_actors',
    'Get the currently selected actors in the UE editor',
    {},
    async () => {
      try {
        const result = await rc.callFunction(
          UE.EditorActorSubsystem,
          'GetSelectedLevelActors',
          {},
        );
        const actors = ((result as Record<string, unknown>)?.ReturnValue ?? result) as unknown[];
        return successResult({ count: Array.isArray(actors) ? actors.length : 0, actors });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to get selected actors: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_select_actors',
    'Set the editor selection to specific actors',
    {
      actorPaths: z.array(z.string()).describe('Array of actor object paths to select'),
    },
    async ({ actorPaths }) => {
      try {
        // Clear selection first
        await rc.callFunction(UE.EditorActorSubsystem, 'ClearActorSelectionSet', {});
        // Select each actor
        for (const path of actorPaths) {
          await rc.callFunction(UE.EditorActorSubsystem, 'SetActorSelectionState', {
            Actor: path,
            bShouldBeSelected: true,
          });
        }
        return successResult({ selected: actorPaths });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to select actors: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_set_actor_transform',
    'Set an actor\'s world transform (location, rotation, scale)',
    {
      actorPath: z.string().describe('Object path of the actor'),
      location: VectorSchema.optional().describe('New world location'),
      rotation: RotatorSchema.optional().describe('New world rotation'),
      scale: VectorSchema.optional().describe('New scale (default: 1,1,1)'),
    },
    async ({ actorPath, location, rotation, scale }) => {
      try {
        if (location) {
          await rc.callFunction(actorPath, 'SetActorLocation', {
            NewLocation: { X: location.x, Y: location.y, Z: location.z },
            bSweep: false,
            bTeleport: true,
          });
        }
        if (rotation) {
          await rc.callFunction(actorPath, 'SetActorRotation', {
            NewRotation: { Pitch: rotation.pitch, Yaw: rotation.yaw, Roll: rotation.roll },
            bTeleportPhysics: true,
          });
        }
        if (scale) {
          await rc.setProperty(actorPath, 'ActorScale3D', {
            X: scale.x,
            Y: scale.y,
            Z: scale.z,
          });
        }
        return successResult({ actorPath, location, rotation, scale });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to set transform: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_get_actor_transform',
    'Get an actor\'s world transform (location, rotation, scale)',
    {
      actorPath: z.string().describe('Object path of the actor'),
    },
    async ({ actorPath }) => {
      try {
        const locResult = await rc.callFunction(actorPath, 'GetActorLocation', {});
        const rotResult = await rc.callFunction(actorPath, 'GetActorRotation', {});
        const scaleResult = await rc.getProperty(actorPath, 'ActorScale3D');

        return successResult({
          actorPath,
          location: (locResult as Record<string, unknown>)?.ReturnValue ?? locResult,
          rotation: (rotResult as Record<string, unknown>)?.ReturnValue ?? rotResult,
          scale: scaleResult,
        });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to get transform: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_find_actors_by_name',
    'Search for actors in the level by display name (partial match)',
    {
      namePattern: z.string().describe('Name pattern to search for (case-insensitive)'),
    },
    async ({ namePattern }) => {
      try {
        const result = await rc.callFunction(
          UE.EditorActorSubsystem,
          'GetAllLevelActors',
          {},
        );
        const allActors = ((result as Record<string, unknown>)?.ReturnValue ?? result) as string[];
        if (!Array.isArray(allActors)) {
          return successResult({ count: 0, actors: [] });
        }

        const pattern = namePattern.toLowerCase();
        const matches = allActors.filter((a) => {
          const name = typeof a === 'string' ? a : String(a);
          return name.toLowerCase().includes(pattern);
        });

        return successResult({ count: matches.length, actors: matches, pattern: namePattern });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to find actors: ${error.message}`);
      }
    },
  );
}
