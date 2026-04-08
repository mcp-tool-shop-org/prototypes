import { describe, it, expect, vi, beforeEach } from 'vitest';
import { segmentReadme, cleanTranslation, translateReadme } from '../readmeTranslator.js';
import type { Segment } from '../readmeTranslator.js';

// Mock the translate function from polyglot-mcp
vi.mock('@mcptoolshop/polyglot-mcp/translate', () => ({
  translate: vi.fn(async (text: string) => ({
    translation: `[translated] ${text}`,
    durationMs: 100,
    chunks: 1,
  })),
}));

/* ========================================================================
 * segmentReadme — pure markdown parser
 * ======================================================================== */
describe('segmentReadme', () => {
  it('returns empty array for empty input', () => {
    expect(segmentReadme('')).toEqual([{ type: 'protected', text: '' }]);
  });

  it('detects fenced code blocks as protected', () => {
    const md = '```js\nconst x = 1;\n```';
    const segments = segmentReadme(md);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('protected');
    expect(segments[0].text).toBe(md);
  });

  it('preserves code block content exactly', () => {
    const code = '```python\ndef hello():\n    print("world")\n```';
    const segments = segmentReadme(code);
    expect(segments[0].text).toBe(code);
  });

  it('detects headings with prefix', () => {
    const segments = segmentReadme('## Installation');
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({
      type: 'heading',
      prefix: '## ',
      text: 'Installation',
    });
  });

  it('detects all heading levels (h1-h6)', () => {
    const levels = ['# H1', '## H2', '### H3', '#### H4', '##### H5', '###### H6'];
    for (const heading of levels) {
      const segments = segmentReadme(heading);
      expect(segments[0].type).toBe('heading');
    }
  });

  it('collects consecutive text lines as a single paragraph', () => {
    const md = 'Line one of paragraph.\nLine two of paragraph.';
    const segments = segmentReadme(md);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
    expect(segments[0].text).toBe(md);
  });

  it('treats empty lines as protected', () => {
    const md = 'Hello\n\nWorld';
    const segments = segmentReadme(md);
    const types = segments.map((s) => s.type);
    expect(types).toEqual(['text', 'protected', 'text']);
    expect(segments[1].text).toBe('');
  });

  it('detects horizontal rules as protected', () => {
    const segments = segmentReadme('---');
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('protected');
    expect(segments[0].text).toBe('---');
  });

  it('detects HTML blocks as protected', () => {
    const md = '<p align="center">\n<img src="logo.png" />\n</p>';
    const segments = segmentReadme(md);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('protected');
  });

  it('detects HTML taglines', () => {
    const md = '<p><strong>Local GPU translation for everyone</strong></p>';
    const segments = segmentReadme(md);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('html-tagline');
  });

  it('detects markdown tables', () => {
    const table = '| Feature | Status |\n| --- | --- |\n| Translation | Ready |';
    const segments = segmentReadme(table);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('table');
    expect(segments[0].text).toBe(table);
  });

  it('handles a realistic mixed README', () => {
    const md = [
      '# My Project',
      '',
      '<p align="center"><img src="logo.png"></p>',
      '',
      'A description paragraph.',
      '',
      '## Installation',
      '',
      '```bash',
      'npm install my-project',
      '```',
      '',
      '| Feature | Status |',
      '| --- | --- |',
      '| Core | Ready |',
      '',
      '---',
      '',
      'Footer text.',
    ].join('\n');

    const segments = segmentReadme(md);
    const types = segments.map((s) => s.type);

    expect(types).toEqual([
      'heading',     // # My Project
      'protected',   // empty line
      'protected',   // HTML block
      'protected',   // empty line
      'text',        // description
      'protected',   // empty line
      'heading',     // ## Installation
      'protected',   // empty line
      'protected',   // code block
      'protected',   // empty line
      'table',       // table
      'protected',   // empty line
      'protected',   // ---
      'protected',   // empty line
      'text',        // footer
    ]);
  });

  it('splits paragraphs at code blocks', () => {
    const md = 'Before code.\n```\ncode\n```\nAfter code.';
    const segments = segmentReadme(md);
    expect(segments[0].type).toBe('text');
    expect(segments[0].text).toBe('Before code.');
    expect(segments[1].type).toBe('protected');
    expect(segments[2].type).toBe('text');
    expect(segments[2].text).toBe('After code.');
  });

  it('handles unclosed code blocks gracefully', () => {
    const md = '```js\nconst x = 1;\nno closing fence';
    const segments = segmentReadme(md);
    // Should still produce a protected segment with all the content
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('protected');
  });
});

/* ========================================================================
 * cleanTranslation — TranslateGemma quirk removal
 * ======================================================================== */
