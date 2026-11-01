import type { ResolvedRepoSyncConfig } from "./config/config.js";
import { createGitHubClient, type GitHubClient } from "./github/repositories.js";

export type DiagnosticCheck = {
  status: "passed" | "warning" | "failed" | "skipped";
  message: string;
  details?: Record<string, string | number | null>;
};

function errorStatus(error: unknown): number {
  const value = error as { status?: number; response?: { status?: number } };
  return value.response?.status ?? value.status ?? 0;
}

export async function diagnoseGitHub(
  config: ResolvedRepoSyncConfig,
  client: GitHubClient = createGitHubClient(config.token),
): Promise<Record<string, DiagnosticCheck>> {
  const checks: Record<string, DiagnosticCheck> = {};
  if (!client.rest.rateLimit) {
    checks.connectivity = {
      status: "skipped",
      message: "The injected GitHub client does not expose rate-limit diagnostics.",
    };
    return checks;
  }
  try {
    const response = await client.rest.rateLimit.get();
    checks.connectivity = { status: "passed", message: "GitHub API is reachable." };
    checks.rateLimit = {
      status: response.data.rate.remaining > 0 ? "passed" : "warning",
      message:
        response.data.rate.remaining > 0
          ? "GitHub API rate limit has remaining requests."
          : "GitHub API rate limit is exhausted.",
      details: {
        limit: response.data.rate.limit,
        remaining: response.data.rate.remaining,
        reset: response.data.rate.reset,
      },
    };
  } catch (error) {
    const status = errorStatus(error);
    checks.connectivity = {
      status: "failed",
      message:
        status === 401
          ? "GitHub rejected the configured token."
          : status === 403 || status === 429
            ? "GitHub rate limits or permissions prevented the diagnostic request."
            : "GitHub API connectivity check failed.",
    };
    checks.rateLimit = { status: "skipped", message: "Rate-limit status is unavailable." };
    return checks;
  }
  if (!config.token) {
    checks.authentication = {
      status: "warning",
      message: "No token configured; only public GitHub access is available.",
    };
  } else if (client.rest.users?.getAuthenticated) {
    try {
      const response = await client.rest.users.getAuthenticated();
      checks.authentication = {
        status: "passed",
        message: "GitHub token is accepted.",
        details: { login: response.data.login },
      };
    } catch (error) {
      checks.authentication = {
        status: "failed",
        message:
          errorStatus(error) === 401
            ? "GitHub token is invalid or expired."
            : "GitHub authentication check failed.",
      };
    }
  } else {
    checks.authentication = {
      status: "skipped",
      message: "The injected GitHub client does not expose authentication diagnostics.",
    };
  }
  return checks;
}
