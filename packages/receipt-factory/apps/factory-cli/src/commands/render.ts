import { readFileSync, writeFileSync } from "node:fs";
import { renderMarkdown, renderHtml } from "@receipt-factory/render";
import type { Receipt } from "@receipt-factory/core";
import { RfError } from "@receipt-factory/core";

export interface RenderOptions {
  format: string;
  output?: string;
}

export function handleRender(file: string, opts: RenderOptions): void {
  try {
    const raw = readFileSync(file, "utf-8");
    const receipt = JSON.parse(raw) as Receipt;

    let rendered: string;
    let ext: string;

    switch (opts.format) {
      case "md":
      case "markdown":
        rendered = renderMarkdown(receipt);
        ext = ".md";
        break;
      case "html":
        rendered = renderHtml(receipt);
        ext = ".html";
        break;
      default:
        console.error(`Unknown format: ${opts.format}. Supported: md, html`);
        process.exit(1);
    }

    if (opts.output) {
      writeFileSync(opts.output, rendered, "utf-8");
      console.log(`Rendered to: ${opts.output}`);
    } else {
      // Default: write alongside the JSON file
      const outPath = file.replace(/\.json$/, ext);
      writeFileSync(outPath, rendered, "utf-8");
      console.log(`Rendered to: ${outPath}`);
    }
  } catch (err) {
    if (err instanceof RfError) {
      console.error(err.toCliText());
      process.exit(2);
    }
    if (err instanceof SyntaxError) {
      console.error(`[RF_PARSE] Failed to parse ${file}: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
