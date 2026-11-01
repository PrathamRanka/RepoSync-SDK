import { describe, expect, it } from "vitest";
import { RepoSync } from "../src/reposync.js";

function makeRepository(name: string, changes: Record<string, unknown> = {}) {
  return {
    name, full_name: `octocat/${name}`, html_url: `https://github.com/octocat/${name}`,
    description: `${name} metadata`, homepage: null, topics: ["portfolio"], stargazers_count: 10,
    forks_count: 0, archived: false, fork: false, updated_at: "2026-01-01", ...changes,
  };
}

function mockClient(names: string[]) {
  const repositories = names.map((name) => makeRepository(name));
  return {
    paginate: async () => repositories,
    rest: {
      repos: {
        listForUser: {},
        get: async ({ repo }: { repo: string }) => ({ data: makeRepository(repo) }),
        listLanguages: async () => ({ data: { TypeScript: 100 } }),
        getReadme: async ({ repo }: { repo: string }) => ({
          data: {
            encoding: "base64",
            content: Buffer.from(`# ${repo}\n\nREADME introduction\n\n## Technologies\n- TypeScript`).toString("base64"),
          },
        }),
      },
    },
  };
}

describe("RepoSync end-to-end", () => {
  it("discovers and normalizes a complete portfolio without live GitHub access", async () => {
    const projects = await new RepoSync({
      username: "octocat", topics: ["portfolio"], client: mockClient(["alpha"]),
    }).discover();
    expect(projects[0]).toMatchObject({
      name: "alpha", description: "README introduction", technologies: ["TypeScript"],
    });
  });

  it("supports custom conventions, full customization, missing README, and full-name override precedence", async () => {
    const client = mockClient(["alpha", "beta"]);
    client.rest.repos.getReadme = async ({ repo }: { repo: string }) => {
      if (repo === "beta") throw Object.assign(new Error("not found"), { status: 404 });
      return { data: { encoding: "base64", content: Buffer.from("# alpha\n\n## Stack\n- README").toString("base64") } };
    };
    const projects = await new RepoSync({
      username: "octocat",
      aliases: { technologies: ["stack"], features: [], demos: [] },
      defaults: { description: "global", technologies: ["Default"] },
      overrides: {
        alpha: { description: "short" },
        "octocat/alpha": { description: "full", technologies: [] },
        beta: { description: "custom", featured: true },
      },
      client,
    }).discover();
    expect(projects.find((project) => project.name === "alpha")).toMatchObject({
      description: "full", technologies: [],
    });
    expect(projects.find((project) => project.name === "beta")).toMatchObject({
      description: "custom", technologies: ["Default"], featured: true,
    });
  });

  it("does not return partial results when repository processing fails", async () => {
    const client = mockClient(["alpha", "beta"]);
    client.rest.repos.listLanguages = async ({ repo }: { repo: string }) => {
      if (repo === "beta") throw Object.assign(new Error("permission denied"), { status: 403 });
      return { data: { TypeScript: 100 } };
    };
    await expect(new RepoSync({ username: "octocat", client }).discover()).rejects.toMatchObject({
      code: "GITHUB_RATE_LIMIT_EXCEEDED",
    });
  });
});
