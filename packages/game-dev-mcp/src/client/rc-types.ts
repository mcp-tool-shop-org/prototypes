// ============================================================================
// UE5 Remote Control API Request/Response Types
// ============================================================================

export interface RCCallRequest {
  objectPath: string;
  functionName: string;
  parameters?: Record<string, unknown>;
  generateTransaction?: boolean;
}

export interface RCPropertyRequest {
  objectPath: string;
  propertyName: string;
  access: 'READ_ACCESS' | 'WRITE_ACCESS';
  propertyValue?: unknown;
}

export interface RCDescribeRequest {
  objectPath: string;
}

export interface RCSearchRequest {
  query: string;
  filter?: {
    classNames?: string[];
    packagePaths?: string[];
    recursive?: boolean;
  };
}

export interface RCBatchEntry {
  requestId: number;
  url: string;
  verb: string;
  body: Record<string, unknown>;
}

export interface RCBatchResponse {
  requestId: number;
  responseCode: number;
  responseBody: unknown;
}

export interface RCInfoResponse {
  isEditor: boolean;
  httpServerPort: number;
  plugins: string[];
  routes: Array<{
    verb: string;
    path: string;
  }>;
}

export interface RCDescribeResponse {
  name: string;
  class: string;
  functions: Array<{
    name: string;
    description?: string;
    arguments?: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  }>;
  properties: Array<{
    name: string;
    type: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface RCAssetInfo {
  name: string;
  path: string;
  class: string;
}
