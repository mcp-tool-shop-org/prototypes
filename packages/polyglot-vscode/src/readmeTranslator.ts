/**
 * TypeScript port of polyglot-mcp/scripts/translate-readme.mjs
 * Translates README.md preserving code blocks, HTML, URLs, and structure.
 */

import { translate } from '@mcptoolshop/polyglot-mcp/translate';

export interface Segment {
  type: 'protected' | 'html-tagline' | 'heading' | 'text' | 'table';
  text: string;
  prefix?: string;
}

/** Parse README into segments: translatable text vs protected blocks. */
export function segmentReadme(md: string): Segment[] {
  const segments: Segment[] = [];
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block — protect entire block
    if (/^```/.test(line)) {
      const block = [line];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        block.push(lines[i]);
        i++;
      }
      if (i < lines.length) block.push(lines[i++]);
      segments.push({ type: 'protected', text: block.join('\n') });
      continue;
    }

    // HTML tagline like <p><strong>text</strong></p>
    if (/^<p[^>]*><strong>[^<]+<\/strong><\/p>/.test(line.trim())) {
      segments.push({ type: 'html-tagline', text: line });
      i++;
      continue;
    }

    // HTML block (badges, images, etc.) — protect
    if (/^<[a-z]/.test(line.trim())) {
      const block = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !/^(---|##)/.test(lines[i])
      ) {
        block.push(lines[i]);
        i++;
      }
      segments.push({ type: 'protected', text: block.join('\n') });
      continue;
    }

    // Horizontal rule — protect
    if (/^---\s*$/.test(line)) {
      segments.push({ type: 'protected', text: line });
      i++;
      continue;
    }

    // Empty line — protect
    if (line.trim() === '') {
      segments.push({ type: 'protected', text: '' });
      i++;
      continue;
    }

    // Table
    if (/^\|/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      segments.push({ type: 'table', text: tableLines.join('\n') });
      continue;
    }

    // Heading
    if (/^#{1,6}\s/.test(line)) {
      const match = line.match(/^(#{1,6}\s+)(.*)/);
      if (match) {
        segments.push({ type: 'heading', prefix: match[1], text: match[2] });
      }
      i++;
      continue;
    }

    // Regular text — collect consecutive lines as a paragraph
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(```|<[a-z]|---|#{1,6}\s|\|)/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    if (para.length > 0) {
      segments.push({ type: 'text', text: para.join('\n') });
    }
  }

  return segments;
}

/** Clean TranslateGemma quirks: strip "or" alternatives in various languages. */
export function cleanTranslation(text: string, isHeading = false): string {
  const orPatterns = [
    /\nまたは\n.*/s, // Japanese
    /\n또는\n.*/s, // Korean
    /\no\n[A-Z].*/s, // Spanish/Italian/Portuguese
    /\nou\n.*/s, // French/Portuguese
    /\noder\n.*/s, // German
    /\nили\n.*/s, // Russian
    /\nया\n.*/s, // Hindi
    /\nveya\n.*/s, // Turkish
    /\nหรือ\n.*/s, // Thai
    /\nhoặc\n.*/s, // Vietnamese
  ];
  let cleaned = text;
  for (const pat of orPatterns) {
    cleaned = cleaned.replace(pat, '');
  }
  if (isHeading) {
    cleaned = cleaned.replace(/[。．.]\s*$/, '');
  }
  return cleaned.trim();
}

/** Translate a text segment, skipping code-only or package-name segments. */
async function translateText(
  text: string,
  from: string,
  to: string,
  options: { ollamaUrl?: string; model?: string },
  isHeading = false
): Promise<string> {
  if (/^`[^`]+`$/.test(text.trim())) return text;
  if (/^@[\w-]+\//.test(text.trim())) return text;

  const result = await translate(text, from, to, options);
  return cleanTranslation(result.translation, isHeading);
}

/** Translate table cells, skipping separators and code cells. */
async function translateTable(
  tableText: string,
  from: string,
  to: string,
  options: { ollamaUrl?: string; model?: string }
): Promise<string> {
  const rows = tableText.split('\n');
  const translated: string[] = [];

  for (const row of rows) {
    // Separator row
    if (/^\|[\s-:|]+\|$/.test(row)) {
      translated.push(row);
      continue;
    }

    const cells = row.split('|').slice(1, -1);
    const newCells: string[] = [];

    for (const cell of cells) {
      const trimmed = cell.trim();
      if (
        /^`[^`]+`$/.test(trimmed) ||
        /^@[\w-]+\//.test(trimmed) ||
        (/^\*\*[A-Z]/.test(trimmed) && trimmed.length < 30) ||
        /^\d+$/.test(trimmed) ||
        /^\[.*\]\(.*\)$/.test(trimmed)
      ) {
        newCells.push(cell);
      } else if (trimmed.length > 5) {
        try {
          const t = await translateText(trimmed, from, to, options);
          newCells.push(` ${t} `);
        } catch {
          newCells.push(cell);
        }
      } else {
        newCells.push(cell);
      }
    }

    translated.push('|' + newCells.join('|') + '|');
  }

  return translated.join('\n');
}

export interface TranslateReadmeOptions {
  ollamaUrl?: string;
  model?: string;
  onProgress?: (msg: string) => void;
}

/**
 * Translate a README markdown string into the target language.
 * Returns the translated markdown content.
 */
export async function translateReadme(
  markdown: string,
  targetLang: string,
  options: TranslateReadmeOptions = {}
): Promise<string> {
  const segments = segmentReadme(markdown);
  const output: string[] = [];
  const translateOpts = {
    ollamaUrl: options.ollamaUrl,
    model: options.model,
  };
  let count = 0;

  for (const seg of segments) {
    switch (seg.type) {
      case 'protected':
        output.push(seg.text);
        break;

      case 'html-tagline': {
        const match = seg.text.match(/^(.+<strong>)([^<]+)(<\/strong>.+)$/);
        if (match) {
          const t = await translateText(
            match[2],
            'en',
            targetLang,
            translateOpts
          );
          output.push(match[1] + t + match[3]);
          count++;
          options.onProgress?.(`Translated HTML tagline (${count})`);
        } else {
          output.push(seg.text);
        }
        break;
      }

      case 'heading': {
        const t = await translateText(
          seg.text,
          'en',
          targetLang,
          translateOpts,
          true
        );
        output.push((seg.prefix ?? '') + t);
        count++;
        options.onProgress?.(`Translated heading: ${seg.text} (${count})`);
        break;
      }

      case 'text': {
        const t = await translateText(
          seg.text,
          'en',
          targetLang,
          translateOpts
        );
        output.push(t);
        count++;
        options.onProgress?.(`Translated paragraph (${count})`);
        break;
      }

      case 'table': {
        const t = await translateTable(
          seg.text,
          'en',
          targetLang,
          translateOpts
        );
        output.push(t);
        count++;
        options.onProgress?.(`Translated table (${count})`);
        break;
      }
    }
  }

  return output.join('\n');
}
