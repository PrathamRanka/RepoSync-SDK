import { Octokit } from "octokit";
import {
  GitHubAPIError,
  GitHubAuthenticationError,
  GitHubRateLimitError,
  RepositoryNotFoundError,
} from "../errors.js";
import type { ResolvedRepoSyncConfig } from "../config/config.js";

export type GitHubRepository = {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  topics?: string[];
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  fork: boolean;
  updated_at: string;
};
export type RepositoryDetails = {
  repository: GitHubRepository;
  languages: Record<string, number>;
  readme: string | null;
};

export type GitHubClient = {
  paginate: (request: unknown, parameters: Record<string, unknown>) => Promise<GitHubRepository[]>;
  rest: {
    repos: {
      listForUser: unknown;
      get: (parameters: Record<string, string>) => Promise<{ data: GitHubRepository }>;
      listLanguages: (
        parameters: Record<string, string>,
      ) => Promise<{ data: Record<string, number> }>;
      getReadme: (
        parameters: Record<string, string>,
      ) => Promise<{ data: { content?: string; encoding?: string } }>;
    };
  };
};

function mapError(error: unknown, token?: string): Error {
  const response = (
    error as {
      status?: number;
      response?: {
        status?: number;
        headers?: Record<string, string>;
        data?: { message?: string; documentation_url?: string };
      };
    }
  ).response;
  const status = response?.status ?? (error as { status?: number }).status ?? 0;
  const rawMessage =
    response?.data?.message ?? (error instanceof Error ? error.message : "GitHub request failed.");
  const message = token ? rawMessage.split(token).join("[REDACTED]") : rawMessage;
  if (status === 401) return new GitHubAuthenticationError(message);
  if (status === 403 || status === 429) {
    const headers = response?.headers ?? {};
    const retryAfter = Number(headers["retry-after"]);
    const resetAt = Number(headers["x-ratelimit-reset"]);
    return new GitHubRateLimitError(
      message,
      Number.isFinite(retryAfter) ? retryAfter : null,
      Number.isFinite(resetAt) ? resetAt : null,
    );
  }
  return new GitHubAPIError(message, status, response?.data?.documentation_url, { cause: error });
}

export function repositoryMatches(
  repository: GitHubRepository,
  config: ResolvedRepoSyncConfig,
): boolean {
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

function isRepository(value: unknown): value is GitHubRepository {
  if (!value || typeof value !== "object") return false;
  const repository = value as Partial<GitHubRepository>;
  return (
    typeof repository.name === "string" &&
    typeof repository.full_name === "string" &&
    typeof repository.html_url === "string" &&
    typeof repository.stargazers_count === "number" &&
    typeof repository.forks_count === "number" &&
    typeof repository.archived === "boolean" &&
    typeof repository.fork === "boolean" &&
    typeof repository.updated_at === "string"
  );
}

function isLanguageMap(value: unknown): value is Record<string, number> {
  return (
    !!value &&
    typeof value === "object" &&
    Object.values(value).every((language) => typeof language === "number")
  );
}

async function loadRepository(
  repository: GitHubRepository,
  config: ResolvedRepoSyncConfig,
  client: GitHubClient,
): Promise<RepositoryDetails> {
  const owner = repository.full_name.split("/")[0] ?? config.username;
  const [details, languages, readme] = await Promise.all([
    client.rest.repos.get({ owner, repo: repository.name }).catch((error: unknown) => {
      if ((error as { status?: number }).status === 404)
        throw new RepositoryNotFoundError(owner, repository.name);
      throw error;
    }),
    client.rest.repos.listLanguages({ owner, repo: repository.name }),
    client.rest.repos.getReadme({ owner, repo: repository.name }).catch((error: unknown) => {
      const status = (error as { status?: number }).status;
      if (status === 404) return { data: {} };
      throw error;
    }),
  ]);
  if (!isRepository(details.data))
    throw new GitHubAPIError("GitHub returned a malformed repository response.", 0);
  if (!isLanguageMap(languages.data))
    throw new GitHubAPIError("GitHub returned a malformed language response.", 0);
  const readmeData = readme.data as { content?: unknown; encoding?: unknown };
  if (
    readmeData.content !== undefined &&
    (typeof readmeData.content !== "string" || readmeData.encoding !== "base64")
  ) {
    throw new GitHubAPIError("GitHub returned a malformed README response.", 0);
  }
  const content =
    typeof readmeData.content === "string"
      ? Buffer.from(readmeData.content.replace(/\s/g, ""), "base64").toString("utf8")
      : null;
  return { repository: details.data, languages: languages.data, readme: content };
}

export async function discoverRepositories(
  config: ResolvedRepoSyncConfig,
  client: GitHubClient = new Octokit({ auth: config.token }) as unknown as GitHubClient,
): Promise<RepositoryDetails[]> {
  try {
    const repositories = await client.paginate(client.rest.repos.listForUser, {
      username: config.username,
      per_page: 100,
      sort: config.sortBy,
    });
    if (!repositories.every(isRepository))
      throw new GitHubAPIError("GitHub returned a malformed repository response.", 0);
    const selected = repositories
      .filter((repository) => repositoryMatches(repository, config))
      .sort((a, b) =>
        config.sortBy === "stars"
          ? b.stargazers_count - a.stargazers_count
          : config.sortBy === "name"
            ? a.name.localeCompare(b.name)
            : b.updated_at.localeCompare(a.updated_at),
      )
      .slice(0, config.limit);
    const results: RepositoryDetails[] = [];
    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < selected.length) {
        const index = nextIndex++;
        const repository = selected[index];
        if (!repository) continue;
        results[index] = await loadRepository(repository, config, client);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(config.concurrency, selected.length) }, worker),
    );
    return results;
  } catch (error) {
    if (
      error instanceof GitHubAPIError ||
      error instanceof GitHubAuthenticationError ||
      error instanceof GitHubRateLimitError ||
      error instanceof RepositoryNotFoundError
    )
      throw error;
    throw mapError(error, config.token);
  }
}
