import { describe, it, expect } from 'vitest';
import {
    searchResults,
    dashboard,
    wizard,
    confirmation,
    statusDisplay,
    emptyState,
    errorDisplay,
} from '../ui-components/builders';
import type { MCPUIComponent } from '../mcp/types';

describe('UI Builders', () => {
    describe('searchResults', () => {
        it('creates a card with results summary and table', () => {
            const component = searchResults({
                query: 'test',
                columns: [{ key: 'name', header: 'Name' }],
                data: [{ name: 'Alice' }],
                totalCount: 1,
            });
            expect(component.type).toBe('card');
            expect(component.props?.title).toBe('Search Results');
            expect(component.children).toHaveLength(2); // text + table
            expect(component.children![0].type).toBe('text');
            expect(component.children![0].props?.content).toContain('1 results');
            expect(component.children![1].type).toBe('table');
        });

        it('uses default pageSize of 10', () => {
            const component = searchResults({
                query: 'q',
                columns: [],
                data: [],
                totalCount: 0,
            });
            const tableChild = component.children![1];
            expect(tableChild.props?.pageSize).toBe(10);
        });

        it('accepts custom pageSize', () => {
            const component = searchResults({
                query: 'q',
                columns: [],
                data: [],
                totalCount: 0,
                pageSize: 25,
            });
            const tableChild = component.children![1];
            expect(tableChild.props?.pageSize).toBe(25);
        });
    });

    describe('dashboard', () => {
        it('creates a dashboard with metric cards', () => {
            const component = dashboard({
                title: 'Stats',
                metrics: [
                    { label: 'Users', value: 100, change: 5 },
                    { label: 'Revenue', value: '$1k', change: -2 },
                ],
            });
            expect(component.type).toBe('card');
            expect(component.props?.title).toBe('Stats');
            // 2 metric cards as children
            expect(component.children!.length).toBe(2);
        });

        it('includes chart when provided', () => {
            const component = dashboard({
                title: 'Stats',
                metrics: [],
                chart: {
                    type: 'bar',
                    data: { labels: ['A'], datasets: [{ label: 'Set', data: [1] }] },
                },
            });
            expect(component.children!.some((c) => c.type === 'chart')).toBe(true);
        });

        it('includes refresh button when refreshTool provided', () => {
            const component = dashboard({
                title: 'Stats',
                metrics: [],
                refreshTool: 'refreshData',
            });
            const actions = component.props?.actions as MCPUIComponent[];
            expect(actions).toHaveLength(1);
            expect(actions[0].props?.label).toBe('Refresh');
        });

        it('has no actions without refreshTool', () => {
            const component = dashboard({ title: 'Stats', metrics: [] });
            expect(component.props?.actions).toBeUndefined();
        });

        it('formats positive and negative change in subtitle', () => {
            const component = dashboard({
                title: 'Stats',
                metrics: [
                    { label: 'Up', value: 10, change: 5 },
                    { label: 'Down', value: 10, change: -3 },
                ],
            });
            expect(component.children![0].props?.subtitle).toBe('+5%');
            expect(component.children![1].props?.subtitle).toBe('-3%');
        });
    });

    describe('wizard', () => {
        const steps = [
            {
                id: 'step1',
                title: 'Step 1',
                fields: [{ name: 'name', type: 'text' as const, label: 'Name' }],
            },
            {
                id: 'step2',
                title: 'Step 2',
                fields: [{ name: 'email', type: 'email' as const, label: 'Email' }],
            },
        ];

        it('creates a card with progress and tabs', () => {
            const component = wizard({ steps, onSubmit: 'submit' });
            expect(component.type).toBe('card');
            expect(component.props?.title).toBe('Setup Wizard');
            expect(component.children).toHaveLength(2); // progress + tabs
            expect(component.children![0].type).toBe('progress');
            expect(component.children![1].type).toBe('tabs');
        });

        it('sets progress based on current step', () => {
            const component = wizard({ steps, onSubmit: 'submit', currentStep: 1 });
            const progressChild = component.children![0];
            expect(progressChild.props?.value).toBe(100); // (1+1)/2 * 100
            expect(progressChild.props?.label).toBe('Step 2 of 2');
        });

        it('defaults to step 0', () => {
            const component = wizard({ steps, onSubmit: 'submit' });
            const progressChild = component.children![0];
            expect(progressChild.props?.value).toBe(50); // (0+1)/2 * 100
        });

        it('labels last step Submit and others Next', () => {
            const component = wizard({ steps, onSubmit: 'submit' });
            const tabsChild = component.children![1];
            const tabItems = tabsChild.props?.items as Array<{
                id: string;
                label: string;
                content: Array<{ props?: Record<string, unknown> }>;
            }>;
            // First step form: "Next"
            expect(tabItems[0].content[0].props?.submitLabel).toBe('Next');
            // Last step form: "Submit"
            expect(tabItems[1].content[0].props?.submitLabel).toBe('Submit');
        });
    });

    describe('confirmation', () => {
        it('creates a card with message and action buttons', () => {
            const component = confirmation({
                title: 'Delete?',
                message: 'Are you sure?',
                confirmTool: 'doDelete',
            });
            expect(component.type).toBe('card');
            expect(component.props?.title).toBe('Delete?');
            expect(component.children).toHaveLength(2); // text + button card
        });

        it('uses default labels', () => {
            const component = confirmation({
                title: 'Confirm',
                message: 'OK?',
                confirmTool: 'confirm',
            });
            const buttonCard = component.children![1];
            const buttons = buttonCard.children!;
            expect(buttons[0].props?.label).toBe('Cancel');
            expect(buttons[1].props?.label).toBe('Confirm');
        });

        it('accepts custom labels', () => {
            const component = confirmation({
                title: 'Delete',
                message: 'Sure?',
                confirmLabel: 'Yes, delete',
                cancelLabel: 'No, keep',
                confirmTool: 'del',
            });
            const buttonCard = component.children![1];
            expect(buttonCard.children![0].props?.label).toBe('No, keep');
            expect(buttonCard.children![1].props?.label).toBe('Yes, delete');
        });

        it('uses danger variant for confirm button when specified', () => {
            const component = confirmation({
                title: 'Delete',
                message: 'Sure?',
                confirmTool: 'del',
                variant: 'danger',
            });
            const buttonCard = component.children![1];
            expect(buttonCard.children![1].props?.variant).toBe('danger');
        });

        it('uses primary variant by default', () => {
            const component = confirmation({
                title: 'Confirm',
                message: 'OK?',
                confirmTool: 'confirm',
            });
            const buttonCard = component.children![1];
            expect(buttonCard.children![1].props?.variant).toBe('primary');
        });
    });

    describe('statusDisplay', () => {
        it('creates alerts for each status item', () => {
            const component = statusDisplay({
                title: 'Health',
                items: [
                    { name: 'API', status: 'healthy' },
                    { name: 'DB', status: 'error', message: 'Connection lost' },
                ],
            });
            expect(component.type).toBe('card');
            expect(component.props?.title).toBe('Health');
            expect(component.children).toHaveLength(2);
        });

        it('maps status to alert types', () => {
            const component = statusDisplay({
                title: 'Health',
                items: [
                    { name: 'A', status: 'healthy' },
                    { name: 'B', status: 'warning' },
                    { name: 'C', status: 'error' },
                    { name: 'D', status: 'unknown' },
                ],
            });
            expect(component.children![0].props?.alertType).toBe('success');
            expect(component.children![1].props?.alertType).toBe('warning');
            expect(component.children![2].props?.alertType).toBe('error');
            expect(component.children![3].props?.alertType).toBe('info');
        });

        it('uses custom message when provided', () => {
            const component = statusDisplay({
                title: 'Health',
                items: [{ name: 'DB', status: 'error', message: 'Timeout' }],
            });
            expect(component.children![0].props?.message).toBe('Timeout');
        });

        it('uses default message when no custom message', () => {
            const component = statusDisplay({
                title: 'Health',
                items: [{ name: 'API', status: 'healthy' }],
            });
            expect(component.children![0].props?.message).toBe('API is healthy');
        });

        it('includes refresh button when refreshTool provided', () => {
            const component = statusDisplay({
                title: 'Health',
                items: [],
                refreshTool: 'checkHealth',
            });
            const actions = component.props?.actions as MCPUIComponent[];
            expect(actions).toHaveLength(1);
            expect(actions[0].props?.label).toBe('Check Now');
        });
    });

    describe('emptyState', () => {
        it('creates a card with title and description', () => {
            const component = emptyState({
                title: 'No items',
                description: 'Create your first item.',
            });
            expect(component.type).toBe('card');
            expect(component.children).toHaveLength(2); // heading + caption
            expect(component.children![0].props?.variant).toBe('heading');
            expect(component.children![1].props?.variant).toBe('caption');
        });

        it('includes action button when provided', () => {
            const component = emptyState({
                title: 'No items',
                description: 'Get started.',
                actionLabel: 'Create',
                actionTool: 'createItem',
            });
            expect(component.children).toHaveLength(3);
            expect(component.children![2].type).toBe('button');
            expect(component.children![2].props?.label).toBe('Create');
        });

        it('has no button without actionLabel', () => {
            const component = emptyState({
                title: 'Empty',
                description: 'Nothing here.',
            });
            expect(component.children).toHaveLength(2);
        });
    });

    describe('errorDisplay', () => {
        it('creates a card with error alert', () => {
            const component = errorDisplay({ message: 'Something went wrong' });
            expect(component.type).toBe('card');
            expect(component.children![0].type).toBe('alert');
            expect(component.children![0].props?.alertType).toBe('error');
        });

        it('defaults title to Error', () => {
            const component = errorDisplay({ message: 'Oops' });
            expect(component.children![0].props?.title).toBe('Error');
        });

        it('accepts custom title', () => {
            const component = errorDisplay({ title: 'Fatal', message: 'Oops' });
            expect(component.children![0].props?.title).toBe('Fatal');
        });

        it('includes details card when provided', () => {
            const component = errorDisplay({
                message: 'Error',
                details: 'Stack trace here',
            });
            expect(component.children).toHaveLength(2);
            expect(component.children![1].type).toBe('card');
            expect(component.children![1].props?.title).toBe('Details');
        });

        it('includes retry button when retryTool provided', () => {
            const component = errorDisplay({
                message: 'Error',
                retryTool: 'retryAction',
            });
            const retryBtn = component.children!.find((c) => c.type === 'button');
            expect(retryBtn).toBeDefined();
            expect(retryBtn!.props?.label).toBe('Retry');
            expect(retryBtn!.events?.click).toBe('retryAction');
        });

        it('includes both details and retry', () => {
            const component = errorDisplay({
                message: 'Error',
                details: 'Detail text',
                retryTool: 'retry',
            });
            expect(component.children).toHaveLength(3); // alert + details + retry
        });
    });
});
