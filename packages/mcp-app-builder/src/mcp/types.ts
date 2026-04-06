/**
 * MCP App Builder - Core Types
 *
 * These types define the structure for MCP servers and tools,
 * aligned with the Model Context Protocol specification.
 */

// ============================================================================
// Tool Definition Types
// ============================================================================

export interface MCPToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
    default?: unknown;
    enum?: string[];
    items?: MCPToolParameter; // For array types
    properties?: Record<string, MCPToolParameter>; // For object types
}

export interface MCPToolDefinition {
    name: string;
    description: string;
    parameters: MCPToolParameter[];
    returns?: {
        type: string;
        description: string;
    };
    examples?: Array<{
        input: Record<string, unknown>;
        output: unknown;
        description?: string;
    }>;
}

// ============================================================================
// Resource Types
// ============================================================================

export interface MCPResource {
    uri: string;
    name: string;
    mimeType?: string;
    description?: string;
}

export interface MCPResourceTemplate {
    uriTemplate: string;
    name: string;
    mimeType?: string;
    description?: string;
}

// ============================================================================
// Prompt Types
// ============================================================================

export interface MCPPromptArgument {
    name: string;
    description?: string;
    required?: boolean;
}

export interface MCPPrompt {
    name: string;
    description?: string;
    arguments?: MCPPromptArgument[];
}

// ============================================================================
// Server Configuration
// ============================================================================

export interface MCPServerConfig {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    repository?: string;
    tools?: MCPToolDefinition[];
    resources?: MCPResource[];
    resourceTemplates?: MCPResourceTemplate[];
    prompts?: MCPPrompt[];
    capabilities?: MCPCapabilities;
    transport?: MCPTransportConfig;
}

export interface MCPCapabilities {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
    experimental?: Record<string, boolean>;
}

// ============================================================================
// MCP Apps UI Component Types (January 2026 Standard)
// ============================================================================

export type MCPUIComponentType =
    | 'text'
    | 'markdown'
    | 'code'
    | 'table'
    | 'form'
    | 'chart'
    | 'image'
    | 'button'
    | 'input'
    | 'select'
    | 'checkbox'
    | 'progress'
    | 'alert'
    | 'card'
    | 'list'
    | 'tabs'
    | 'accordion'
    | 'dialog'
    | 'custom';

export interface MCPUIComponent {
    type: MCPUIComponentType;
    id?: string;
    props?: Record<string, unknown>;
    children?: MCPUIComponent[];
    events?: Record<string, string>; // Event name -> handler tool name
}

export interface MCPUIFormField {
    name: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: Array<{ value: string; label: string }>;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

export interface MCPUITableColumn {
    key: string;
    header: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

export interface MCPUIChartConfig {
    type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
    data: {
        labels: string[];
        datasets: Array<{
            label: string;
            data: number[];
            color?: string;
        }>;
    };
    options?: {
        title?: string;
        legend?: boolean;
        animate?: boolean;
    };
}

// ============================================================================
// Tool Response Types
// ============================================================================

export interface MCPToolResult {
    content: MCPContent[];
    isError?: boolean;
}

export type MCPContent =
    | MCPTextContent
    | MCPImageContent
    | MCPResourceContent
    | MCPUIContent;

export interface MCPTextContent {
    type: 'text';
    text: string;
}

export interface MCPImageContent {
    type: 'image';
    data: string; // Base64 encoded
    mimeType: string;
}

export interface MCPResourceContent {
    type: 'resource';
    resource: MCPResource;
}

export interface MCPUIContent {
    type: 'ui';
    component: MCPUIComponent;
}

// ============================================================================
// Transport Types
// ============================================================================

export type MCPTransportType = 'stdio' | 'http' | 'websocket';

export interface MCPTransportConfig {
    type: MCPTransportType;
    command?: string;
    args?: string[];
    options?: {
        port?: number;
        host?: string;
        path?: string;
        tls?: boolean;
    };
}

// ============================================================================
// Error Types
// ============================================================================

export interface MCPError {
    code: number;
    message: string;
    data?: unknown;
}

export const MCPErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    SERVER_ERROR: -32000,
} as const;
