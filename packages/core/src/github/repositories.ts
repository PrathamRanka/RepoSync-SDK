import { Octokit } from "octokit";
import { GitHubAPIError, GitHubAuthenticationError, GitHubRateLimitError } from "../errors.js";
import type { ResolvedRepoSyncConfig } from "../config/config.js";

export type GitHubRepository = {
  name: string; full_name: string; html_url: string; description: string | null; homepage: string | null;
  topics?: string[]; language?: string | null; stargazers_count: number; forks_count: number;
  archived: boolean; fork: boolean; updated_at: string;
};
export type RepositoryDetails = { repository: GitHubRepository; languages: Record<string, number>; readme: string | null };

type Client = {
  paginate: (request: unknown, parameters: Record<string, unknown>) => Promise<GitHubRepository[]>;
  rest: { repos: {
    listForUser: unknown;
    get: (parameters: Record<string, string>) => Promise<{ data: GitHubRepository }>;
    listLanguages: (parameters: Record<string, string>) => Promise<{ data: Record<string, number> }>;
    getReadme: (parameters: Record<string, string>) => Promise<{ data: { content?: string; encoding?: string } }>;
  } };
};

function mapError(error: unknown): Error {
  const response = (error as { status?: number; response?: { status?: number; headers?: Record<string, string>; data?: { message?: string; documentation_url?: string } } }).response;
  const status = response?.status ?? (error as { status?: number }).status ?? 0;
  const message = response?.data?.message ?? (error instanceof Error ? error.message : "GitHub request failed.");
  if (status === 401) return new GitHubAuthenticationError(message);
  if (status === 403 || status === 429) return new GitHubRateLimitError(message, null, null);
  return new GitHubAPIError(message, status, response?.data?.documentation_url, { cause: error });
}

export function repositoryMatches(repository: GitHubRepository, config: ResolvedRepoSyncConfig): boolean {
  const { filters } = config;
  if (!filters.includeForks && repository.fork) return false;
  if (!filters.includeArchived && repository.archived) return false;
  if (repository.stargazers_count < filters.minStars) return false;
  const topics = filters.topics ?? [];
  if (!topics.length) return true;
  const repoTopics = new Set((repository.topics ?? []).map((topic) => topic.toLowerCase()));
  return filters.topicMatch === "all"
    ? topics.every((topic) => repoTopics.has(topic.toLowerCase()))
    : topics.some((topic) => repoTopics.has(topic.toLowerCase()));
}

export async function discoverRepositories(config: ResolvedRepoSyncConfig, client: Client = new Octokit({ auth: config.token }) as unknown as Client): Promise<RepositoryDetails[]> {
  try {
    const repositories = await client.paginate(client.rest.repos.listForUser, {
      username: config.username, per_page: 100, sort: config.sortBy,
    });
    const selected = repositories.filter((repository) => repositoryMatches(repository, config))
      .sort((a, b) => config.sortBy === "stars" ? b.stargazers_count - a.stargazers_count : config.sortBy === "name" ? a.name.localeCompare(b.name) : b.updated_at.localeCompare(a.updated_at))
      .slice(0, config.limit);
    return await Promise.all(selected.map(async (repository) => {
      const owner = repository.full_name.split("/")[0] ?? config.username;
      try {
        const [details, languages, readme] = await Promise.all([
          client.rest.repos.get({ owner, repo: repository.name }),
          client.rest.repos.listLanguages({ owner, repo: repository.name }),
          client.rest.repos.getReadme({ owner, repo: repository.name }).catch((error: unknown) => {
              const status = (error as { status?: number }).status;
            if (status === 404) return { data: {} };
            throw error;
          }),
        ]);
        const readmeData = readme.data as { content?: string; encoding?: string };
        const content = readmeData.content && readmeData.encoding === "base64"
          ? Buffer.from(readmeData.content.replace(/\s/g, ""), "base64").toString("utf8")
          : null;
        return { repository: details.data, languages: languages.data, readme: content };
      } catch (error) {
        throw mapError(error);
      }
    }));
  } catch (error) {
    if (error instanceof GitHubAPIError || error instanceof GitHubAuthenticationError || error instanceof GitHubRateLimitError) throw error;
    throw mapError(error);
  }
}