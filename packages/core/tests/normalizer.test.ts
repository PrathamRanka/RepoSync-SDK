import { describe, expect, it } from "vitest";
import { normalizeProject } from "../src/normalizer.js";

const repository = {
  name: "demo",
  full_name: "octocat/demo",
  html_url: "https://github.com/octocat/demo",
  description: "GitHub description",
  homepage: "https://demo.example",
  topics: ["portfolio"],
  stargazers_count: 7,
  forks_count: 2,
  archived: false,
  fork: false,
  updated_at: "2026-01-01",
};
const readme = {
  technologies: ["README technology"],
  features: ["README feature"],
  demoUrl: "https://readme.example",
  imageUrls: ["./readme.png"],
  introduction: "README introduction",
};

describe("normalizeProject", () => {
  it("uses override > defaults > README > GitHub metadata for every field", () => {
    const project = normalizeProject(
      repository,
      { JavaScript: 100 },
      readme,
      {
        title: "Default title",
        description: "Default description",
        tags: ["Default tag"],
        technologies: ["Default technology"],
        features: ["Default feature"],
        image: "/default.png",
        demoUrl: "https://default.example",
        featured: true,
        order: 0,
      },
      {
        title: "",
        description: "",
        tags: [],
        technologies: [],
        features: [],
        images: [],
        demoUrl: "",
        featured: false,
        order: 0,
      },
    );
    expect(project.title).toBe("");
    expect(project.description).toBe("");
    expect(project.tags).toEqual([]);
    expect(project.technologies).toEqual([]);
    expect(project.features).toEqual([]);
    expect(project.imageUrls).toEqual([]);
    expect(project.demoUrl).toBe("");
    expect(project.featured).toBe(false);
    expect(project.order).toBe(0);
  });

  it("uses metadata fallback and returns the stable framework-independent shape", () => {
    const project = normalizeProject(
      repository,
      { TypeScript: 100 },
      {
        technologies: [],
        features: [],
        demoUrl: null,
        imageUrls: [],
        introduction: null,
      },
      {},
    );
    expect(project).toEqual({
      name: "demo",
      title: "demo",
      fullName: "octocat/demo",
      description: "GitHub description",
      githubDescription: "GitHub description",
      url: "https://github.com/octocat/demo",
      homepage: "https://demo.example",
      demoUrl: "https://demo.example",
      imageUrls: [],
      tags: ["portfolio"],
      topics: ["portfolio"],
      technologies: ["TypeScript"],
      features: [],
      introduction: null,
      languages: { TypeScript: 100 },
      stars: 7,
      forks: 2,
      featured: false,
      order: null,
      updatedAt: "2026-01-01",
    });
  });
});
