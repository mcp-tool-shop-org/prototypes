import * as vscode from 'vscode';
import type { WebSketchCapture } from '@mcptoolshop/websketch-ir';
import { generateHtml } from './html';

export class WebSketchPanel {
  public static currentPanel: WebSketchPanel | undefined;
  private static readonly viewType = 'websketch.preview';

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private capture: WebSketchCapture | undefined;
  private llmTree: string = '';
  private disposables: vscode.Disposable[] = [];

  public static show(extensionUri: vscode.Uri, capture: WebSketchCapture, llmTree: string): WebSketchPanel {
    const column = vscode.ViewColumn.Beside;

    if (WebSketchPanel.currentPanel) {
      WebSketchPanel.currentPanel.update(capture, llmTree);
      WebSketchPanel.currentPanel.panel.reveal(column);
      return WebSketchPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      WebSketchPanel.viewType,
      `WebSketch: ${new URL(capture.url).hostname}`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
      }
    );

    WebSketchPanel.currentPanel = new WebSketchPanel(panel, extensionUri, capture, llmTree);
    return WebSketchPanel.currentPanel;
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, capture: WebSketchCapture, llmTree: string) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.capture = capture;
    this.llmTree = llmTree;

    this.setHtml();

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      null,
      this.disposables
    );
  }

  public update(capture: WebSketchCapture, llmTree: string): void {
    this.capture = capture;
    this.llmTree = llmTree;
    this.panel.title = `WebSketch: ${new URL(capture.url).hostname}`;
    this.setHtml();
  }

  public getCapture(): WebSketchCapture | undefined {
    return this.capture;
  }

  public getLlmTree(): string | undefined {
    return this.llmTree || undefined;
  }

  private setHtml(): void {
    if (!this.capture) { return; }
    const nonce = getNonce();
    this.panel.webview.html = generateHtml(this.capture, this.llmTree, nonce);
  }

  private handleMessage(msg: { type: string; content?: string }): void {
    switch (msg.type) {
      case 'copy':
        if (msg.content) {
          vscode.env.clipboard.writeText(msg.content);
          vscode.window.showInformationMessage('Copied to clipboard');
        }
        break;
    }
  }

  private dispose(): void {
    WebSketchPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < 32; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}
