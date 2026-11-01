import { describe, expect, it } from "vitest";
import {
  ConfigurationError,
  GitHubAPIError,
  GitHubAuthenticationError,
  GitHubRateLimitError,
  RepoSyncError,
} from "../src/errors.js";

describe("error hierarchy", () => {
  it("preserves codes, names, and causes", () => {
    const cause = new Error("network");
    const error = new GitHubAPIError("failed", 500, "https://docs.example", { cause });
    expect(error).toBeInstanceOf(RepoSyncError);
    expect(error.name).toBe("GitHubAPIError");
    expect(error.code).toBe("GITHUB_API_ERROR");
    expect(error.cause).toBe(cause);
    expect(new GitHubAuthenticationError()).toBeInstanceOf(RepoSyncError);
    expect(new GitHubRateLimitError("limited").retryAfter).toBeNull();
    expect(new ConfigurationError("bad").code).toBe("INVALID_CONFIGURATION");
  });
});
