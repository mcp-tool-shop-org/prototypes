/**
 * MCP Apps UI Component Primitives
 *
 * Builder functions for creating MCP Apps UI components.
 * These align with the January 2026 MCP Apps standard.
 */

import type { MCPUIComponent, MCPUIFormField, MCPUITableColumn, MCPUIChartConfig } from '../mcp/types';

// ============================================================================
// Text Components
// ============================================================================

export function text(content: string, options?: { variant?: 'body' | 'heading' | 'caption' }): MCPUIComponent {
    return {
        type: 'text',
        props: {
            content,
            variant: options?.variant || 'body',
        },
    };
}

export function markdown(content: string): MCPUIComponent {
    return {
        type: 'markdown',
        props: { content },
    };
}

export function code(content: string, language?: string): MCPUIComponent {
    return {
        type: 'code',
        props: {
            content,
            language: language || 'plaintext',
        },
    };
}

// ============================================================================
// Data Display Components
// ============================================================================

export function table(
    columns: MCPUITableColumn[],
    data: Record<string, unknown>[],
    options?: {
        pageSize?: number;
        sortable?: boolean;
        filterable?: boolean;
    }
): MCPUIComponent {
    return {
        type: 'table',
        props: {
            columns,
            data,
            pageSize: options?.pageSize || 10,
            sortable: options?.sortable ?? true,
            filterable: options?.filterable ?? false,
        },
    };
}

export function chart(config: MCPUIChartConfig): MCPUIComponent {
    return {
        type: 'chart',
        props: { config },
    };
}

export function list(
    items: Array<{ id: string; content: string; icon?: string }>,
    options?: { selectable?: boolean; ordered?: boolean }
): MCPUIComponent {
    return {
        type: 'list',
        props: {
            items,
            selectable: options?.selectable ?? false,
            ordered: options?.ordered ?? false,
        },
    };
}

// ============================================================================
// Form Components
// ============================================================================

export function form(
    fields: MCPUIFormField[],
    options?: {
        submitLabel?: string;
        layout?: 'vertical' | 'horizontal' | 'grid';
        onSubmit?: string; // Tool name to call on submit
    }
): MCPUIComponent {
    return {
        type: 'form',
        props: {
            fields,
            submitLabel: options?.submitLabel || 'Submit',
            layout: options?.layout || 'vertical',
        },
        events: options?.onSubmit ? { submit: options.onSubmit } : undefined,
    };
}

export function input(
    name: string,
    options?: {
        type?: 'text' | 'number' | 'email' | 'password';
        placeholder?: string;
        label?: string;
        required?: boolean;
    }
): MCPUIComponent {
    return {
        type: 'input',
        props: {
            name,
            inputType: options?.type || 'text',
            placeholder: options?.placeholder,
            label: options?.label,
            required: options?.required ?? false,
        },
    };
}

export function select(
    name: string,
    options: Array<{ value: string; label: string }>,
    config?: {
        placeholder?: string;
        label?: string;
        required?: boolean;
        multiple?: boolean;
    }
): MCPUIComponent {
    return {
        type: 'select',
        props: {
            name,
            options,
            placeholder: config?.placeholder,
            label: config?.label,
            required: config?.required ?? false,
            multiple: config?.multiple ?? false,
        },
    };
}

export function checkbox(
    name: string,
    label: string,
    options?: { checked?: boolean }
): MCPUIComponent {
    return {
        type: 'checkbox',
        props: {
            name,
            label,
            checked: options?.checked ?? false,
        },
    };
}

// ============================================================================
// Interactive Components
// ============================================================================

export function button(
    label: string,
    options?: {
        variant?: 'primary' | 'secondary' | 'danger';
        onClick?: string; // Tool name to call on click
        disabled?: boolean;
    }
): MCPUIComponent {
    return {
        type: 'button',
        props: {
            label,
            variant: options?.variant || 'primary',
            disabled: options?.disabled ?? false,
        },
        events: options?.onClick ? { click: options.onClick } : undefined,
    };
}

export function progress(
    value: number,
    options?: {
        max?: number;
        label?: string;
        showPercentage?: boolean;
    }
): MCPUIComponent {
    return {
        type: 'progress',
        props: {
            value,
            max: options?.max || 100,
            label: options?.label,
            showPercentage: options?.showPercentage ?? true,
        },
    };
}

// ============================================================================
// Feedback Components
// ============================================================================

export function alert(
    message: string,
    options?: {
        type?: 'info' | 'success' | 'warning' | 'error';
        title?: string;
        dismissible?: boolean;
    }
): MCPUIComponent {
    return {
        type: 'alert',
        props: {
            message,
            alertType: options?.type || 'info',
            title: options?.title,
            dismissible: options?.dismissible ?? true,
        },
    };
}

// ============================================================================
// Layout Components
// ============================================================================

export function card(
    children: MCPUIComponent[],
    options?: {
        title?: string;
        subtitle?: string;
        actions?: MCPUIComponent[];
    }
): MCPUIComponent {
    return {
        type: 'card',
        props: {
            title: options?.title,
            subtitle: options?.subtitle,
            actions: options?.actions,
        },
        children,
    };
}

export function tabs(
    items: Array<{ id: string; label: string; content: MCPUIComponent[] }>,
    options?: { defaultTab?: string }
): MCPUIComponent {
    return {
        type: 'tabs',
        props: {
            items,
            defaultTab: options?.defaultTab || items[0]?.id,
        },
    };
}

export function accordion(
    items: Array<{ id: string; title: string; content: MCPUIComponent[] }>,
    options?: { allowMultiple?: boolean }
): MCPUIComponent {
    return {
        type: 'accordion',
        props: {
            items,
            allowMultiple: options?.allowMultiple ?? false,
        },
    };
}

export function dialog(
    children: MCPUIComponent[],
    options?: {
        title?: string;
        open?: boolean;
        onClose?: string; // Tool name to call on close
    }
): MCPUIComponent {
    return {
        type: 'dialog',
        props: {
            title: options?.title,
            open: options?.open ?? false,
        },
        children,
        events: options?.onClose ? { close: options.onClose } : undefined,
    };
}

// ============================================================================
// Media Components
// ============================================================================

export function image(
    src: string,
    options?: {
        alt?: string;
        width?: number;
        height?: number;
    }
): MCPUIComponent {
    return {
        type: 'image',
        props: {
            src,
            alt: options?.alt || '',
            width: options?.width,
            height: options?.height,
        },
    };
}

// ============================================================================
// Custom Components
// ============================================================================

export function custom(
    componentName: string,
    props: Record<string, unknown>
): MCPUIComponent {
    return {
        type: 'custom',
        props: {
            component: componentName,
            ...props,
        },
    };
}
