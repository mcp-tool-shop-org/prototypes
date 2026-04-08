import type { CacheStats } from '../utils/cache.js';
import type {
  Tier1Data,
  Tier2Data,
  Tier3Data,
  RepoMetadata,
  RateLimitInfo,
  SearchResult,
  FileContent,
  CommitDiff,
  WorkflowRunInfo,
} from '../types.js';

export interface FetchOptions {
  sections?: string[];
  excludeSections?: string[];
  commitLimit?: number;
  contributorLimit?: number;
}

export interface Tier2FetchOptions {
  sections?: string[];
  excludeSections?: string[];
  issueLimit?: number;
  prLimit?: number;
  issueState?: 'open' | 'closed' | 'all';
}

export interface OrgListOptions {
  minStars?: number;
  language?: string;
  includeForks?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

export interface Tier3FetchOptions {
  sections?: string[];
  excludeSections?: string[];
  alertLimit?: number;
}

export interface SearchOptions {
  query: string;
  language?: string;
  topic?: string;
  minStars?: number;
  maxStars?: number;
  sort?: 'stars' | 'forks' | 'updated';
  order?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export interface PlatformAdapter {
  readonly platform: string;
  fetchTier1(owner: string, repo: string, options?: FetchOptions): Promise<Tier1Data>;
  fetchTier2(owner: string, repo: string, options?: Tier2FetchOptions): Promise<Tier2Data>;
  fetchTier3(owner: string, repo: string, options?: Tier3FetchOptions): Promise<Tier3Data>;
  listOrgRepos(org: string, options?: OrgListOptions): Promise<RepoMetadata[]>;
  searchRepos(options: SearchOptions): Promise<SearchResult>;
  getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent>;
  getCommitDiff(owner: string, repo: string, ref: string, includePatch?: boolean): Promise<CommitDiff>;
  getWorkflowRuns(owner: string, repo: string, limit?: number, page?: number): Promise<{ runs: WorkflowRunInfo[]; totalCount: number; page: number; hasMore: boolean }>;
  getRateLimit(): Promise<RateLimitInfo>;
  clearCache(): number;
  getCacheStats(): CacheStats;
}
