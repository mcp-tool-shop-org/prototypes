import { describe, it, expect } from 'vitest';
import { ExportDataInputSchema } from '../../types.js';

describe('ExportDataInputSchema', () => {
  const minimalCrawlResult = {
    owner: 'test-org',
    repo: 'test-repo',
    crawledAt: '2026-01-01T00:00:00Z',
    tier: '1',
    data: { metadata: null, tree: [], languages: {} },
  };

  it('validates a single CrawlResult with JSON format', () => {
    const result = ExportDataInputSchema.safeParse({
      data: minimalCrawlResult,
      format: 'json',
    });
    expect(result.success).toBe(true);
  });

  it('validates a single CrawlResult with CSV format', () => {
    const result = ExportDataInputSchema.safeParse({
      data: minimalCrawlResult,
      format: 'csv',
    });
    expect(result.success).toBe(true);
  });

  it('validates a single CrawlResult with markdown format', () => {
    const result = ExportDataInputSchema.safeParse({
      data: minimalCrawlResult,
      format: 'markdown',
    });
    expect(result.success).toBe(true);
  });

  it('validates an array of CrawlResults', () => {
    const result = ExportDataInputSchema.safeParse({
      data: [minimalCrawlResult, { ...minimalCrawlResult, repo: 'other-repo' }],
      format: 'json',
    });
    expect(result.success).toBe(true);
  });

  it('validates with optional sections filter', () => {
    const result = ExportDataInputSchema.safeParse({
      data: minimalCrawlResult,
      format: 'csv',
      sections: ['metadata', 'tree'],
    });
    expect(result.success).toBe(true);
  });

  it('validates CrawlResult with tier2Data and tier3Data', () => {
    const result = ExportDataInputSchema.safeParse({
      data: {
        ...minimalCrawlResult,
        tier: '3',
        tier2Data: { issues: [], pullRequests: [] },
        tier3Data: { dependabotAlerts: [], permissions: {} },
      },
      format: 'markdown',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid format', () => {
    const result = ExportDataInputSchema.safeParse({
      data: minimalCrawlResult,
      format: 'xml',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty array of CrawlResults', () => {
    const result = ExportDataInputSchema.safeParse({
      data: [],
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects primitive data (string)', () => {
    const result = ExportDataInputSchema.safeParse({
      data: 'not a crawl result',
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects primitive data (number)', () => {
    const result = ExportDataInputSchema.safeParse({
      data: 42,
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('rejects null data', () => {
    const result = ExportDataInputSchema.safeParse({
      data: null,
      format: 'json',
    });
    expect(result.success).toBe(false);
  });

  it('accepts passthrough of extra fields', () => {
    const result = ExportDataInputSchema.safeParse({
      data: { ...minimalCrawlResult, extra_field: 'value' },
      format: 'json',
    });
    expect(result.success).toBe(true);
  });
});
