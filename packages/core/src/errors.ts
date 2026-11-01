// Small reusable helpers for slug generation, URL handling and pagination-related utilities.



export class RepoSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "RepoSyncError";
  }
}

export class GitHubAPIError extends RepoSyncError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly documentationUrl?: string,
    options?: ErrorOptions
  ) {
    super(message, "GITHUB_API_ERROR", options);
    this.name = "GitHubAPIError";
  }
}

export class GitHubAuthenticationError extends RepoSyncError {
  constructor(message = "GitHub authentication failed.") {
    super(message, "GITHUB_AUTHENTICATION_ERROR");
    this.name = "GitHubAuthenticationError";
  }
}

export class GitHubRateLimitError extends RepoSyncError {
  constructor(
    message: string,
    public readonly retryAfter: number | null = null,
    public readonly resetAt: number | null = null
  ) {
    super(message, "GITHUB_RATE_LIMIT_EXCEEDED");
    this.name = "GitHubRateLimitError";
  }
}

export class RepositoryNotFoundError extends RepoSyncError {
  constructor(owner: string, repository: string) {
    super(
      `Repository "${owner}/${repository}" was not found or is inaccessible.`,
      "REPOSITORY_NOT_FOUND"
    );

    this.name = "RepositoryNotFoundError";
  }
}

export class ConfigurationError extends RepoSyncError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, "INVALID_CONFIGURATION", options);
    this.name = "ConfigurationError";
  }
}

