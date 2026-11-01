import { describe, expect, it } from "vitest";
import { ConfigurationError } from "../src/errors.js";
import { defineConfig, resolveConfig } from "../src/config/config.js";

describe("configuration", () => {
  it("applies complete defaults and preserves explicit false and zero values", () => {
    const config = resolveConfig({
      username: " octocat ",
      token: "",
      excludeForks: false,
      excludeArchived: false,
      limit: 1,
      filters: { includeForks: false, includeArchived: false, minStars: 0 },
    });
    expect(config.username).toBe("octocat");
    expect(config.excludeForks).toBe(false);
    expect(config.filters).toMatchObject({
      includeForks: false,
      includeArchived: false,
      minStars: 0,
      topics: [],
    });
    expect(config.aliases.technologies).toContain("technology");
  });

  it("supports the documented nested compatibility shape", () => {
    const config = resolveConfig({
      github: { username: "octocat", token: "secret" },
      discovery: { topic: "portfolio", includeForks: true, includeArchived: true },
    });
    expect(config.username).toBe("octocat");
    expect(config.filters).toMatchObject({
      topics: ["portfolio"],
      includeForks: true,
      includeArchived: true,
    });
  });

  it("rejects invalid values and unexpected properties", () => {
    expect(() => resolveConfig({ username: "", limit: 0 })).toThrow(ConfigurationError);
    expect(() => resolveConfig({ username: "octocat", filters: { minStars: -1 } })).toThrow(
      ConfigurationError,
    );
    expect(() =>
      resolveConfig({ username: "octocat", defaults: { demoUrl: "javascript:alert(1)" } }),
    ).toThrow(ConfigurationError);
    expect(() => resolveConfig({ username: "octocat", unknown: true })).toThrow(ConfigurationError);
  });

  it("validates defineConfig without changing the input", () => {
    const input = { username: "octocat", aliases: { technologies: ["Stack"] } };
    expect(defineConfig(input)).toBe(input);
  });

  it("validates output formats and quality fields", () => {
    const config = resolveConfig({
      username: "octocat",
      output: { file: "projects.yaml", format: "yaml" },
      quality: { required: ["description", "image"] },
    });
    expect(config.output.format).toBe("yaml");
    expect(config.quality.required).toEqual(["description", "image"]);
    expect(() => resolveConfig({ username: "octocat", output: { format: "toml" } })).toThrow(
      ConfigurationError,
    );
  });

  it("requires authentication for opt-in private discovery", () => {
    expect(() => resolveConfig({ username: "octocat", includePrivate: true, token: "" })).toThrow(
      /Private repository discovery requires/,
    );
  });
});
