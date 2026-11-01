import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config/config.js";
import { discoverRepositories, repositoryMatches } from "../src/github/repositories.js";

const repo = (changes: Record<string, unknown> = {}) => ({
  name: "demo", full_name: "octocat/demo", html_url: "https://github.com/octocat/demo",
  description: null, homepage: null, topics: ["portfolio", "typescript"], stargazers_count: 10,
  forks_count: 0, archived: false, fork: false, updated_at: "2026-01-01", ...changes,
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
});