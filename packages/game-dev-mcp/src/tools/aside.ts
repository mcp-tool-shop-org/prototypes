import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { successResult } from '../utils/errors.js';
import { log } from '../utils/logger.js';

/**
 * Register aside-style observation tools for agent missions.
 *
 * When an LLM agent is on a multi-step "mission" inside UE5 (building a room,
 * setting up lighting, creating characters), it generates observations and
 * progress notes that shouldn't pollute the main tool call flow.
 *
 * These tools integrate with mcp-aside if available, or log to stderr as
 * fallback. The agent can push progress, warnings, and creative observations
 * while working autonomously.
 *
 * Usage pattern:
 *   1. Agent starts a mission: "Build a room with 4 walls, floor, ceiling, lights"
 *   2. As it works, it pushes asides: "Spawned floor (1/6)", "Wall north done (2/6)"
 *   3. If something goes wrong: "Actor path stale after reload — re-querying"
 *   4. Creative notes: "Room feels dark — suggesting warm PointLight at 5000 lux"
 */
export function registerAsideTools(server: McpServer): void {
  server.tool(
    'ue_mission_log',
    'Log a progress update, observation, or warning during a multi-step UE operation. Use this to track progress without cluttering the main conversation. Priority: "low" for routine progress, "med" for warnings or suggestions, "high" for critical issues (connection loss, unsaved work).',
    {
      message: z.string().describe('The observation or progress update'),
      priority: z.enum(['low', 'med', 'high']).default('low').describe('Importance level'),
      tags: z.array(z.string()).optional().describe('Tags for categorization (e.g., ["lighting", "progress"])'),
    },
    async ({ message, priority, tags }) => {
      // Log to stderr always (visible in server logs)
      const tagStr = tags?.length ? ` [${tags.join(', ')}]` : '';
      log.info(`[mission:${priority}]${tagStr} ${message}`, 'aside');

      return successResult({
        logged: true,
        message,
        priority,
        tags,
        hint: 'If mcp-aside is connected, use aside_push for async notifications to the user.',
      });
    },
  );

  server.tool(
    'ue_mission_summary',
    'Generate a structured summary of a completed or in-progress mission. Use after finishing a multi-step operation to give the user a clear overview of what was done.',
    {
      missionName: z.string().describe('Name of the mission (e.g., "Build a medieval room")'),
      steps: z.array(z.object({
        description: z.string(),
        status: z.enum(['done', 'skipped', 'failed']),
        actorPath: z.string().optional(),
      })).describe('Steps taken and their outcomes'),
      notes: z.array(z.string()).optional().describe('Additional observations or suggestions'),
    },
    async ({ missionName, steps, notes }) => {
      const done = steps.filter((s) => s.status === 'done').length;
      const failed = steps.filter((s) => s.status === 'failed').length;
      const skipped = steps.filter((s) => s.status === 'skipped').length;

      log.info(`[mission-summary] ${missionName}: ${done} done, ${failed} failed, ${skipped} skipped`, 'aside');

      return successResult({
        mission: missionName,
        total: steps.length,
        done,
        failed,
        skipped,
        steps,
        notes: notes ?? [],
      });
    },
  );
}
