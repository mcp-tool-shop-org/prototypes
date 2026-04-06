import * as vscode from 'vscode';
import puppeteer, { type Browser } from 'puppeteer-core';
import { findBrowser, getSettings } from './browser';
import { getDomWalkerScript, type RawCapture } from './dom-walker';
import { compile } from './compiler';
import { renderLlmTree } from './render-llm-tree';
import { WebSketchPanel } from './webview/panel';
import { renderForLLM } from '@mcptoolshop/websketch-ir';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('websketch.capture', () => captureUrl(context)),
    vscode.commands.registerCommand('websketch.captureClipboard', () => captureFromClipboard(context)),
    vscode.commands.registerCommand('websketch.exportJson', () => exportJson()),
    vscode.commands.registerCommand('websketch.exportAscii', () => exportAscii()),
    vscode.commands.registerCommand('websketch.exportLlm', () => exportLlm()),
    vscode.commands.registerCommand('websketch.copyLlm', () => copyLlm()),
  );
}

export function deactivate() {}

async function captureUrl(context: vscode.ExtensionContext): Promise<void> {
  const url = await vscode.window.showInputBox({
    prompt: 'Enter URL to capture',
    placeHolder: 'https://example.com',
    validateInput: (v) => {
      try {
        new URL(v);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    },
  });
  if (!url) { return; }
  await runCapture(context, url);
}

async function captureFromClipboard(context: vscode.ExtensionContext): Promise<void> {
  const url = await vscode.env.clipboard.readText();
  if (!url) {
    vscode.window.showWarningMessage('Clipboard is empty');
    return;
  }
  try {
    new URL(url);
  } catch {
    vscode.window.showWarningMessage('Clipboard does not contain a valid URL');
    return;
  }
  await runCapture(context, url);
}

async function runCapture(context: vscode.ExtensionContext, url: string): Promise<void> {
  const settings = getSettings();

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `WebSketch: Capturing ${new URL(url).hostname}...`,
      cancellable: true,
    },
    async (progress, token) => {
      let browser: Browser | undefined;

      try {
        // Find browser
        progress.report({ message: 'Finding browser...' });
        const executablePath = findBrowser();

        // Launch
        progress.report({ message: 'Launching browser...' });
        browser = await puppeteer.launch({
          executablePath,
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            `--window-size=${settings.viewportWidth},${settings.viewportHeight}`,
          ],
        });

        if (token.isCancellationRequested) { return; }

        const page = await browser.newPage();
        await page.setViewport({
          width: settings.viewportWidth,
          height: settings.viewportHeight,
        });

        // Navigate
        progress.report({ message: 'Loading page...' });
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: settings.timeout,
        });

        if (token.isCancellationRequested) { return; }

        // Wait for JS rendering
        if (settings.waitAfterLoad > 0) {
          progress.report({ message: 'Waiting for rendering...' });
          await new Promise((r) => setTimeout(r, settings.waitAfterLoad));
        }

        // Inject DOM walker and capture
        progress.report({ message: 'Analyzing DOM...' });
        const walkerScript = getDomWalkerScript();
        const rawCapture = await page.evaluate(walkerScript) as RawCapture;

        if (token.isCancellationRequested) { return; }

        // Generate LLM tree from raw capture (before compilation strips labels)
        progress.report({ message: 'Rendering LLM tree...' });
        const llmTree = renderLlmTree(rawCapture);

        // Compile to IR
        progress.report({ message: 'Compiling IR...' });
        const capture = compile(rawCapture);

        // Show in webview
        WebSketchPanel.show(context.extensionUri, capture, llmTree);
      } catch (err: any) {
        if (err.message?.includes('Could not find')) {
          const action = await vscode.window.showErrorMessage(
            `WebSketch: ${err.message}`,
            'Open Settings'
          );
          if (action === 'Open Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'websketch.chromePath');
          }
        } else {
          vscode.window.showErrorMessage(`WebSketch: ${err.message || 'Capture failed'}`);
        }
      } finally {
        if (browser) {
          await browser.close().catch(() => {});
        }
      }
    }
  );
}

async function exportJson(): Promise<void> {
  const capture = WebSketchPanel.currentPanel?.getCapture();
  if (!capture) {
    vscode.window.showWarningMessage('No capture to export. Run WebSketch: Capture URL first.');
    return;
  }

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`websketch-${new URL(capture.url).hostname}.json`),
    filters: { 'JSON': ['json'] },
  });
  if (!uri) { return; }

  const content = JSON.stringify(capture, null, 2);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf-8'));
  vscode.window.showInformationMessage(`Saved JSON to ${uri.fsPath}`);
}

async function exportAscii(): Promise<void> {
  const capture = WebSketchPanel.currentPanel?.getCapture();
  if (!capture) {
    vscode.window.showWarningMessage('No capture to export. Run WebSketch: Capture URL first.');
    return;
  }

  const ascii = renderForLLM(capture);
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`websketch-${new URL(capture.url).hostname}.txt`),
    filters: { 'Text': ['txt'] },
  });
  if (!uri) { return; }

  await vscode.workspace.fs.writeFile(uri, Buffer.from(ascii, 'utf-8'));
  vscode.window.showInformationMessage(`Saved ASCII wireframe to ${uri.fsPath}`);
}

async function exportLlm(): Promise<void> {
  const llmTree = WebSketchPanel.currentPanel?.getLlmTree();
  if (!llmTree) {
    vscode.window.showWarningMessage('No capture to export. Run WebSketch: Capture URL first.');
    return;
  }

  const capture = WebSketchPanel.currentPanel?.getCapture();
  const hostname = capture ? new URL(capture.url).hostname : 'page';

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`websketch-${hostname}.md`),
    filters: { 'Markdown': ['md'], 'Text': ['txt'] },
  });
  if (!uri) { return; }

  await vscode.workspace.fs.writeFile(uri, Buffer.from(llmTree, 'utf-8'));
  vscode.window.showInformationMessage(`Saved LLM tree to ${uri.fsPath}`);
}

async function copyLlm(): Promise<void> {
  const llmTree = WebSketchPanel.currentPanel?.getLlmTree();
  if (!llmTree) {
    vscode.window.showWarningMessage('No capture to copy. Run WebSketch: Capture URL first.');
    return;
  }

  await vscode.env.clipboard.writeText(llmTree);
  vscode.window.showInformationMessage('LLM tree copied to clipboard');
}
