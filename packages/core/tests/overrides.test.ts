import { describe, expect, it } from "vitest";
import { resolveConfig } from "../src/config/config.js";
import { normalizeProject } from "../src/normalizer.js";

describe("configuration and normalization", () => {
  it("validates filters and applies project > defaults > README > metadata precedence", () => {
    const config = resolveConfig({
      username: "octocat",
      filters: { topics: ["portfolio"], topicMatch: "all", minStars: 5 },
      aliases: { technologies: ["stack"], features: ["highlights"], demos: ["try it"] },
      defaults: { description: "global", technologies: ["Default Tech"], featured: true },
    });
    expect(config.filters).toMatchObject({
      topics: ["portfolio"], topicMatch: "all", minStars: 5, includeForks: false, includeArchived: false,
    });
    const project = normalizeProject({
      name: "demo", full_name: "octocat/demo", html_url: "https://github.com/octocat/demo",
      description: "GitHub", homepage: null, topics: ["portfolio"], stargazers_count: 7,
      forks_count: 1, archived: false, fork: false, updated_at: "2026-01-01",
    }, { JavaScript: 100 }, {
      technologies: ["README Tech"], features: ["README Feature"], demoUrl: "https://readme.example",
      imageUrls: [], introduction: "README description",
    }, config.defaults, { description: "Project description", technologies: ["Project Tech"] });
    expect(project.description).toBe("Project description");
    expect(project.technologies).toEqual(["Project Tech"]);
    expect(project.features).toEqual(["README Feature"]);
    expect(project.demoUrl).toBe("https://readme.example");
    expect(project.featured).toBe(true);
  });

  it("rejects unknown configuration keys", () => {
    expect(() => resolveConfig({ username: "octocat", unexpected: true })).toThrow("Invalid RepoSync configuration");
  });
});