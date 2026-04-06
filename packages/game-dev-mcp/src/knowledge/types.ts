export interface ArticleMeta {
  title: string;
  category: string;
  slug: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  ueVersion?: string;
}

export interface Article extends ArticleMeta {
  content: string;
  filePath: string;
}

export interface KnowledgeIndex {
  totalArticles: number;
  categories: string[];
  articles: ArticleMeta[];
}

export interface SearchResult {
  title: string;
  category: string;
  slug: string;
  summary: string;
  score: number;
  uri: string;
}
