import * as vscode from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class OutputChannelLogger {
    private readonly channel: vscode.OutputChannel;

    constructor(channel: vscode.OutputChannel) {
        this.channel = channel;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toISOString();
        const levelStr = level.toUpperCase().padEnd(5);
        return `[${timestamp}] [${levelStr}] ${message}`;
    }

    private log(level: LogLevel, message: string, error?: unknown): void {
        const formattedMessage = this.formatMessage(level, message);
        this.channel.appendLine(formattedMessage);

        if (error) {
            if (error instanceof Error) {
                this.channel.appendLine(`  Error: ${error.message}`);
                if (error.stack) {
                    this.channel.appendLine(`  Stack: ${error.stack}`);
                }
            } else {
                this.channel.appendLine(`  Error: ${String(error)}`);
            }
        }
    }

    debug(message: string): void {
        this.log('debug', message);
    }

    info(message: string): void {
        this.log('info', message);
    }

    warn(message: string): void {
        this.log('warn', message);
    }

    error(message: string, error?: unknown): void {
        this.log('error', message, error);
    }

    show(): void {
        this.channel.show();
    }
}
