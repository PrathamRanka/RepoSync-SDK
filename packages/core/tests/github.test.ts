import { describe, expect, it } from "vitest";
import {
  GitHubAPIError,
  GitHubAuthenticationError,
  GitHubRateLimitError,
  RepositoryNotFoundError,
} from "../src/errors.js";
import { resolveConfig } from "../src/config/config.js";
import { discoverRepositories, repositoryMatches } from "../src/github/repositories.js";

const repo = (changes: Record<string, unknown> = {}) => ({
  name: "demo",
  full_name: "octocat/demo",
  html_url: "https://github.com/octocat/demo",
  description: null,
  homepage: null,
  topics: ["portfolio", "typescript"],
  stargazers_count: 10,
  forks_count: 0,
  archived: false,
  fork: false,
  updated_at: "2026-01-01",
  ...changes,
});

describe("repository filtering", () => {
  it("matches topics case-insensitively and enforces repository filters", () => {
    const config = resolveConfig({
      username: "octocat",
      filters: { topics: ["PORTFOLIO", "TypeScript"], topicMatch: "all", minStars: 10 },
    });
    expect(repositoryMatches(repo(), config)).toBe(true);
    expect(repositoryMatches(repo({ topics: ["portfolio"] }), config)).toBe(false);
    expect(repositoryMatches(repo({ stargazers_count: 9 }), config)).toBe(false);
    expect(repositoryMatches(repo({ fork: true }), config)).toBe(false);
  });

  it("can include forks and archived repositories", () => {
    const config = resolveConfig({
      username: "octocat",
      filters: { includeForks: true, includeArchived: true },
    });
    expect(repositoryMatches(repo({ fork: true, archived: true }), config)).toBe(true);
  });

  it("discovers details through paginated GitHub responses", async () => {
    const config = resolveConfig({ username: "octocat", topics: ["portfolio"] });
    const client = {
      paginate: async () => [repo()],
      rest: {
        repos: {
          listForUser: {},
          get: async () => ({ data: repo() }),
          listLanguages: async () => ({ data: { TypeScript: 100 } }),
          getReadme: async () => ({
            data: { encoding: "base64", content: Buffer.from("# Demo").toString("base64") },
          }),
        },
      },
    };
    const result = await discoverRepositories(config, client);
    expect(result).toHaveLength(1);
    expect(result[0]?.languages).toEqual({ TypeScript: 100 });
    expect(result[0]?.readme).toBe("# Demo");
  });

  it("sorts, limits, and makes no detail requests for excluded repositories", async () => {
    const repositories = [
      repo({
        name: "low",
        full_name: "octocat/low",
        stargazers_count: 2,
        updated_at: "2026-03-01",
      }),
      repo({
        name: "high",
        full_name: "octocat/high",
        stargazers_count: 20,
        updated_at: "2026-01-01",
      }),
      repo({ name: "fork", full_name: "octocat/fork", fork: true, stargazers_count: 99 }),
    ];
    const getCalls: string[] = [];
    const config = resolveConfig({
      username: "octocat",
      limit: 1,
      sortBy: "stars",
      filters: { minStars: 1 },
    });
    const client = {
      paginate: async () => repositories,
      rest: {
        repos: {
          listForUser: {},
          get: async ({ repo: name }: { repo: string }) => {
            getCalls.push(name);
            return { data: repo({ name, full_name: `octocat/${name}` }) };
          },
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    };
    const result = await discoverRepositories(config, client);
    expect(result.map(({ repository }) => repository.name)).toEqual(["high"]);
    expect(getCalls).toEqual(["high"]);
  });

  it("supports empty accounts and bounded repository concurrency", async () => {
    const emptyConfig = resolveConfig({ username: "octocat" });
    const emptyClient = {
      paginate: async () => [],
      rest: {
        repos: {
          listForUser: {},
          get: async () => {
            throw new Error("unexpected");
          },
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    };
    await expect(discoverRepositories(emptyConfig, emptyClient)).resolves.toEqual([]);

    let active = 0;
    let maximum = 0;
    const repositories = ["a", "b", "c", "d", "e"].map((name) =>
      repo({ name, full_name: `octocat/${name}` }),
    );
    const config = resolveConfig({ username: "octocat", concurrency: 2 });
    const client = {
      paginate: async () => repositories,
      rest: {
        repos: {
          listForUser: {},
          get: async ({ repo: name }: { repo: string }) => {
            active++;
            maximum = Math.max(maximum, active);
            await new Promise((resolve) => setTimeout(resolve, 2));
            active--;
            return { data: repo({ name, full_name: `octocat/${name}` }) };
          },
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    };
    await discoverRepositories(config, client);
    expect(maximum).toBeLessThanOrEqual(2);
  });

  it("supports any-topic matching and deterministic name sorting", async () => {
    const config = resolveConfig({
      username: "octocat",
      sortBy: "name",
      filters: { topics: ["missing", "PORTFOLIO"], topicMatch: "any" },
    });
    expect(repositoryMatches(repo({ topics: ["portfolio"] }), config)).toBe(true);
    const repositories = ["zeta", "alpha", "middle"].map((name) =>
      repo({ name, full_name: `octocat/${name}` }),
    );
    const client = {
      paginate: async () => repositories,
      rest: {
        repos: {
          listForUser: {},
          get: async ({ repo: name }: { repo: string }) => ({
            data: repo({ name, full_name: `octocat/${name}` }),
          }),
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    };
    const result = await discoverRepositories(config, client);
    expect(result.map(({ repository }) => repository.name)).toEqual(["alpha", "middle", "zeta"]);
  });

  it.each([
    [401, GitHubAuthenticationError],
    [422, GitHubAPIError],
    [500, GitHubAPIError],
  ])("maps GitHub status %s without returning partial results", async (status, ErrorType) => {
    const config = resolveConfig({ username: "octocat", token: "secret-token" });
    const client = {
      paginate: async () => {
        throw { status, response: { data: { message: `token secret-token status ${status}` } } };
      },
      rest: {
        repos: {
          listForUser: {},
          get: async () => ({ data: repo() }),
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    };
    await expect(discoverRepositories(config, client)).rejects.toBeInstanceOf(ErrorType);
    await expect(discoverRepositories(config, client)).rejects.not.toThrow("secret-token");
  });

  it("preserves network causes and rate-limit headers", async () => {
    const cause = new Error("socket failure");
    const networkConfig = resolveConfig({ username: "octocat" });
    const networkClient = {
      paginate: async () => {
        throw cause;
      },
      rest: {
        repos: {
          listForUser: {},
          get: async () => ({ data: repo() }),
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    };
    await expect(discoverRepositories(networkConfig, networkClient)).rejects.toMatchObject({
      code: "GITHUB_API_ERROR",
      cause,
    });

    const rateClient = {
      paginate: async () => {
        throw {
          status: 403,
          response: {
            headers: { "retry-after": "5", "x-ratelimit-reset": "123" },
            data: { message: "limited" },
          },
        };
      },
      rest: networkClient.rest,
    };
    await expect(discoverRepositories(networkConfig, rateClient)).rejects.toMatchObject({
      code: "GITHUB_RATE_LIMIT_EXCEEDED",
      retryAfter: 5,
      resetAt: 123,
    } satisfies Partial<GitHubRateLimitError>);
  });

  it("handles missing READMEs but rejects malformed GitHub payloads and repository errors", async () => {
    const config = resolveConfig({ username: "octocat" });
    const base = {
      paginate: async () => [repo()],
      rest: {
        repos: {
          listForUser: {},
          get: async () => ({ data: repo() }),
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => {
            throw { status: 404 };
          },
        },
      },
    };
    await expect(discoverRepositories(config, base)).resolves.toMatchObject([{ readme: null }]);
    const malformed = { ...base, paginate: async () => [{ name: "broken" }] };
    await expect(discoverRepositories(config, malformed)).rejects.toMatchObject({ status: 0 });
    const repositoryFailure = {
      ...base,
      rest: {
        repos: {
          ...base.rest.repos,
          get: async () => {
            throw { status: 404 };
          },
        },
      },
    };
    await expect(discoverRepositories(config, repositoryFailure)).rejects.toBeInstanceOf(
      RepositoryNotFoundError,
    );
  });
});
