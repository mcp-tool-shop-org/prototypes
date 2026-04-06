import type { Config } from '../types.js';
import type {
  RCCallRequest,
  RCPropertyRequest,
  RCDescribeRequest,
  RCSearchRequest,
  RCBatchEntry,
  RCBatchResponse,
  RCInfoResponse,
  RCDescribeResponse,
  RCAssetInfo,
} from './rc-types.js';
import { RCError, mapHttpError } from './rc-errors.js';
import { ErrorCode } from '../types.js';
import { log } from '../utils/logger.js';

export interface RCClient {
  getInfo(): Promise<RCInfoResponse>;
  ping(): Promise<boolean>;
  callFunction(objectPath: string, functionName: string, params?: Record<string, unknown>): Promise<unknown>;
  getProperty(objectPath: string, propertyName: string): Promise<unknown>;
  setProperty(objectPath: string, propertyName: string, value: unknown): Promise<void>;
  describeObject(objectPath: string): Promise<RCDescribeResponse>;
  searchAssets(query: string, classNames?: string[], packagePaths?: string[]): Promise<RCAssetInfo[]>;
  batch(entries: RCBatchEntry[]): Promise<RCBatchResponse[]>;
}

export function createRCClient(config: Config): RCClient {
  const baseUrl = `http://${config.host}:${config.port}`;

  async function request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    log.debug(`${method} ${url}`, 'rc-client');

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(config.timeout),
      });
    } catch (err) {
      const error = err as Error;
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new RCError(ErrorCode.TIMEOUT, `Request timed out after ${config.timeout}ms`, { url });
      }
      throw new RCError(
        ErrorCode.CONNECTION_FAILED,
        'Cannot connect to Unreal Engine. Is the editor running with Remote Control API plugin enabled?',
        { url, cause: error.message },
      );
    }

    const text = await response.text();

    if (!response.ok) {
      throw mapHttpError(response.status, text, url);
    }

    if (!text) return undefined;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return {
    async getInfo(): Promise<RCInfoResponse> {
      return (await request('GET', '/remote/info')) as RCInfoResponse;
    },

    async ping(): Promise<boolean> {
      try {
        await request('GET', '/remote/info');
        return true;
      } catch {
        return false;
      }
    },

    async callFunction(
      objectPath: string,
      functionName: string,
      params?: Record<string, unknown>,
    ): Promise<unknown> {
      const body: RCCallRequest = { objectPath, functionName };
      if (params) body.parameters = params;
      return await request('PUT', '/remote/object/call', body);
    },

    async getProperty(objectPath: string, propertyName: string): Promise<unknown> {
      const body: RCPropertyRequest = {
        objectPath,
        propertyName,
        access: 'READ_ACCESS',
      };
      return await request('PUT', '/remote/object/property', body);
    },

    async setProperty(objectPath: string, propertyName: string, value: unknown): Promise<void> {
      const body: RCPropertyRequest = {
        objectPath,
        propertyName,
        access: 'WRITE_ACCESS',
        propertyValue: value,
      };
      await request('PUT', '/remote/object/property', body);
    },

    async describeObject(objectPath: string): Promise<RCDescribeResponse> {
      const body: RCDescribeRequest = { objectPath };
      return (await request('PUT', '/remote/object/describe', body)) as RCDescribeResponse;
    },

    async searchAssets(
      query: string,
      classNames?: string[],
      packagePaths?: string[],
    ): Promise<RCAssetInfo[]> {
      const body: RCSearchRequest = { query };
      if (classNames || packagePaths) {
        body.filter = {};
        if (classNames) body.filter.classNames = classNames;
        if (packagePaths) body.filter.packagePaths = packagePaths;
      }
      const result = (await request('PUT', '/remote/search/assets', body)) as { assets?: RCAssetInfo[] };
      return result?.assets ?? [];
    },

    async batch(entries: RCBatchEntry[]): Promise<RCBatchResponse[]> {
      const result = (await request('PUT', '/remote/batch', { requests: entries })) as {
        responses?: RCBatchResponse[];
      };
      return result?.responses ?? [];
    },
  };
}

// Well-known UE subsystem object paths
export const UE = {
  EditorActorSubsystem: '/Script/UnrealEd.Default__EditorActorSubsystem',
  EditorAssetLibrary: '/Script/EditorScriptingUtilities.Default__EditorAssetLibrary',
  EditorLoadingAndSavingUtils: '/Script/UnrealEd.Default__EditorLoadingAndSavingUtils',
  KismetSystemLibrary: '/Script/Engine.Default__KismetSystemLibrary',
  GameplayStatics: '/Script/Engine.Default__GameplayStatics',
} as const;
