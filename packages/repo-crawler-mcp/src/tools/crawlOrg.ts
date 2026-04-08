import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOrg } from '../utils/validation.js';
import { successResponse, handleToolError, errorResponse } from '../utils/errors.js';
import { ErrorCode } from '../types.js';
import type { CrawlResult, RepoMetadata, FailedRepo, DiscoveryMeta } from '../types.js';
import { log } from '../utils/logger.js';

async function crawlSingleRepo(
  adapter: PlatformAdapter,
  org: string,
  repo: RepoMetadata,
  args: {
    tier: string;
    commit_limit: number;
    contributor_limit: number;
    issue_limit: number;
    pr_limit: number;
    issue_state: 'open' | 'closed' | 'all';
    alert_limit: number;
  },
): Promise<CrawlResult> {
  const data = await adapter.fetchTier1(org, repo.name, {
    commitLimit: args.commit_limit,
    contributorLimit: args.contributor_limit,
  });

  const crawlResult: CrawlResult = {
    owner: org,
    repo: repo.name,
    crawledAt: new Date().toISOString(),
    cacheNote: 'Data may include cached API responses (metadata: 5min TTL, commits/search: 2min TTL). crawledAt reflects when this crawl ran, not when each API call was made.',
    tier: args.tier,
    sections: ['all'],
    data,
  };

  if (args.tier === '2' || args.tier === '3') {
    crawlResult.tier2Data = await adapter.fetchTier2(org, repo.name, {
      issueLimit: args.issue_limit,
      prLimit: args.pr_limit,
      issueState: args.issue_state,
    });
  }

  if (args.tier === '3') {
    crawlResult.tier3Data = await adapter.fetchTier3(org, repo.name, {
      alertLimit: args.alert_limit,
    });
  }

  return crawlResult;
}

export function registerCrawlOrgTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'crawl_org',
    'Crawl all repositories in a GitHub organization. Lists repos with filters, then crawls each at the specified tier. Returns an array of crawl results. Use concurrency to speed up large org scans.',
    {
      org: z.string().min(1).describe('GitHub organization name'),
      tier: z.enum(['1', '2', '3']).default('1').describe('Data tier per repo: 1=default, 2=advanced (issues/PRs/traffic), 3=security'),
      alert_limit: z.number().min(1).max(200).default(30).describe('Max security alerts per repo (Tier 3)'),
      min_stars: z.number().min(0).default(0).describe('Minimum stars filter'),
      language: z.string().optional().describe('Filter by primary language'),
      include_forks: z.boolean().default(false).describe('Include forked repos'),
      include_archived: z.boolean().default(false).describe('Include archived repos'),
      repo_limit: z.number().min(1).max(100).default(30).describe('Max repos to crawl'),
      commit_limit: z.number().min(1).max(100).default(10).describe('Max commits per repo'),
      contributor_limit: z.number().min(1).max(100).default(10).describe('Max contributors per repo'),
      issue_limit: z.number().min(1).max(500).default(50).describe('Max issues per repo (Tier 2)'),
      pr_limit: z.number().min(1).max(500).default(50).describe('Max PRs per repo (Tier 2)'),
      issue_state: z.enum(['open', 'closed', 'all']).default('all').describe('Issue/PR state filter (Tier 2)'),
      concurrency: z.number().min(1).max(10).default(3).describe('Number of repos to crawl in parallel (default: 3)'),
      page: z.number().min(1).default(1).describe('Page number (1-based) — paginates over the filtered repo list'),
    },
    async (args) => {
      try {
        validateOrg(args.org);

        // Fetch all matching repos up to a reasonable ceiling for pagination
        const allRepos = await adapter.listOrgRepos(args.org, {
          minStars: args.min_stars,
          language: args.language,
          includeForks: args.include_forks,
          includeArchived: args.include_archived,
          limit: args.repo_limit * args.page, // fetch enough for current page
        });

        // Discovery metadata — surfaces coverage, freshness, and absence truth
        const fetchLimit = args.repo_limit * args.page;
        const limitReached = allRepos.length >= fetchLimit;

        const discoveryMeta: DiscoveryMeta = {
          limitReached,
          matchingReposInLimit: allRepos.length,
          failedRepos: [],
          failedCount: 0,
          appliedFilters: {
            includeForks: args.include_forks,
            includeArchived: args.include_archived,
            minStars: args.min_stars || undefined,
            language: args.language || undefined,
          },
        };

        if (allRepos.length === 0) {
          return errorResponse(ErrorCode.ORG_NOT_FOUND, `No repos found for org "${args.org}" with the given filters`);
        }

        // Paginate: slice the repo list
        const startIdx = (args.page - 1) * args.repo_limit;
        const repos = allRepos.slice(startIdx, startIdx + args.repo_limit);

        if (repos.length === 0) {
          return successResponse({
            org: args.org,
            discovery: discoveryMeta,
            page: args.page,
            perPage: args.repo_limit,
            hasMore: false,
            totalCrawled: 0,
            results: [],
          });
        }

        log.info(`Crawling ${repos.length} repos in ${args.org} (page ${args.page}, tier ${args.tier}, concurrency ${args.concurrency})...`);

        const results: CrawlResult[] = [];
        const failedRepos: FailedRepo[] = [];
        let completed = 0;

        // Process repos in batches of `concurrency`
        for (let i = 0; i < repos.length; i += args.concurrency) {
          const batch = repos.slice(i, i + args.concurrency);

          const batchResults = await Promise.allSettled(
            batch.map(repo => crawlSingleRepo(adapter, args.org, repo, args)),
          );

          for (let j = 0; j < batchResults.length; j++) {
            completed++;
            const result = batchResults[j];
            if (result.status === 'fulfilled') {
              results.push(result.value);
              log.info(`  Crawled ${batch[j].name} (${completed}/${repos.length})`);
            } else {
              const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
              failedRepos.push({ name: batch[j].name, error: msg });
              log.warn(`  Failed to crawl ${batch[j].name}: ${msg}`);
            }
          }
        }

        discoveryMeta.failedRepos = failedRepos;
        discoveryMeta.failedCount = failedRepos.length;

        const hasMore = startIdx + repos.length < allRepos.length;

        return successResponse({
          org: args.org,
          discovery: discoveryMeta,
          page: args.page,
          perPage: args.repo_limit,
          hasMore,
          totalCrawled: results.length,
          results,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
