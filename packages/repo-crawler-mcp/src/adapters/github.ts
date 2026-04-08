import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { log } from '../utils/logger.js';
import { ResponseCache, type CacheStats } from '../utils/cache.js';
import { TIER1_SECTIONS, TIER2_SECTIONS, TIER3_SECTIONS } from '../types.js';
import type {
  Tier1Data,
  Tier2Data,
  Tier3Data,
  RepoMetadata,
  FileTreeEntry,
  ReadmeContent,
  CommitSummary,
  ContributorInfo,
  BranchInfo,
  TagInfo,
  ReleaseInfo,
  CommunityProfile,
  WorkflowInfo,
  RateLimitInfo,
  Tier1Section,
  Tier2Section,
  Tier3Section,
  TrafficData,
  IssueDetail,
  PullRequestDetail,
  MilestoneInfo,
  DiscussionInfo,
  PermissionStatus,
  DependabotAlert,
  SecurityAdvisory,
  SBOMData,
  CodeScanningAlert,
  SecretScanningAlert,
  SearchResult,
  SearchResultItem,
  FileContent,
  CommitDiff,
  CommitDiffFile,
  WorkflowRunInfo,
} from '../types.js';
import type { PlatformAdapter, FetchOptions, Tier2FetchOptions, Tier3FetchOptions, OrgListOptions, SearchOptions } from './types.js';

const ThrottledOctokit = Octokit.plugin(throttling);

function createOctokit(): InstanceType<typeof ThrottledOctokit> {
  const token = process.env.GITHUB_TOKEN;
  return new ThrottledOctokit({
    auth: token || undefined,
    throttle: {
      onRateLimit: (retryAfter: number, options: Record<string, unknown>, _octokit: unknown, retryCount: number) => {
        log.warn(`Rate limit hit for ${options.method} ${options.url}. Retry after ${retryAfter}s`);
        return retryCount < 2;
      },
      onSecondaryRateLimit: (retryAfter: number, options: Record<string, unknown>) => {
        log.warn(`Secondary rate limit for ${options.method} ${options.url}. Wait ${retryAfter}s`);
        return false;
      },
    },
  });
}

function resolveSections(options?: FetchOptions): Set<Tier1Section> {
  let sections: Set<Tier1Section>;
  if (options?.sections && options.sections.length > 0) {
    sections = new Set(options.sections.filter(s => (TIER1_SECTIONS as readonly string[]).includes(s)) as Tier1Section[]);
  } else {
    sections = new Set([...TIER1_SECTIONS]);
  }
  if (options?.excludeSections) {
    for (const s of options.excludeSections) {
      sections.delete(s as Tier1Section);
    }
  }
  return sections;
}

function resolveTier2Sections(options?: Tier2FetchOptions): Set<Tier2Section> {
  let sections: Set<Tier2Section>;
  if (options?.sections && options.sections.length > 0) {
    sections = new Set(options.sections.filter(s => (TIER2_SECTIONS as readonly string[]).includes(s)) as Tier2Section[]);
  } else {
    sections = new Set([...TIER2_SECTIONS]);
  }
  if (options?.excludeSections) {
    for (const s of options.excludeSections) {
      sections.delete(s as Tier2Section);
    }
  }
  return sections;
}

function resolveTier3Sections(options?: Tier3FetchOptions): Set<Tier3Section> {
  let sections: Set<Tier3Section>;
  if (options?.sections && options.sections.length > 0) {
    sections = new Set(options.sections.filter(s => (TIER3_SECTIONS as readonly string[]).includes(s)) as Tier3Section[]);
  } else {
    sections = new Set([...TIER3_SECTIONS]);
  }
  if (options?.excludeSections) {
    for (const s of options.excludeSections) {
      sections.delete(s as Tier3Section);
    }
  }
  return sections;
}

