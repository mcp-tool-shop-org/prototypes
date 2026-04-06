import { describe, it, expect } from 'vitest';
import {
    list,
    input,
    select,
    checkbox,
    tabs,
    accordion,
    dialog,
    image,
    custom,
} from '../ui-components/primitives';

describe('UI Primitives (extended)', () => {
    describe('list', () => {
        it('creates list with items', () => {
            const items = [{ id: '1', content: 'Item 1' }];
            const component = list(items);
            expect(component.type).toBe('list');
            expect(component.props?.items).toEqual(items);
        });

        it('defaults to non-selectable and unordered', () => {
            const component = list([]);
            expect(component.props?.selectable).toBe(false);
            expect(component.props?.ordered).toBe(false);
        });

        it('accepts selectable and ordered options', () => {
            const component = list([], { selectable: true, ordered: true });
            expect(component.props?.selectable).toBe(true);
            expect(component.props?.ordered).toBe(true);
        });
    });

    describe('input', () => {
        it('creates input with name', () => {
            const component = input('email');
            expect(component.type).toBe('input');
            expect(component.props?.name).toBe('email');
        });

        it('defaults to text type', () => {
            const component = input('field');
            expect(component.props?.inputType).toBe('text');
        });

        it('accepts type, placeholder, label, and required', () => {
            const component = input('password', {
                type: 'password',
                placeholder: 'Enter...',
                label: 'Password',
                required: true,
            });
            expect(component.props?.inputType).toBe('password');
            expect(component.props?.placeholder).toBe('Enter...');
            expect(component.props?.label).toBe('Password');
            expect(component.props?.required).toBe(true);
        });

        it('defaults required to false', () => {
            const component = input('name');
            expect(component.props?.required).toBe(false);
        });
    });

    describe('select', () => {
        const options = [
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
        ];

        it('creates select with name and options', () => {
            const component = select('color', options);
            expect(component.type).toBe('select');
            expect(component.props?.name).toBe('color');
            expect(component.props?.options).toEqual(options);
        });

        it('defaults required and multiple to false', () => {
            const component = select('color', options);
            expect(component.props?.required).toBe(false);
            expect(component.props?.multiple).toBe(false);
        });

        it('accepts config options', () => {
            const component = select('tags', options, {
                placeholder: 'Choose...',
                label: 'Tags',
                required: true,
                multiple: true,
            });
            expect(component.props?.placeholder).toBe('Choose...');
            expect(component.props?.label).toBe('Tags');
            expect(component.props?.required).toBe(true);
            expect(component.props?.multiple).toBe(true);
        });
    });

    describe('checkbox', () => {
        it('creates checkbox with name and label', () => {
            const component = checkbox('agree', 'I agree');
            expect(component.type).toBe('checkbox');
            expect(component.props?.name).toBe('agree');
            expect(component.props?.label).toBe('I agree');
        });

        it('defaults checked to false', () => {
            const component = checkbox('opt', 'Option');
            expect(component.props?.checked).toBe(false);
        });

        it('accepts checked option', () => {
            const component = checkbox('opt', 'Option', { checked: true });
            expect(component.props?.checked).toBe(true);
        });
    });

    describe('tabs', () => {
        const items = [
            { id: 'tab1', label: 'Tab 1', content: [] },
            { id: 'tab2', label: 'Tab 2', content: [] },
        ];

        it('creates tabs component', () => {
            const component = tabs(items);
            expect(component.type).toBe('tabs');
            expect(component.props?.items).toEqual(items);
        });

        it('defaults to first tab', () => {
            const component = tabs(items);
            expect(component.props?.defaultTab).toBe('tab1');
        });

        it('accepts defaultTab option', () => {
            const component = tabs(items, { defaultTab: 'tab2' });
            expect(component.props?.defaultTab).toBe('tab2');
        });
    });

    describe('accordion', () => {
        const items = [
            { id: 'a1', title: 'Section 1', content: [] },
            { id: 'a2', title: 'Section 2', content: [] },
        ];

        it('creates accordion component', () => {
            const component = accordion(items);
            expect(component.type).toBe('accordion');
            expect(component.props?.items).toEqual(items);
        });

        it('defaults allowMultiple to false', () => {
            const component = accordion(items);
            expect(component.props?.allowMultiple).toBe(false);
        });

        it('accepts allowMultiple option', () => {
            const component = accordion(items, { allowMultiple: true });
            expect(component.props?.allowMultiple).toBe(true);
        });
    });

    describe('dialog', () => {
        it('creates dialog with children', () => {
            const component = dialog([], { title: 'Confirm' });
            expect(component.type).toBe('dialog');
            expect(component.props?.title).toBe('Confirm');
            expect(component.children).toEqual([]);
        });

        it('defaults open to false', () => {
            const component = dialog([]);
            expect(component.props?.open).toBe(false);
        });

        it('accepts open and onClose options', () => {
            const component = dialog([], { open: true, onClose: 'handleClose' });
            expect(component.props?.open).toBe(true);
            expect(component.events?.close).toBe('handleClose');
        });

        it('has no events when onClose is not provided', () => {
            const component = dialog([]);
            expect(component.events).toBeUndefined();
        });
    });

    describe('image', () => {
        it('creates image component', () => {
            const component = image('https://example.com/img.png');
            expect(component.type).toBe('image');
            expect(component.props?.src).toBe('https://example.com/img.png');
        });

        it('defaults alt to empty string', () => {
            const component = image('src.png');
            expect(component.props?.alt).toBe('');
        });

        it('accepts alt, width, and height', () => {
            const component = image('src.png', { alt: 'Logo', width: 200, height: 100 });
            expect(component.props?.alt).toBe('Logo');
            expect(component.props?.width).toBe(200);
            expect(component.props?.height).toBe(100);
        });
    });

    describe('custom', () => {
        it('creates custom component with name and props', () => {
            const component = custom('MyWidget', { color: 'red', size: 42 });
            expect(component.type).toBe('custom');
            expect(component.props?.component).toBe('MyWidget');
            expect(component.props?.color).toBe('red');
            expect(component.props?.size).toBe(42);
        });
    });
});
