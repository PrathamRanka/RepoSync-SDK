# Architecture

RepoSync is a pnpm workspace with two independently buildable packages:

```text
GitHub API
   |
@reposync/core
   |-- Octokit pagination and repository filtering
   |-- Remark README extraction
   |-- Zod configuration and override validation
   |-- deterministic normalization, quality analysis, and error hierarchy
   |
@reposync/cli
   |-- config discovery
   |-- validation, preview, list, doctor
   |-- atomic multi-format generation (JSON, TypeScript, YAML, Markdown)
   |-- optional workflow bootstrap
```

The CLI consumes Core public APIs. It does not contain a second GitHub client, parser, or normalizer. `RepoSync` accepts an injected client for deterministic tests and custom integrations.

## Data flow

1. Resolve and validate configuration.
2. Paginate the user's repositories through Octokit.
3. Filter, sort, and limit repository metadata.
4. Fetch repository details, languages, and README content with bounded concurrency.
5. Parse README Markdown using Remark and safe URL rules.
6. Load and validate project overrides.
7. Resolve `override > defaults > README > GitHub metadata`.
8. Return stable `Project[]` data or fail explicitly; no partial discovery result is returned.

## Package structure

```text
packages/core/src/
  config/       schemas and config-file loader
  github/       Octokit client and repository discovery
  parser/       README extraction
  overrides/    JSON override loading and validation
  normalizer.ts stable Project construction
  quality.ts   explainable metadata quality analysis
  errors.ts     public error hierarchy
  reposync.ts   orchestration
packages/cli/src/
  cli.ts        command parsing and command orchestration
  output.ts     atomic deterministic multi-format writes
```

The implementation intentionally avoids plugins, databases, UI components, and AI extraction.
