import { describe, expect, it } from "vitest";
import { diagnoseGitHub, resolveConfig } from "../src/index.js";

describe("GitHub diagnostics", () => {
  it("reports connectivity, rate limits, and authentication without leaking tokens", async () => {
    const config = resolveConfig({ username: "octocat", token: "secret-token" });
    const checks = await diagnoseGitHub(config, {
      paginate: async () => [],
      rest: {
        listForUser: {},
        rateLimit: {
          get: async () => ({ data: { rate: { limit: 60, remaining: 59, reset: 123 } } }),
        },
        users: { getAuthenticated: async () => ({ data: { login: "octocat" } }) },
        repos: {
          get: async () => {
            throw new Error("unused");
          },
          listLanguages: async () => ({ data: {} }),
          getReadme: async () => ({ data: {} }),
        },
      },
    });
    expect(checks).toMatchObject({
      connectivity: { status: "passed" },
      rateLimit: { status: "passed", details: { remaining: 59 } },
      authentication: { status: "passed", details: { login: "octocat" } },
    });
    expect(JSON.stringify(checks)).not.toContain("secret-token");
  });

  it("skips network diagnostics when the injected client does not support them", async () => {
    const config = resolveConfig({ username: "octocat" });
    const checks = await diagnoseGitHub(config, {
      paginate: async () => [],
      rest: { listForUser: {}, repos: {} as never },
    });
    expect(checks.connectivity.status).toBe("skipped");
  });

  it.each([
    [401, "GitHub rejected the configured token."],
    [403, "GitHub rate limits or permissions prevented the diagnostic request."],
    [429, "GitHub rate limits or permissions prevented the diagnostic request."],
  ])("maps HTTP %s to an actionable diagnostic", async (status, message) => {
    const config = resolveConfig({ username: "octocat", token: "secret-token" });
    const checks = await diagnoseGitHub(config, {
      paginate: async () => [],
      rest: {
        listForUser: {},
        rateLimit: {
          get: async () => {
            throw Object.assign(new Error("token secret-token"), { status });
          },
        },
        repos: {},
      },
    });
    expect(checks.connectivity).toMatchObject({ status: "failed", message });
    expect(JSON.stringify(checks)).not.toContain("secret-token");
  });
});
