import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { RCClient } from '../client/rc-client.js';
import { UE } from '../client/rc-client.js';
import { VectorSchema, RotatorSchema } from '../types.js';
import { successResult, errorResult } from '../utils/errors.js';
import { ErrorCode } from '../types.js';

export function registerBlueprintTools(server: McpServer, rc: RCClient): void {
  server.tool(
    'ue_create_blueprint',
    'Create a new Blueprint class. Common parent classes: Actor, Pawn, Character, GameModeBase, PlayerController, HUD, ActorComponent, SceneComponent',
    {
      name: z.string().describe('Blueprint name (e.g., "BP_MyActor")'),
      parentClass: z.string().default('Actor').describe('Parent class name'),
      path: z.string().default('/Game').describe('Content directory to create in'),
    },
    async ({ name, parentClass, path }) => {
      try {
        // Use EditorAssetLibrary to create a Blueprint asset
        // The RC API doesn't have a direct CreateBlueprint endpoint, so we use
        // the asset factory system via callFunction
        const fullPath = `${path}/${name}`;
        const result = await rc.callFunction(
          '/Script/UnrealEd.Default__EditorAssetSubsystem',
          'CreateBlueprintAsset',
          {
            AssetPath: fullPath,
            ParentClass: parentClass.startsWith('/Script/')
              ? parentClass
              : `/Script/Engine.${parentClass}`,
          },
        );
        return successResult({ created: fullPath, parentClass, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to create Blueprint: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_add_component',
    'Add a component to a Blueprint. Common components: StaticMeshComponent, PointLightComponent, BoxCollisionComponent, SphereCollisionComponent, AudioComponent, ParticleSystemComponent, CameraComponent, ArrowComponent',
    {
      blueprintPath: z.string().describe('Blueprint asset path'),
      componentClass: z.string().describe('Component class name (e.g., "StaticMeshComponent")'),
      componentName: z.string().describe('Name for the new component'),
    },
    async ({ blueprintPath, componentClass, componentName }) => {
      try {
        const result = await rc.callFunction(
          '/Script/UnrealEd.Default__EditorAssetSubsystem',
          'AddComponentToBlueprint',
          {
            BlueprintPath: blueprintPath,
            ComponentClass: componentClass.startsWith('/Script/')
              ? componentClass
              : `/Script/Engine.${componentClass}`,
            ComponentName: componentName,
          },
        );
        return successResult({ added: componentName, componentClass, blueprintPath, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to add component: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_set_component_property',
    'Set a property on a Blueprint\'s component',
    {
      blueprintPath: z.string().describe('Blueprint asset path'),
      componentName: z.string().describe('Component name within the Blueprint'),
      property: z.string().describe('Property name'),
      value: z.unknown().describe('Property value'),
    },
    async ({ blueprintPath, componentName, property, value }) => {
      try {
        // Construct the component's object path within the Blueprint
        const componentPath = `${blueprintPath}:${componentName}`;
        await rc.setProperty(componentPath, property, value);
        return successResult({ set: true, componentPath, property, value });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to set component property: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_compile_blueprint',
    'Compile a Blueprint to check for errors and update instances',
    {
      blueprintPath: z.string().describe('Blueprint asset path'),
    },
    async ({ blueprintPath }) => {
      try {
        const result = await rc.callFunction(
          '/Script/UnrealEd.Default__KismetEditorUtilities',
          'CompileBlueprint',
          { BlueprintObj: blueprintPath },
        );
        return successResult({ compiled: blueprintPath, result });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to compile Blueprint: ${error.message}`);
      }
    },
  );

  server.tool(
    'ue_spawn_blueprint_actor',
    'Spawn an actor from a Blueprint asset in the current level',
    {
      blueprintPath: z.string().describe('Blueprint asset path (e.g., "/Game/Blueprints/BP_MyActor")'),
      location: VectorSchema.optional().describe('World location'),
      rotation: RotatorSchema.optional().describe('World rotation'),
    },
    async ({ blueprintPath, location, rotation }) => {
      try {
        const params: Record<string, unknown> = {
          ActorClass: blueprintPath,
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
        return successResult({ spawned: result, blueprintPath, location, rotation });
      } catch (err) {
        const error = err as Error;
        return errorResult(ErrorCode.RC_API_ERROR, `Failed to spawn Blueprint actor: ${error.message}`);
      }
    },
  );
}
