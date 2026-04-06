import { describe, it, expect } from 'vitest';
import {
    text,
    table,
    form,
    button,
    card,
    alert,
    progress,
    code,
    markdown,
} from '../ui-components/primitives';

describe('UI Primitives', () => {
    describe('text', () => {
        it('creates text component with default variant', () => {
            const component = text('Hello');
            expect(component.type).toBe('text');
            expect(component.props?.content).toBe('Hello');
            expect(component.props?.variant).toBe('body');
        });

        it('accepts variant option', () => {
            const component = text('Title', { variant: 'heading' });
            expect(component.props?.variant).toBe('heading');
        });
    });

    describe('markdown', () => {
        it('creates markdown component', () => {
            const component = markdown('# Hello');
            expect(component.type).toBe('markdown');
            expect(component.props?.content).toBe('# Hello');
        });
    });

    describe('code', () => {
        it('creates code component with language', () => {
            const component = code('const x = 1;', 'typescript');
            expect(component.type).toBe('code');
            expect(component.props?.content).toBe('const x = 1;');
            expect(component.props?.language).toBe('typescript');
        });

        it('defaults to plaintext', () => {
            const component = code('hello');
            expect(component.props?.language).toBe('plaintext');
        });
    });

    describe('table', () => {
        it('creates table with columns and data', () => {
            const columns = [{ key: 'name', header: 'Name' }];
            const data = [{ name: 'Alice' }];
            const component = table(columns, data);
            expect(component.type).toBe('table');
            expect(component.props?.columns).toEqual(columns);
            expect(component.props?.data).toEqual(data);
        });
    });

    describe('form', () => {
        it('creates form with fields', () => {
            const fields = [{ name: 'email', type: 'email' as const, label: 'Email' }];
            const component = form(fields);
            expect(component.type).toBe('form');
            expect(component.props?.fields).toEqual(fields);
        });

        it('includes submit event when handler provided', () => {
            const fields = [{ name: 'name', type: 'text' as const, label: 'Name' }];
            const component = form(fields, { onSubmit: 'handleSubmit' });
            expect(component.events?.submit).toBe('handleSubmit');
        });
    });

    describe('button', () => {
        it('creates button with label', () => {
            const component = button('Click me', { onClick: 'doAction' });
            expect(component.type).toBe('button');
            expect(component.props?.label).toBe('Click me');
            expect(component.events?.click).toBe('doAction');
        });

        it('accepts variant option', () => {
            const component = button('Delete', { variant: 'danger', onClick: 'doDelete' });
            expect(component.props?.variant).toBe('danger');
        });

        it('defaults to primary variant', () => {
            const component = button('OK');
            expect(component.props?.variant).toBe('primary');
        });
    });

    describe('card', () => {
        it('creates card with title and children', () => {
            const child = text('Content');
            const component = card([child], { title: 'My Card' });
            expect(component.type).toBe('card');
            expect(component.props?.title).toBe('My Card');
            expect(component.children).toHaveLength(1);
        });
    });

    describe('alert', () => {
        it('creates alert with message and type', () => {
            const component = alert('Something happened', { type: 'warning' });
            expect(component.type).toBe('alert');
            expect(component.props?.message).toBe('Something happened');
            expect(component.props?.alertType).toBe('warning');
        });

        it('defaults to info type', () => {
            const component = alert('Info message');
            expect(component.props?.alertType).toBe('info');
        });
    });

    describe('progress', () => {
        it('creates progress bar with value', () => {
            const component = progress(75);
            expect(component.type).toBe('progress');
            expect(component.props?.value).toBe(75);
        });

        it('defaults to max 100', () => {
            const component = progress(50);
            expect(component.props?.max).toBe(100);
        });
    });
});
