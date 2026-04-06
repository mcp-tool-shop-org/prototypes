import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { Article, ArticleMeta, KnowledgeIndex } from './types.js';
import { log } from '../utils/logger.js';

let cachedArticles: Article[] | null = null;
let cachedIndex: KnowledgeIndex | null = null;

function getKnowledgeDir(): string {
  // Resolve relative to this module — works for both dev and npm-installed
  const thisFile = new URL(import.meta.url).pathname;
  // On Windows, URL pathname starts with /C:/ — strip leading slash
  const normalized = process.platform === 'win32' && thisFile.startsWith('/')
    ? thisFile.slice(1)
    : thisFile;
  const srcDir = path.dirname(path.dirname(normalized));
  return path.join(srcDir, '..', 'knowledge');
}

function scanMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function parseArticle(filePath: string, knowledgeDir: string): Article | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    // Derive category and slug from file path
    const relative = path.relative(knowledgeDir, filePath).replace(/\\/g, '/');
    const parts = relative.replace(/\.md$/, '').split('/');
    const category = parts.length > 1 ? parts[0] : 'general';
    const slug = parts[parts.length - 1];

    return {
      title: (data.title as string) ?? slug,
      category,
      slug,
      tags: Array.isArray(data.tags) ? data.tags : [],
      difficulty: (['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
        ? data.difficulty
        : 'beginner') as Article['difficulty'],
      summary: (data.summary as string) ?? '',
      ueVersion: data.ueVersion as string | undefined,
      content,
      filePath,
    };
  } catch (err) {
    log.warn(`Failed to parse knowledge article: ${filePath}: ${err}`, 'knowledge');
    return null;
  }
}

export function loadArticles(): Article[] {
  if (cachedArticles) return cachedArticles;

  const knowledgeDir = getKnowledgeDir();
  log.debug(`Loading knowledge from: ${knowledgeDir}`, 'knowledge');

  const files = scanMarkdownFiles(knowledgeDir);
  cachedArticles = files
    .map((f) => parseArticle(f, knowledgeDir))
    .filter((a): a is Article => a !== null);

  log.info(`Loaded ${cachedArticles.length} knowledge articles`, 'knowledge');
  return cachedArticles;
}

export function getArticle(category: string, slug: string): Article | undefined {
  const articles = loadArticles();
  return articles.find((a) => a.category === category && a.slug === slug);
}

export function getIndex(): KnowledgeIndex {
  if (cachedIndex) return cachedIndex;

  const articles = loadArticles();
  const categories = [...new Set(articles.map((a) => a.category))].sort();

  const articleMetas: ArticleMeta[] = articles.map(({ content: _c, filePath: _f, ...meta }) => meta);

  cachedIndex = {
    totalArticles: articles.length,
    categories,
    articles: articleMetas,
  };

  return cachedIndex;
}
