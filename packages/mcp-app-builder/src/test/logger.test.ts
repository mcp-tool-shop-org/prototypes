import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OutputChannelLogger } from '../utils/logger';

function createMockChannel() {
    return {
        appendLine: vi.fn(),
        append: vi.fn(),
        show: vi.fn(),
        dispose: vi.fn(),
        clear: vi.fn(),
        name: 'Test',
        replace: vi.fn(),
        hide: vi.fn(),
    };
}

describe('OutputChannelLogger', () => {
    let channel: ReturnType<typeof createMockChannel>;
    let logger: OutputChannelLogger;

    beforeEach(() => {
        channel = createMockChannel();
        logger = new OutputChannelLogger(channel as never);
    });

    it('logs debug messages with correct format', () => {
        logger.debug('test message');
        expect(channel.appendLine).toHaveBeenCalledTimes(1);
        const msg = channel.appendLine.mock.calls[0][0] as string;
        expect(msg).toMatch(/\[.*\] \[DEBUG\] test message/);
    });

    it('logs info messages with correct format', () => {
        logger.info('info message');
        const msg = channel.appendLine.mock.calls[0][0] as string;
        expect(msg).toMatch(/\[.*\] \[INFO \] info message/);
    });

    it('logs warn messages with correct format', () => {
        logger.warn('warning');
        const msg = channel.appendLine.mock.calls[0][0] as string;
        expect(msg).toMatch(/\[.*\] \[WARN \] warning/);
    });

    it('logs error messages with correct format', () => {
        logger.error('error occurred');
        const msg = channel.appendLine.mock.calls[0][0] as string;
        expect(msg).toMatch(/\[.*\] \[ERROR\] error occurred/);
    });

    it('includes Error details when provided', () => {
        const err = new Error('something broke');
        logger.error('failure', err);
        expect(channel.appendLine).toHaveBeenCalledTimes(3); // message + error + stack
        expect(channel.appendLine.mock.calls[1][0]).toContain('Error: something broke');
        expect(channel.appendLine.mock.calls[2][0]).toContain('Stack:');
    });

    it('includes non-Error details as string', () => {
        logger.error('failure', 'string error');
        expect(channel.appendLine).toHaveBeenCalledTimes(2);
        expect(channel.appendLine.mock.calls[1][0]).toContain('Error: string error');
    });

    it('includes Error without stack gracefully', () => {
        const err = new Error('no stack');
        err.stack = undefined;
        logger.error('failure', err);
        expect(channel.appendLine).toHaveBeenCalledTimes(2); // message + error (no stack)
        expect(channel.appendLine.mock.calls[1][0]).toContain('Error: no stack');
    });

    it('includes ISO timestamp', () => {
        logger.info('test');
        const msg = channel.appendLine.mock.calls[0][0] as string;
        // ISO 8601 timestamp pattern
        expect(msg).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('delegates show() to channel', () => {
        logger.show();
        expect(channel.show).toHaveBeenCalledTimes(1);
    });
});
