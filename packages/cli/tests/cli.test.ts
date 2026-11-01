import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, runCli } from "../src/cli.js";
import { formatProjects, writeProjects } from "../src/output.js";

describe("@reposync/cli", () => {
  it("parses command flags", () => {
    expect(parseArgs(["validate", "--config", "custom.json", "--json"])).toEqual({
      command: "validate",
      config: "custom.json",
      json: true,
      quiet: false,
      verbose: false,
      workflow: false,
      quality: false,
      format: undefined,
      full: false,
      network: false,
    });
  });

  it("initializes files and validates JSON configuration without GitHub calls", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-cli-"));
    expect(await runCli(["init"], cwd)).toBe(0);
    expect(await runCli(["validate", "--config", "reposync.config.json"], cwd)).toBe(0);
    expect(JSON.parse(await readFile(join(cwd, "reposync.overrides.json"), "utf8"))).toEqual({});
  });

  it("generates a scheduled workflow and reports local doctor checks", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-cli-"));
    expect(await runCli(["init", "--workflow"], cwd)).toBe(0);
    const workflow = await readFile(join(cwd, ".github", "workflows", "reposync.yml"), "utf8");
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("permissions:");
    expect(workflow).toContain("pnpm dlx @reposync/cli sync");
    expect(await runCli(["doctor"], cwd)).toBe(0);
  });

  it("writes deterministic JSON atomically and avoids rewriting identical output", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-cli-"));
    const output = join(cwd, "nested", "projects.json");
    const projects = [
      {
        name: "demo",
        title: "Demo",
        fullName: "octocat/demo",
        description: "Demo",
        githubDescription: null,
        url: "https://github.com/octocat/demo",
        homepage: null,
        demoUrl: null,
        imageUrls: [],
        tags: [],
        topics: [],
        technologies: [],
        features: [],
        introduction: null,
        languages: {},
        stars: 0,
        forks: 0,
        featured: false,
        order: null,
        updatedAt: "2026-01-01",
      },
    ];
    expect(await writeProjects(output, projects)).toBe(true);
    expect(await writeProjects(output, projects)).toBe(false);
    expect(JSON.parse(await readFile(output, "utf8"))).toEqual(projects);
  });

  it("formats projects as TypeScript, YAML, and Markdown", () => {
    const project = {
      name: "demo",
      title: "Demo | Project",
      fullName: "octocat/demo",
      description: "A demo",
      githubDescription: null,
      url: "https://github.com/octocat/demo",
      homepage: null,
      demoUrl: "https://example.com",
      imageUrls: [],
      tags: [],
      topics: [],
      technologies: ["TypeScript"],
      features: [],
      introduction: null,
      languages: { TypeScript: 100 },
      stars: 1,
      forks: 0,
      featured: false,
      order: null,
      updatedAt: "2026-01-01",
    };
    expect(formatProjects([project], "ts")).toContain("satisfies readonly Project[]");
    expect(formatProjects([project], "yaml")).toContain('title: "Demo | Project"');
    expect(formatProjects([project], "markdown")).toContain("Demo \\| Project");
  });
});
