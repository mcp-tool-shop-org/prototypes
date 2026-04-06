/**
 * MCP Apps UI Component Builders
 *
 * Higher-level builders for common UI patterns.
 */

import type { MCPUIComponent, MCPUITableColumn, MCPUIChartConfig } from '../mcp/types';
import { table, chart, card, form, alert, tabs, button, text, progress } from './primitives';

// ============================================================================
// Search Results Builder
// ============================================================================

export interface SearchResultsOptions {
    query: string;
    columns: MCPUITableColumn[];
    data: Record<string, unknown>[];
    totalCount: number;
    pageSize?: number;
}

export function searchResults(options: SearchResultsOptions): MCPUIComponent {
    const { query, columns, data, totalCount, pageSize = 10 } = options;

    return card(
        [
            text(`Found ${totalCount} results for "${query}"`, { variant: 'caption' }),
            table(columns, data, { pageSize, sortable: true, filterable: true }),
        ],
        {
            title: 'Search Results',
        }
    );
}

// ============================================================================
// Dashboard Builder
// ============================================================================

export interface DashboardMetric {
    label: string;
    value: string | number;
    change?: number; // Percentage change
    trend?: 'up' | 'down' | 'neutral';
}

export interface DashboardOptions {
    title: string;
    metrics: DashboardMetric[];
    chart?: MCPUIChartConfig;
    refreshTool?: string;
}

export function dashboard(options: DashboardOptions): MCPUIComponent {
    const { title, metrics, chart: chartConfig, refreshTool } = options;

    const metricCards = metrics.map((metric) =>
        card(
            [
                text(String(metric.value), { variant: 'heading' }),
                text(metric.label, { variant: 'caption' }),
            ],
            {
                subtitle: metric.change !== undefined
                    ? `${metric.change >= 0 ? '+' : ''}${metric.change}%`
                    : undefined,
            }
        )
    );

    const children: MCPUIComponent[] = [...metricCards];

    if (chartConfig) {
        children.push(chart(chartConfig));
    }

    return card(children, {
        title,
        actions: refreshTool
            ? [button('Refresh', { onClick: refreshTool, variant: 'secondary' })]
            : undefined,
    });
}

// ============================================================================
// Form Wizard Builder
// ============================================================================

export interface WizardStep {
    id: string;
    title: string;
    fields: Array<{
        name: string;
        type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox';
        label: string;
        required?: boolean;
        options?: Array<{ value: string; label: string }>;
    }>;
}

export interface WizardOptions {
    steps: WizardStep[];
    onSubmit: string;
    currentStep?: number;
}

export function wizard(options: WizardOptions): MCPUIComponent {
    const { steps, onSubmit, currentStep = 0 } = options;

    const tabItems = steps.map((step, index) => ({
        id: step.id,
        label: `${index + 1}. ${step.title}`,
        content: [
            form(
                step.fields.map((field) => ({
                    name: field.name,
                    type: field.type,
                    label: field.label,
                    required: field.required,
                    options: field.options,
                })),
                {
                    submitLabel: index === steps.length - 1 ? 'Submit' : 'Next',
                    onSubmit: index === steps.length - 1 ? onSubmit : undefined,
                }
            ),
        ],
    }));

    return card(
        [
            progress(((currentStep + 1) / steps.length) * 100, {
                label: `Step ${currentStep + 1} of ${steps.length}`,
            }),
            tabs(tabItems, { defaultTab: steps[currentStep]?.id }),
        ],
        { title: 'Setup Wizard' }
    );
}

// ============================================================================
// Confirmation Dialog Builder
// ============================================================================

export interface ConfirmationOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmTool: string;
    cancelTool?: string;
    variant?: 'default' | 'danger';
}

export function confirmation(options: ConfirmationOptions): MCPUIComponent {
    const {
        title,
        message,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        confirmTool,
        cancelTool,
        variant = 'default',
    } = options;

    return card(
        [
            text(message),
            card(
                [
                    button(cancelLabel, {
                        variant: 'secondary',
                        onClick: cancelTool,
                    }),
                    button(confirmLabel, {
                        variant: variant === 'danger' ? 'danger' : 'primary',
                        onClick: confirmTool,
                    }),
                ],
                {}
            ),
        ],
        { title }
    );
}

// ============================================================================
// Status Display Builder
// ============================================================================

export interface StatusItem {
    name: string;
    status: 'healthy' | 'warning' | 'error' | 'unknown';
    message?: string;
    lastCheck?: string;
}

export interface StatusDisplayOptions {
    title: string;
    items: StatusItem[];
    refreshTool?: string;
}

export function statusDisplay(options: StatusDisplayOptions): MCPUIComponent {
    const { title, items, refreshTool } = options;

    const statusAlerts = items.map((item) => {
        const alertType = {
            healthy: 'success' as const,
            warning: 'warning' as const,
            error: 'error' as const,
            unknown: 'info' as const,
        }[item.status];

        return alert(item.message || `${item.name} is ${item.status}`, {
            type: alertType,
            title: item.name,
            dismissible: false,
        });
    });

    return card(statusAlerts, {
        title,
        actions: refreshTool
            ? [button('Check Now', { onClick: refreshTool, variant: 'secondary' })]
            : undefined,
    });
}

// ============================================================================
// Empty State Builder
// ============================================================================

export interface EmptyStateOptions {
    title: string;
    description: string;
    actionLabel?: string;
    actionTool?: string;
}

export function emptyState(options: EmptyStateOptions): MCPUIComponent {
    const { title, description, actionLabel, actionTool } = options;

    const children: MCPUIComponent[] = [
        text(title, { variant: 'heading' }),
        text(description, { variant: 'caption' }),
    ];

    if (actionLabel && actionTool) {
        children.push(button(actionLabel, { onClick: actionTool }));
    }

    return card(children, {});
}

// ============================================================================
// Error Display Builder
// ============================================================================

export interface ErrorDisplayOptions {
    title?: string;
    message: string;
    details?: string;
    retryTool?: string;
}

export function errorDisplay(options: ErrorDisplayOptions): MCPUIComponent {
    const { title = 'Error', message, details, retryTool } = options;

    const children: MCPUIComponent[] = [
        alert(message, { type: 'error', title }),
    ];

    if (details) {
        children.push(
            card([text(details, { variant: 'caption' })], { title: 'Details' })
        );
    }

    if (retryTool) {
        children.push(button('Retry', { onClick: retryTool }));
    }

    return card(children, {});
}
