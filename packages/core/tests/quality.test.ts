import { describe, expect, it } from "vitest";
import { analyzeProjectQuality } from "../src/index.js";
import type { Project } from "../src/types/index.js";

const project: Project = {
  name: "demo",
  title: "Demo",
  fullName: "octocat/demo",
  description: "",
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
};

describe("metadata quality", () => {
  it("reports deterministic, explainable missing fields", () => {
    expect(analyzeProjectQuality(project, ["description", "technologies", "demoUrl"])).toEqual({
      score: 0,
      checkedFields: ["description", "technologies", "demoUrl"],
      findings: [
        {
          field: "description",
          severity: "warning",
          message: "Missing description.",
          suggestion: "Add a description in the README or reposync.overrides.json.",
        },
        {
          field: "technologies",
          severity: "warning",
          message: "Missing technologies.",
          suggestion: "Add a technologies in the README or reposync.overrides.json.",
        },
        {
          field: "demoUrl",
          severity: "info",
          message: "Missing demo URL.",
          suggestion: "Add a demo URL in the README or reposync.overrides.json.",
        },
      ],
    });
  });

  it("returns a complete score when no fields are required", () => {
    expect(analyzeProjectQuality(project, [])).toEqual({
      score: 100,
      checkedFields: [],
      findings: [],
    });
  });
});
