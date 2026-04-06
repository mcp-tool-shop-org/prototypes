import type { Article } from './types.js';
import type { SearchResult } from './types.js';
import { loadArticles } from './loader.js';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreArticle(article: Article, queryTokens: string[]): number {
  let score = 0;
  const titleLower = article.title.toLowerCase();
  const tagsLower = article.tags.map((t) => t.toLowerCase());
  const summaryLower = article.summary.toLowerCase();
  const contentLower = article.content.toLowerCase();

  for (const token of queryTokens) {
    // Title match — highest weight
    if (titleLower.includes(token)) score += 3;
    // Tag match
    if (tagsLower.some((t) => t.includes(token))) score += 2;
    // Summary match
    if (summaryLower.includes(token)) score += 1.5;
    // Body match
    if (contentLower.includes(token)) score += 1;
  }

  return score;
}

export function searchKnowledge(
  query: string,
  category?: string,
  maxResults = 5,
): SearchResult[] {
  const articles = loadArticles();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) return [];

  let candidates = articles;
  if (category) {
    candidates = candidates.filter((a) => a.category === category);
  }

  const scored = candidates
    .map((article) => ({
      article,
      score: scoreArticle(article, queryTokens),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map((s) => ({
    title: s.article.title,
    category: s.article.category,
    slug: s.article.slug,
    summary: s.article.summary,
    score: s.score,
    uri: `unreal://knowledge/${s.article.category}/${s.article.slug}`,
  }));
}