describe('cleanTranslation', () => {
  it('returns clean text unchanged', () => {
    expect(cleanTranslation('Hello world')).toBe('Hello world');
  });

  it('strips Japanese "or" alternatives', () => {
    const text = '翻訳テスト\nまたは\n別の翻訳';
    expect(cleanTranslation(text)).toBe('翻訳テスト');
  });

  it('strips Korean "or" alternatives', () => {
    const text = '번역 테스트\n또는\n다른 번역';
    expect(cleanTranslation(text)).toBe('번역 테스트');
  });

  it('strips Spanish "or" alternatives', () => {
    const text = 'Prueba de traducción\no\nOtra traducción';
    expect(cleanTranslation(text)).toBe('Prueba de traducción');
  });

  it('strips French "or" alternatives', () => {
    const text = 'Test de traduction\nou\nautre traduction';
    expect(cleanTranslation(text)).toBe('Test de traduction');
  });

  it('strips German "or" alternatives', () => {
    const text = 'Übersetzungstest\noder\nandere Übersetzung';
    expect(cleanTranslation(text)).toBe('Übersetzungstest');
  });

  it('strips Russian "or" alternatives', () => {
    const text = 'Тест перевода\nили\nдругой перевод';
    expect(cleanTranslation(text)).toBe('Тест перевода');
  });

  it('strips Hindi "or" alternatives', () => {
    const text = 'अनुवाद परीक्षण\nया\nअन्य अनुवाद';
    expect(cleanTranslation(text)).toBe('अनुवाद परीक्षण');
  });

  it('strips Turkish "or" alternatives', () => {
    const text = 'Çeviri testi\nveya\nbir çeviri daha';
    expect(cleanTranslation(text)).toBe('Çeviri testi');
  });

  it('strips Thai "or" alternatives', () => {
    const text = 'ทดสอบแปลภาษา\nหรือ\nแปลอื่น';
    expect(cleanTranslation(text)).toBe('ทดสอบแปลภาษา');
  });

  it('strips Vietnamese "or" alternatives', () => {
    const text = 'Kiểm tra dịch\nhoặc\ndịch khác';
    expect(cleanTranslation(text)).toBe('Kiểm tra dịch');
  });

  it('removes trailing period on headings', () => {
    expect(cleanTranslation('インストール。', true)).toBe('インストール');
    expect(cleanTranslation('インストール．', true)).toBe('インストール');
    expect(cleanTranslation('Installation.', true)).toBe('Installation');
  });

  it('keeps trailing period on non-headings', () => {
    expect(cleanTranslation('This is a sentence.')).toBe('This is a sentence.');
  });

  it('trims whitespace', () => {
    expect(cleanTranslation('  Hello  ')).toBe('Hello');
  });

  it('handles combined quirks', () => {
    const text = '  見出し。\nまたは\n別のテキスト  ';
    expect(cleanTranslation(text, true)).toBe('見出し');
  });
});

/* ========================================================================
 * translateReadme — integration with mocked translate API
 * ======================================================================== */
describe('translateReadme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves protected segments (code blocks, HTML, empty lines)', async () => {
    const md = '```js\nconst x = 1;\n```';
    const result = await translateReadme(md, 'ja');
    expect(result).toBe(md);
  });

  it('translates heading text while keeping prefix', async () => {
    const result = await translateReadme('## Installation', 'ja');
    expect(result).toBe('## [translated] Installation');
  });

  it('translates paragraph text', async () => {
    const result = await translateReadme('Hello world', 'ja');
    expect(result).toBe('[translated] Hello world');
  });

  it('translates HTML taglines', async () => {
    const md = '<p><strong>Local GPU translation</strong></p>';
    const result = await translateReadme(md, 'ja');
    expect(result).toBe('<p><strong>[translated] Local GPU translation</strong></p>');
  });

  it('preserves empty lines between segments', async () => {
    const md = '## Title\n\nParagraph text.';
    const result = await translateReadme(md, 'ja');
    const lines = result.split('\n');
    expect(lines[0]).toBe('## [translated] Title');
    expect(lines[1]).toBe('');
    expect(lines[2]).toBe('[translated] Paragraph text.');
  });

  it('calls onProgress callback for each translated segment', async () => {
    const md = '## Heading\n\nParagraph.';
    const onProgress = vi.fn();
    await translateReadme(md, 'ja', { onProgress });
    expect(onProgress).toHaveBeenCalledTimes(2); // heading + paragraph
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('heading'));
    expect(onProgress).toHaveBeenCalledWith(expect.stringContaining('paragraph'));
  });

  it('preserves horizontal rules', async () => {
    const md = 'Text above\n\n---\n\nText below';
    const result = await translateReadme(md, 'ja');
    expect(result).toContain('---');
  });

  it('handles complex README with mixed content types', async () => {
    const md = [
      '# Project Name',
      '',
      'Description paragraph.',
      '',
      '```bash',
      'npm install',
      '```',
      '',
      '---',
    ].join('\n');

    const result = await translateReadme(md, 'es');
    const lines = result.split('\n');

    // Heading translated
    expect(lines[0]).toBe('# [translated] Project Name');
    // Empty line preserved
    expect(lines[1]).toBe('');
    // Paragraph translated
    expect(lines[2]).toBe('[translated] Description paragraph.');
    // Code block preserved exactly
    expect(lines[4]).toBe('```bash');
    expect(lines[5]).toBe('npm install');
    expect(lines[6]).toBe('```');
    // HR preserved
    expect(lines[8]).toBe('---');
  });
});