function settled<T>(result: PromiseSettledResult<T | null>, label?: string): T | null {
  if (result.status === 'rejected') {
    log.warn(`Parallel fetch failed${label ? ` (${label})` : ''}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    return null;
  }
  return result.value;
}

/** TTL values in milliseconds for different data types */
const CACHE_TTL = {
  metadata: 5 * 60 * 1000,   // 5 min — rarely changes
  tree: 5 * 60 * 1000,       // 5 min
  languages: 10 * 60 * 1000, // 10 min — very stable
  readme: 5 * 60 * 1000,     // 5 min
  community: 10 * 60 * 1000, // 10 min
  commits: 2 * 60 * 1000,    // 2 min — changes often
  contributors: 10 * 60 * 1000, // 10 min
  branches: 5 * 60 * 1000,   // 5 min
  tags: 5 * 60 * 1000,       // 5 min
  releases: 5 * 60 * 1000,   // 5 min
  workflows: 5 * 60 * 1000,  // 5 min
  issues: 2 * 60 * 1000,     // 2 min
  pullRequests: 2 * 60 * 1000, // 2 min
  traffic: 5 * 60 * 1000,    // 5 min
  security: 5 * 60 * 1000,   // 5 min
  search: 2 * 60 * 1000,     // 2 min
  fileContent: 5 * 60 * 1000, // 5 min
  commitDiff: 10 * 60 * 1000, // 10 min — immutable
  workflowRuns: 2 * 60 * 1000, // 2 min
} as const;

export class GitHubAdapter implements PlatformAdapter {
  readonly platform = 'github';
  private octokit: InstanceType<typeof ThrottledOctokit>;
  private cache: ResponseCache;

  constructor() {
    this.octokit = createOctokit();
    this.cache = new ResponseCache();
    const hasToken = !!process.env.GITHUB_TOKEN;
    log.info(`GitHub adapter initialized (auth: ${hasToken ? 'token' : 'none'})`);
  }

  clearCache(): number {
    return this.cache.clear();
  }

  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }

  async fetchTier1(owner: string, repo: string, options?: FetchOptions): Promise<Tier1Data> {
    const sections = resolveSections(options);

    // Fetch metadata first if needed (tree depends on default_branch)
    let metadata: RepoMetadata | null = null;
    if (sections.has('metadata') || sections.has('tree')) {
      try {
        metadata = await this.fetchMetadata(owner, repo);
      } catch (e) {
        log.warn(`Failed to fetch metadata for ${owner}/${repo}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    // Parallel fetch for independent single-call endpoints
    const [treeR, languagesR, readmeR, communityR] = await Promise.allSettled([
      sections.has('tree') ? this.fetchTree(owner, repo, metadata?.default_branch) : null,
      sections.has('languages') ? this.fetchLanguages(owner, repo) : null,
      sections.has('readme') ? this.fetchReadme(owner, repo) : null,
      sections.has('community') ? this.fetchCommunity(owner, repo) : null,
    ]);

    // Sequential paginated fetches
    const commits = sections.has('commits')
      ? await this.fetchCommits(owner, repo, options?.commitLimit ?? 30)
      : [];
    const contributors = sections.has('contributors')
      ? await this.fetchContributors(owner, repo, options?.contributorLimit ?? 30)
      : [];
    const branches = sections.has('branches')
      ? await this.fetchBranches(owner, repo)
      : [];
    const tags = sections.has('tags')
      ? await this.fetchTags(owner, repo)
      : [];
    const releases = sections.has('releases')
      ? await this.fetchReleases(owner, repo)
      : [];
    const workflows = sections.has('workflows')
      ? await this.fetchWorkflows(owner, repo)
      : [];

    const rateLimit = await this.getRateLimit();

    return {
      metadata: sections.has('metadata') ? metadata : null,
      tree: settled(treeR, 'tree') ?? [],
      languages: settled(languagesR, 'languages') ?? {},
      readme: settled(readmeR, 'readme'),
      commits,
      contributors,
      branches,
      tags,
      releases,
      community: settled(communityR, 'community'),
      workflows,
      rateLimit,
    };
  }

  async listOrgRepos(org: string, options?: OrgListOptions): Promise<RepoMetadata[]> {
    const limit = options?.limit ?? 30;
    const repos: RepoMetadata[] = [];

    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listForOrg,
      { org, per_page: 100, sort: 'updated', direction: 'desc', type: 'sources' },
    )) {
      for (const r of response.data) {
        // Apply filters
        if (!options?.includeForks && r.fork) continue;
        if (!options?.includeArchived && r.archived) continue;
        if (options?.minStars && (r.stargazers_count ?? 0) < options.minStars) continue;
        if (options?.language && r.language?.toLowerCase() !== options.language.toLowerCase()) continue;

        repos.push(this.mapRepoMetadata(r));
        if (repos.length >= limit) break;
      }
      if (repos.length >= limit) break;
    }

    return repos;
  }

  async getRateLimit(): Promise<RateLimitInfo> {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      const core = data.resources.core;
      return {
        limit: core.limit,
        remaining: core.remaining,
        reset: new Date(core.reset * 1000).toISOString(),
        used: core.used,
      };
    } catch {
      return { limit: 0, remaining: 0, reset: '', used: 0 };
    }
  }

  // ─── Private Fetch Methods ──────────────────────────────────────────────────

  private async fetchMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    const cacheKey = ResponseCache.key('metadata', owner, repo);
    const cached = this.cache.get<RepoMetadata>(cacheKey);
    if (cached) return cached;

    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    const result = this.mapRepoMetadata(data);
    this.cache.set(cacheKey, result, CACHE_TTL.metadata);
    return result;
  }

  private async fetchTree(owner: string, repo: string, defaultBranch?: string): Promise<FileTreeEntry[]> {
    const cacheKey = ResponseCache.key('tree', owner, repo);
    const cached = this.cache.get<FileTreeEntry[]>(cacheKey);
    if (cached) return cached;

    // Use provided default branch to avoid a redundant repos.get() call
    let branch = defaultBranch;
    if (!branch) {
      const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo });
      branch = repoData.default_branch;
    }
    const { data } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch,
      recursive: 'true',
    });

    if (data.truncated) {
      log.warn(`Tree for ${owner}/${repo} was truncated (>100k entries)`);
    }

    const result = data.tree
      .filter((e): e is typeof e & { path: string; type: string; sha: string } =>
        !!e.path && !!e.type && !!e.sha)
      .map(e => ({
        path: e.path,
        type: e.type as 'blob' | 'tree',
        size: e.size,
        sha: e.sha,
      }));
    this.cache.set(cacheKey, result, CACHE_TTL.tree);
    return result;
  }

  private async fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const cacheKey = ResponseCache.key('languages', owner, repo);
    const cached = this.cache.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    const { data } = await this.octokit.rest.repos.listLanguages({ owner, repo });
    this.cache.set(cacheKey, data, CACHE_TTL.languages);
    return data;
  }

  private async fetchReadme(owner: string, repo: string): Promise<ReadmeContent | null> {
    const cacheKey = ResponseCache.key('readme', owner, repo);
    const cached = this.cache.get<ReadmeContent | null>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const { data } = await this.octokit.rest.repos.getReadme({ owner, repo });
      const result: ReadmeContent = {
        content: data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : '',
        encoding: data.encoding,
        size: data.size,
        path: data.path,
        html_url: data.html_url ?? '',
      };
      this.cache.set(cacheKey, result, CACHE_TTL.readme);
      return result;
    } catch {
      return null;
    }
  }

  private async fetchCommunity(owner: string, repo: string): Promise<CommunityProfile | null> {
    try {
      const { data } = await this.octokit.rest.repos.getCommunityProfileMetrics({ owner, repo });
      return {
        health_percentage: data.health_percentage,
        description: data.description,
        documentation: data.documentation,
        files: {
          code_of_conduct: data.files.code_of_conduct
            ? { name: data.files.code_of_conduct.name, url: data.files.code_of_conduct.url }
            : null,
          contributing: data.files.contributing
            ? { url: data.files.contributing.url }
            : null,
          license: data.files.license
            ? { spdx_id: (data.files.license as { spdx_id?: string }).spdx_id ?? 'UNKNOWN', url: data.files.license.url ?? '' }
            : null,
          readme: data.files.readme
            ? { url: data.files.readme.url }
            : null,
          issue_template: data.files.issue_template
            ? { url: (data.files.issue_template as { url?: string }).url ?? '' }
            : null,
          pull_request_template: data.files.pull_request_template
            ? { url: data.files.pull_request_template.url }
            : null,
        },
      };
    } catch {
      return null;
    }
  }

  private async fetchCommits(owner: string, repo: string, limit: number): Promise<CommitSummary[]> {
    const results: CommitSummary[] = [];
    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listCommits,
      { owner, repo, per_page: Math.min(limit, 100) },
    )) {
      for (const c of response.data) {
        results.push({
          sha: c.sha,
          message: c.commit.message,
          author: {
            name: c.commit.author?.name ?? 'unknown',
            email: c.commit.author?.email ?? '',
            date: c.commit.author?.date ?? '',
          },
          committer: {
            name: c.commit.committer?.name ?? 'unknown',
            date: c.commit.committer?.date ?? '',
          },
          html_url: c.html_url,
        });
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }
    return results;
  }

  private async fetchContributors(owner: string, repo: string, limit: number): Promise<ContributorInfo[]> {
    const results: ContributorInfo[] = [];
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.repos.listContributors,
        { owner, repo, per_page: Math.min(limit, 100) },
      )) {
        for (const c of response.data) {
          if (!c.login) continue;
          results.push({
            login: c.login,
            avatar_url: c.avatar_url ?? '',
            contributions: c.contributions,
            html_url: c.html_url ?? '',
            type: c.type ?? 'User',
          });
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
    } catch {
      // Empty repos return 404 for contributors
    }
    return results;
  }

  private async fetchBranches(owner: string, repo: string): Promise<BranchInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listBranches,
        { owner, repo, per_page: 100 },
      );
      return data.map(b => ({ name: b.name, protected: b.protected }));
    } catch {
      return [];
    }
  }

  private async fetchTags(owner: string, repo: string): Promise<TagInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listTags,
        { owner, repo, per_page: 100 },
      );
      return data.map(t => ({ name: t.name, sha: t.commit.sha }));
    } catch {
      return [];
    }
  }

  private async fetchReleases(owner: string, repo: string): Promise<ReleaseInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listReleases,
        { owner, repo, per_page: 100 },
      );
      return data.map(r => ({
        tag_name: r.tag_name,
        name: r.name,
        draft: r.draft,
        prerelease: r.prerelease,
        created_at: r.created_at,
        published_at: r.published_at,
        html_url: r.html_url,
        body: r.body ? r.body.slice(0, 500) : null,
        author: { login: r.author?.login ?? 'unknown' },
      }));
    } catch {
      return [];
    }
  }

  private async fetchWorkflows(owner: string, repo: string): Promise<WorkflowInfo[]> {
    try {
      const { data } = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: 100,
      });
      return data.workflows.map(w => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
        created_at: w.created_at,
        updated_at: w.updated_at,
        html_url: w.html_url,
      }));
    } catch {
      return [];
    }
  }

  // ─── Tier 2 Fetch Methods ─────────────────────────────────────────────────

  async fetchTier2(owner: string, repo: string, options?: Tier2FetchOptions): Promise<Tier2Data> {
    const sections = resolveTier2Sections(options);

    // Traffic requires admin/push access — attempt and gracefully degrade
    const traffic = sections.has('traffic')
      ? await this.fetchTraffic(owner, repo)
      : null;

    // Issues and PRs are heavy — paginate with limits
    const issues = sections.has('issues')
      ? await this.fetchIssues(owner, repo, options?.issueLimit ?? 100, options?.issueState ?? 'all')
      : [];
    const pullRequests = sections.has('pullRequests')
      ? await this.fetchPullRequests(owner, repo, options?.prLimit ?? 100, options?.issueState ?? 'all')
      : [];
    const milestones = sections.has('milestones')
      ? await this.fetchMilestones(owner, repo)
      : [];
    const discussions = sections.has('discussions')
      ? await this.fetchDiscussions(owner, repo)
      : [];

    return { traffic, issues, pullRequests, milestones, discussions };
  }

  private async fetchTraffic(owner: string, repo: string): Promise<TrafficData | null> {
    try {
      const [viewsR, clonesR] = await Promise.allSettled([
        this.octokit.rest.repos.getViews({ owner, repo, per: 'day' }),
        this.octokit.rest.repos.getClones({ owner, repo, per: 'day' }),
      ]);

      return {
        views: viewsR.status === 'fulfilled' ? {
          count: viewsR.value.data.count,
          uniques: viewsR.value.data.uniques,
          views: viewsR.value.data.views.map(v => ({
            timestamp: v.timestamp,
            count: v.count,
            uniques: v.uniques,
          })),
        } : null,
        clones: clonesR.status === 'fulfilled' ? {
          count: clonesR.value.data.count,
          uniques: clonesR.value.data.uniques,
          clones: clonesR.value.data.clones.map(c => ({
            timestamp: c.timestamp,
            count: c.count,
            uniques: c.uniques,
          })),
        } : null,
      };
    } catch {
      log.warn(`Traffic data unavailable for ${owner}/${repo} (requires push/admin access)`);
      return null;
    }
  }

  private async fetchIssues(owner: string, repo: string, limit: number, state: 'open' | 'closed' | 'all'): Promise<IssueDetail[]> {
    const results: IssueDetail[] = [];
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.issues.listForRepo,
        { owner, repo, state, per_page: Math.min(limit, 100), sort: 'updated', direction: 'desc' },
      )) {
        for (const issue of response.data) {
          // The issues endpoint also returns PRs — filter them out
          if (issue.pull_request) continue;

          results.push({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            labels: issue.labels.map(l => typeof l === 'string' ? l : l.name ?? ''),
            assignees: (issue.assignees ?? []).map(a => a.login),
            created_at: issue.created_at,
            updated_at: issue.updated_at,
            closed_at: issue.closed_at,
            author: issue.user?.login ?? 'unknown',
            comments: issue.comments,
            body_preview: issue.body ? issue.body.slice(0, 500) : '',
            html_url: issue.html_url,
            milestone: issue.milestone?.title ?? null,
            reactions_total: (issue.reactions as Record<string, unknown>)?.total_count as number ?? 0,
          });
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
    } catch {
      log.warn(`Failed to fetch issues for ${owner}/${repo}`);
    }
    return results;
  }

  private async fetchPullRequests(owner: string, repo: string, limit: number, state: 'open' | 'closed' | 'all'): Promise<PullRequestDetail[]> {
    const results: PullRequestDetail[] = [];
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.pulls.list,
        { owner, repo, state, per_page: Math.min(limit, 100), sort: 'updated', direction: 'desc' },
      )) {
        for (const pr of response.data) {
          results.push({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            labels: pr.labels.map(l => l.name ?? ''),
            assignees: (pr.assignees ?? []).map(a => a.login),
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            closed_at: pr.closed_at,
            merged_at: pr.merged_at,
            author: pr.user?.login ?? 'unknown',
            draft: pr.draft ?? false,
            comments: (pr as Record<string, unknown>).comments as number ?? 0,
            body_preview: pr.body ? pr.body.slice(0, 500) : '',
            html_url: pr.html_url,
            head_ref: pr.head.ref,
            base_ref: pr.base.ref,
            additions: (pr as Record<string, unknown>).additions as number ?? null,
            deletions: (pr as Record<string, unknown>).deletions as number ?? null,
            changed_files: (pr as Record<string, unknown>).changed_files as number ?? null,
          });
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
    } catch {
      log.warn(`Failed to fetch pull requests for ${owner}/${repo}`);
    }
    return results;
  }

  private async fetchMilestones(owner: string, repo: string): Promise<MilestoneInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.issues.listMilestones,
        { owner, repo, state: 'all', per_page: 100 },
      );
      return data.map(m => ({
        number: m.number,
        title: m.title,
        state: m.state,
        description: m.description,
        open_issues: m.open_issues,
        closed_issues: m.closed_issues,
        due_on: m.due_on,
        created_at: m.created_at,
        updated_at: m.updated_at,
        html_url: m.html_url,
      }));
    } catch {
      return [];
    }
  }

  private async fetchDiscussions(_owner: string, _repo: string): Promise<DiscussionInfo[]> {
    // GitHub REST API has limited Discussions support.
    // Full discussion data requires GraphQL API.
    // For now, return empty with a log note. Will implement with @octokit/graphql in a future update.
    log.info('Discussions require GraphQL API — not yet implemented, returning empty');
    return [];
  }

  // ─── Tier 3 Fetch Methods (Security/Admin) ─────────────────────────────────

  async fetchTier3(owner: string, repo: string, options?: Tier3FetchOptions): Promise<Tier3Data> {
    const sections = resolveTier3Sections(options);
    const limit = options?.alertLimit ?? 100;
    const permissions: Record<string, PermissionStatus> = {};

    // Parallel fetch — all Tier 3 sections are independent
    const [dependabotR, advisoriesR, sbomR, codeScanR, secretScanR] = await Promise.allSettled([
      sections.has('dependabotAlerts')
        ? this.fetchDependabotAlerts(owner, repo, limit, permissions)
        : [],
      sections.has('securityAdvisories')
        ? this.fetchSecurityAdvisories(owner, repo, limit, permissions)
        : [],
      sections.has('sbom')
        ? this.fetchSBOM(owner, repo, permissions)
        : null,
      sections.has('codeScanningAlerts')
        ? this.fetchCodeScanningAlerts(owner, repo, limit, permissions)
        : [],
      sections.has('secretScanningAlerts')
        ? this.fetchSecretScanningAlerts(owner, repo, limit, permissions)
        : [],
    ]);

    return {
      dependabotAlerts: settled(dependabotR, 'dependabotAlerts') ?? [],
      securityAdvisories: settled(advisoriesR, 'securityAdvisories') ?? [],
      sbom: settled(sbomR, 'sbom') ?? null,
      codeScanningAlerts: settled(codeScanR, 'codeScanningAlerts') ?? [],
      secretScanningAlerts: settled(secretScanR, 'secretScanningAlerts') ?? [],
      permissions,
    };
  }

  private async fetchDependabotAlerts(
    owner: string, repo: string, limit: number, permissions: Record<string, PermissionStatus>,
  ): Promise<DependabotAlert[]> {
    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/dependabot/alerts',
        { owner, repo, per_page: Math.min(limit, 100), state: 'open', sort: 'updated', direction: 'desc' },
      );
      permissions.dependabotAlerts = 'granted';
      return (data as Array<Record<string, unknown>>).slice(0, limit).map(a => {
        const dep = a.dependency as Record<string, unknown> | undefined;
        const pkg = dep?.package as Record<string, unknown> | undefined;
        const vuln = a.security_vulnerability as Record<string, unknown> | undefined;
        const advisory = a.security_advisory as Record<string, unknown> | undefined;
        const firstPV = vuln?.first_patched_version as Record<string, unknown> | null | undefined;
        const ids = Array.isArray(advisory?.identifiers) ? advisory.identifiers as Array<Record<string, unknown>> : [];
        return {
          number: Number(a.number),
          state: String(a.state ?? ''),
          severity: String(vuln?.severity ?? advisory?.severity ?? 'unknown'),
          summary: String(advisory?.summary ?? ''),
          package_name: String(pkg?.name ?? ''),
          package_ecosystem: String(pkg?.ecosystem ?? ''),
          vulnerable_version_range: String(vuln?.vulnerable_version_range ?? ''),
          patched_version: firstPV ? String(firstPV.identifier ?? '') : null,
          created_at: String(a.created_at ?? ''),
          updated_at: String(a.updated_at ?? ''),
          fixed_at: a.fixed_at ? String(a.fixed_at) : null,
          dismissed_at: a.dismissed_at ? String(a.dismissed_at) : null,
          html_url: String(a.html_url ?? ''),
          cve_id: ids.find(i => i.type === 'CVE')?.value as string ?? null,
          ghsa_id: ids.find(i => i.type === 'GHSA')?.value as string ?? null,
        };
      });
    } catch (e) {
      this.handleSecurityPermission(e, 'dependabotAlerts', owner, repo, permissions);
      return [];
    }
  }

  private async fetchSecurityAdvisories(
    owner: string, repo: string, limit: number, permissions: Record<string, PermissionStatus>,
  ): Promise<SecurityAdvisory[]> {
    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/security-advisories',
        { owner, repo, per_page: Math.min(limit, 100) },
      );
      permissions.securityAdvisories = 'granted';
      return (data as Array<Record<string, unknown>>).slice(0, limit).map(a => {
        const vulns = Array.isArray(a.vulnerabilities) ? a.vulnerabilities as Array<Record<string, unknown>> : [];
        return {
          ghsa_id: String(a.ghsa_id ?? ''),
          cve_id: a.cve_id ? String(a.cve_id) : null,
          summary: String(a.summary ?? ''),
          description_preview: a.description ? String(a.description).slice(0, 500) : '',
          severity: String(a.severity ?? 'unknown'),
          state: String(a.state ?? ''),
          published_at: a.published_at ? String(a.published_at) : null,
          updated_at: String(a.updated_at ?? ''),
          withdrawn_at: a.withdrawn_at ? String(a.withdrawn_at) : null,
          html_url: String(a.html_url ?? ''),
          vulnerabilities: vulns.map(v => {
            const vPkg = v.package as Record<string, unknown> | undefined;
            const fp = v.first_patched_version as Record<string, unknown> | null | undefined;
            return {
              package: {
                ecosystem: String(vPkg?.ecosystem ?? ''),
                name: String(vPkg?.name ?? ''),
              },
              severity: String(v.severity ?? ''),
              vulnerable_version_range: String(v.vulnerable_version_range ?? ''),
              patched_versions: fp ? String(fp.identifier ?? '') : null,
            };
          }),
        };
      });
    } catch (e) {
      this.handleSecurityPermission(e, 'securityAdvisories', owner, repo, permissions);
      return [];
    }
  }

  private async fetchSBOM(
    owner: string, repo: string, permissions: Record<string, PermissionStatus>,
  ): Promise<SBOMData | null> {
    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/dependency-graph/sbom',
        { owner, repo },
      );
      permissions.sbom = 'granted';
      const sbom = data.sbom as Record<string, unknown>;
      const packages = Array.isArray(sbom.packages) ? sbom.packages as Array<Record<string, unknown>> : [];
      return {
        spdx_id: String(sbom.spdxVersion ?? ''),
        name: String(sbom.name ?? ''),
        created_at: String((sbom.creationInfo as Record<string, unknown>)?.created ?? ''),
        packages: packages.map(p => {
          const extRefs = Array.isArray(p.externalRefs) ? p.externalRefs as Array<Record<string, unknown>> : [];
          const pkgMgr = extRefs.find(r => r.referenceCategory === 'PACKAGE-MANAGER' || r.referenceCategory === 'PACKAGE_MANAGER');
          return {
            name: String(p.name ?? ''),
            version: p.versionInfo ? String(p.versionInfo) : null,
            ecosystem: pkgMgr ? String(pkgMgr.referenceType ?? '') : String(p.name ?? '').split(':')[0] || 'unknown',
            license: p.licenseDeclared && p.licenseDeclared !== 'NOASSERTION' ? String(p.licenseDeclared) : null,
            relationship: String(p.downloadLocation ?? 'NOASSERTION') !== 'NOASSERTION' ? 'direct' : 'indirect',
          };
        }),
      };
    } catch (e) {
      this.handleSecurityPermission(e, 'sbom', owner, repo, permissions);
      return null;
    }
  }

  private async fetchCodeScanningAlerts(
    owner: string, repo: string, limit: number, permissions: Record<string, PermissionStatus>,
  ): Promise<CodeScanningAlert[]> {
    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/code-scanning/alerts',
        { owner, repo, per_page: Math.min(limit, 100), state: 'open', sort: 'updated', direction: 'desc' },
      );
      permissions.codeScanningAlerts = 'granted';
      return (data as Array<Record<string, unknown>>).slice(0, limit).map(a => {
        const rule = a.rule as Record<string, unknown> | undefined;
        const tool = a.tool as Record<string, unknown> | undefined;
        const instance = a.most_recent_instance as Record<string, unknown> | undefined;
        const loc = instance?.location as Record<string, unknown> | undefined;
        return {
          number: Number(a.number),
          state: String(a.state ?? ''),
          severity: String(rule?.severity ?? rule?.security_severity_level ?? 'unknown'),
          description: String(rule?.description ?? ''),
          rule_id: String(rule?.id ?? ''),
          rule_description: String(rule?.description ?? ''),
          tool_name: String(tool?.name ?? ''),
          created_at: String(a.created_at ?? ''),
          updated_at: String(a.updated_at ?? ''),
          fixed_at: a.fixed_at ? String(a.fixed_at) : null,
          dismissed_at: a.dismissed_at ? String(a.dismissed_at) : null,
          html_url: String(a.html_url ?? ''),
          most_recent_instance: instance ? {
            ref: String(instance.ref ?? ''),
            path: String(loc?.path ?? ''),
            start_line: Number(loc?.start_line ?? 0),
          } : null,
        };
      });
    } catch (e) {
      this.handleSecurityPermission(e, 'codeScanningAlerts', owner, repo, permissions);
      return [];
    }
  }

  private async fetchSecretScanningAlerts(
    owner: string, repo: string, limit: number, permissions: Record<string, PermissionStatus>,
  ): Promise<SecretScanningAlert[]> {
    try {
      const { data } = await this.octokit.request(
        'GET /repos/{owner}/{repo}/secret-scanning/alerts',
        { owner, repo, per_page: Math.min(limit, 100), state: 'open', sort: 'updated', direction: 'desc' },
      );
      permissions.secretScanningAlerts = 'granted';
      return (data as Array<Record<string, unknown>>).slice(0, limit).map(a => ({
        number: Number(a.number),
        state: String(a.state ?? ''),
        secret_type: String(a.secret_type ?? ''),
        secret_type_display_name: String(a.secret_type_display_name ?? ''),
        resolution: a.resolution ? String(a.resolution) : null,
        resolved_at: a.resolved_at ? String(a.resolved_at) : null,
        created_at: String(a.created_at ?? ''),
        updated_at: String(a.updated_at ?? ''),
        html_url: String(a.html_url ?? ''),
        push_protection_bypassed: Boolean(a.push_protection_bypassed),
      }));
    } catch (e) {
      this.handleSecurityPermission(e, 'secretScanningAlerts', owner, repo, permissions);
      return [];
    }
  }

  private handleSecurityPermission(
    error: unknown, section: string, owner: string, repo: string, permissions: Record<string, PermissionStatus>,
  ): void {
    const status = (error as Record<string, unknown>)?.status as number | undefined;
    if (status === 403) {
      permissions[section] = 'denied';
      log.warn(`${section} access denied for ${owner}/${repo} (requires security_events scope or admin access)`);
    } else if (status === 404) {
      permissions[section] = 'not_enabled';
      log.info(`${section} not enabled for ${owner}/${repo}`);
    } else {
      permissions[section] = 'denied';
      log.warn(`${section} failed for ${owner}/${repo}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  async searchRepos(options: SearchOptions): Promise<SearchResult> {
    const limit = options.limit ?? 30;
    const page = options.page ?? 1;

    // Build GitHub search query with qualifiers
    let q = options.query;
    if (options.language) q += ` language:${options.language}`;
    if (options.topic) q += ` topic:${options.topic}`;
    if (options.minStars !== undefined && options.maxStars !== undefined) {
      q += ` stars:${options.minStars}..${options.maxStars}`;
    } else if (options.minStars !== undefined) {
      q += ` stars:>=${options.minStars}`;
    } else if (options.maxStars !== undefined) {
      q += ` stars:<=${options.maxStars}`;
    }

    const cacheKey = `search:${q}:${options.sort ?? 'best-match'}:${options.order ?? 'desc'}:${limit}:${page}`;
    const cached = this.cache.get<SearchResult>(cacheKey);
    if (cached) return cached;

    const items: SearchResultItem[] = [];
    let totalCount = 0;

    // Use page param for GitHub API pagination
    const { data } = await this.octokit.rest.search.repos({
      q,
      sort: options.sort,
      order: options.order ?? 'desc',
      per_page: Math.min(limit, 100),
      page,
    });

    totalCount = data.total_count;

    for (const r of data.items) {
      items.push({
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        stargazers_count: r.stargazers_count ?? 0,
        forks_count: r.forks_count ?? 0,
        open_issues_count: r.open_issues_count ?? 0,
        language: r.language ?? null,
        topics: r.topics ?? [],
        license: r.license ? { spdx_id: r.license.spdx_id ?? 'UNKNOWN' } : null,
        updated_at: r.updated_at ?? '',
        pushed_at: r.pushed_at ?? '',
        archived: r.archived ?? false,
        fork: r.fork,
      });
      if (items.length >= limit) break;
    }

    const result: SearchResult = {
      totalCount,
      page,
      perPage: limit,
      hasMore: page * limit < totalCount,
      items,
    };
    this.cache.set(cacheKey, result, CACHE_TTL.search);
    return result;
  }

  // ─── File Content ──────────────────────────────────────────────────────────

  async getFileContent(owner: string, repo: string, path: string, ref?: string): Promise<FileContent> {
    const cacheKey = ResponseCache.key('fileContent', owner, repo, `${path}:${ref ?? 'HEAD'}`);
    const cached = this.cache.get<FileContent>(cacheKey);
    if (cached) return cached;

    const params: Record<string, string> = { owner, repo, path };
    if (ref) params.ref = ref;

    const { data } = await this.octokit.rest.repos.getContent(params as {
      owner: string; repo: string; path: string; ref?: string;
    });

    // getContent can return a file or directory — we only handle files
    if (Array.isArray(data)) {
      throw new Error(`Path "${path}" is a directory, not a file. Use crawl_repo with the tree section to list directory contents.`);
    }

    const d = data as Record<string, unknown>;
    if (d.type !== 'file') {
      throw new Error(`Path "${path}" is a ${d.type}, not a file.`);
    }

    const content = d.content
      ? Buffer.from(String(d.content), 'base64').toString('utf-8')
      : '';

    const result: FileContent = {
      path: String(d.path ?? path),
      content,
      size: Number(d.size ?? 0),
      encoding: String(d.encoding ?? 'base64'),
      sha: String(d.sha ?? ''),
      html_url: String(d.html_url ?? ''),
      download_url: d.download_url ? String(d.download_url) : null,
    };
    this.cache.set(cacheKey, result, CACHE_TTL.fileContent);
    return result;
  }

  // ─── Commit Diff ───────────────────────────────────────────────────────────

  async getCommitDiff(owner: string, repo: string, ref: string, includePatch = true): Promise<CommitDiff> {
    const cacheKey = ResponseCache.key('commitDiff', owner, repo, `${ref}:${includePatch}`);
    const cached = this.cache.get<CommitDiff>(cacheKey);
    if (cached) return cached;

    const { data } = await this.octokit.rest.repos.getCommit({ owner, repo, ref });

    const files: CommitDiffFile[] = (data.files ?? []).map(f => ({
      filename: f.filename ?? '',
      status: f.status ?? 'unknown',
      additions: f.additions ?? 0,
      deletions: f.deletions ?? 0,
      changes: f.changes ?? 0,
      ...(includePatch && f.patch ? { patch: f.patch } : {}),
    }));

    const result: CommitDiff = {
      sha: data.sha,
      message: data.commit.message,
      author: {
        name: data.commit.author?.name ?? 'unknown',
        email: data.commit.author?.email ?? '',
        date: data.commit.author?.date ?? '',
      },
      html_url: data.html_url,
      stats: {
        additions: data.stats?.additions ?? 0,
        deletions: data.stats?.deletions ?? 0,
        total: data.stats?.total ?? 0,
      },
      files,
    };
    this.cache.set(cacheKey, result, CACHE_TTL.commitDiff);
    return result;
  }

  // ─── Workflow Runs ─────────────────────────────────────────────────────────

  async getWorkflowRuns(owner: string, repo: string, limit = 10, page = 1): Promise<{ runs: WorkflowRunInfo[]; totalCount: number; page: number; hasMore: boolean }> {
    const cacheKey = ResponseCache.key('workflowRuns', owner, repo, `${limit}:${page}`);
    const cached = this.cache.get<{ runs: WorkflowRunInfo[]; totalCount: number; page: number; hasMore: boolean }>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        per_page: Math.min(limit, 100),
        page,
        status: 'completed',
      });

      const runs = data.workflow_runs.slice(0, limit).map(r => {
        // Calculate duration from created_at to updated_at
        let durationSeconds: number | null = null;
        if (r.created_at && r.updated_at) {
          const start = new Date(r.created_at).getTime();
          const end = new Date(r.updated_at).getTime();
          if (!isNaN(start) && !isNaN(end) && end > start) {
            durationSeconds = Math.round((end - start) / 1000);
          }
        }

        return {
          id: r.id,
          name: r.name ?? '',
          status: r.status ?? 'unknown',
          conclusion: r.conclusion ?? null,
          head_branch: r.head_branch ?? '',
          event: r.event,
          created_at: r.created_at,
          updated_at: r.updated_at,
          html_url: r.html_url,
          run_number: r.run_number,
          duration_seconds: durationSeconds,
        };
      });
      const result = {
        runs,
        totalCount: data.total_count,
        page,
        hasMore: page * limit < data.total_count,
      };
      this.cache.set(cacheKey, result, CACHE_TTL.workflowRuns);
      return result;
    } catch {
      log.warn(`Failed to fetch workflow runs for ${owner}/${repo}`);
      return { runs: [], totalCount: 0, page, hasMore: false };
    }
  }

  // ─── Mapping Helpers ────────────────────────────────────────────────────────

  private mapRepoMetadata(data: Record<string, unknown>): RepoMetadata {
    const d = data as Record<string, unknown>;
    const owner = d.owner as Record<string, unknown> | undefined;
    const license = d.license as Record<string, unknown> | null;
    const parent = d.parent as Record<string, unknown> | undefined;

    return {
      name: String(d.name ?? ''),
      full_name: String(d.full_name ?? ''),
      description: d.description != null ? String(d.description) : null,
      topics: Array.isArray(d.topics) ? d.topics.map(String) : [],
      owner: {
        login: String(owner?.login ?? ''),
        type: String(owner?.type ?? ''),
        avatar_url: String(owner?.avatar_url ?? ''),
      },
      visibility: String(d.visibility ?? 'public'),
      license: license ? { spdx_id: String(license.spdx_id ?? ''), name: String(license.name ?? '') } : null,
      default_branch: String(d.default_branch ?? 'main'),
      created_at: String(d.created_at ?? ''),
      updated_at: String(d.updated_at ?? ''),
      pushed_at: String(d.pushed_at ?? ''),
      homepage: d.homepage != null ? String(d.homepage) : null,
      fork: Boolean(d.fork),
      ...(parent ? { parent: { full_name: String(parent.full_name ?? ''), html_url: String(parent.html_url ?? '') } } : {}),
      stargazers_count: Number(d.stargazers_count ?? 0),
      forks_count: Number(d.forks_count ?? 0),
      open_issues_count: Number(d.open_issues_count ?? 0),
      watchers_count: Number(d.watchers_count ?? 0),
      size: Number(d.size ?? 0),
      html_url: String(d.html_url ?? ''),
      archived: Boolean(d.archived),
      disabled: Boolean(d.disabled),
      has_issues: Boolean(d.has_issues),
      has_wiki: Boolean(d.has_wiki),
      has_discussions: Boolean(d.has_discussions),
    };
  }
}
