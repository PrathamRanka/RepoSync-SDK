import { describe, expect, it } from "vitest";
import { RepoSync } from "../src/reposync.js";

describe.skipIf(!process.env.REPOSYNC_LIVE_TEST)("manual live smoke test", () => {
  it("discovers the configured GitHub account", async () => {
    const username = process.env.REPOSYNC_LIVE_USERNAME;
    expect(username).toBeTruthy();
    const projects = await new RepoSync({ username: username!, token: process.env.GITHUB_TOKEN }).discover();
    expect(Array.isArray(projects)).toBe(true);
  });
});
