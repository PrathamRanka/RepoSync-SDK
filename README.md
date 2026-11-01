# RepoSync

[![CI](https://github.com/PrathamRanka/RepoSync-SDK/actions/workflows/ci.yml/badge.svg)](https://github.com/PrathamRanka/RepoSync-SDK/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node.js 24+](https://img.shields.io/badge/node-24%2B-339933.svg)](https://nodejs.org/)

RepoSync is a framework-independent GitHub project discovery toolkit. It discovers repositories, parses README content, resolves metadata and overrides, and produces stable project data for portfolios, static sites, and build pipelines.

The workspace contains:

- [`@reposync/core`](./packages/core/) — the typed discovery and normalization SDK.
- [`@reposync/cli`](./packages/cli/) — configuration, preview, validation, diagnostics, and deterministic output generation.

Repository snapshot: **0 stars, 0 forks, 0 open issues**, MIT licensed. These figures were checked against GitHub on 2026-11-01; they are not download or usage claims.

## Requirements

- Node.js 24 or newer.
- pnpm 11 (for repository development).
- A GitHub username.
- A GitHub token is optional for public repositories and recommended for higher API limits.

## Install

```bash
pnpm add @reposync/core
pnpm add -D @reposync/cli
```

The packages are configured for public npm publishing. Use the package links for release status:

- [@reposync/core on npm](https://www.npmjs.com/package/@reposync/core)
- [@reposync/cli on npm](https://www.npmjs.com/package/@reposync/cli)

## Core quick start

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: "your-github-username",
  token: process.env.GITHUB_TOKEN,
  topics: ["portfolio"],
  filters: {
    topicMatch: "any",
    includeForks: false,
    includeArchived: false,
    minStars: 0,
  },
});

const projects = await reposync.discover();
```

`discover()` returns a stable, framework-independent `Project[]`. Tokens are never included in project output.

## Configuration files

The CLI discovers `reposync.config.ts` first, then `reposync.config.json`, from the current working directory. TypeScript configuration uses `defineConfig`; JSON configuration uses the same validated shape.

```ts
// reposync.config.ts
import { defineConfig } from "@reposync/core";

export default defineConfig({
  username: "your-github-username",
  topics: ["portfolio"],
  token: process.env.GITHUB_TOKEN,
  filters: {
    topicMatch: "all",
    includeForks: false,
    includeArchived: false,
    minStars: 1,
  },
  aliases: {
    technologies: ["technologies", "tech stack", "built with"],
    features: ["features", "capabilities"],
    demos: ["demo", "live demo", "deployment"],
  },
  defaults: {
    featured: false,
  },
  concurrency: 4,
  output: {
    file: "projects.json",
    format: "json", // json | ts | yaml | markdown
  },
  quality: {
    required: ["description", "technologies", "features", "demoUrl", "image"],
  },
});
```

Important options are `username`, `token`, `topics`, `filters`, `excludeForks`, `excludeArchived`, `limit`, `sortBy`, `aliases`, `defaults`, `concurrency`, and `output`. Invalid values and unknown properties fail before API discovery.

## Overrides and precedence

Create `reposync.overrides.json` beside the configuration:

```json
{
  "owner/repository": {
    "title": "Public project title",
    "description": "A carefully written description.",
    "tags": ["TypeScript", "Open Source"],
    "technologies": ["TypeScript", "Node.js"],
    "images": ["./assets/project.png"],
    "demoUrl": "https://example.com",
    "featured": true,
    "order": 1
  }
}
```

Full repository names take precedence over short-name compatibility entries. Explicit `false`, `0`, empty strings, and empty arrays are preserved. Resolution is deterministic:

```text
project override > global defaults > README data > GitHub metadata
```

## CLI

```bash
pnpm exec reposync init
pnpm exec reposync validate
pnpm exec reposync preview --json --quality
pnpm exec reposync list
pnpm exec reposync sync --format json
pnpm exec reposync doctor --json
```

| Command    | Purpose                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `init`     | Creates starter JSON configuration and overrides. Add `--workflow` for a least-privilege manual GitHub Actions workflow. |
| `validate` | Validates configuration and overrides without GitHub API calls.                                                          |
| `preview`  | Discovers and prints normalized projects without writing output.                                                         |
| `list`     | Prints repository summaries from discovery.                                                                              |
| `sync`     | Atomically writes JSON, TypeScript, YAML, or Markdown output; unchanged content is not rewritten.                        |
| `doctor`   | Reports Node version, configuration discovery, and token presence. Network diagnostics remain opt-in at this stage.      |

Common flags are `--config <path>`, `--format <format>`, `--quality`, `--json`, `--verbose`, `--quiet`, `--workflow`, and `--help`. Exit code `0` means success, `1` means a configuration or runtime failure, and `2` means invalid CLI usage.

## Generated output

`reposync sync` defaults to `projects.json`. Use `--format json|ts|yaml|markdown` or configure `output.format`. It creates parent directories, writes through a temporary file, renames atomically, and skips rewriting identical content. TypeScript output is importable and typed with `Project`; YAML and Markdown preserve the primary project metadata. Generation runs server-side or at build time; never put `GITHUB_TOKEN` in browser code.

## Metadata quality

Use `reposync preview --quality --json` to receive projects plus deterministic findings for configured fields. Quality reports explain each missing field and provide a remediation suggestion; they never invent or overwrite metadata. Configure checked fields with `quality.required`. The score is a transparent percentage of configured fields present, not an AI-generated assessment.

## README extraction

Remark and GitHub-Flavored Markdown parsing support introductions, paragraphs, nested lists, tables, code blocks, technologies, features, HTTP(S) demo links, and safe relative or HTTP(S) images. Sections are selected through aliases. Missing READMEs are valid; malformed responses, unsafe URL schemes, and oversized README content are rejected or ignored according to the Core error contract.

## Error handling

Core exports `RepoSyncError`, `ConfigurationError`, `GitHubAPIError`, `GitHubAuthenticationError`, `GitHubRateLimitError`, and `RepositoryNotFoundError`. Catch specific errors when an application needs different retry or user-facing behavior. API failures preserve causes where available, rate-limit headers are exposed, and configured tokens are redacted from error messages.

## GitHub Actions

Run `reposync init --workflow` to create a manual workflow starter. It uses Node 24, checks out the repository, and passes `GITHUB_TOKEN` only to the sync command. Review and customize the workflow before enabling schedules or committing generated output.

The repository CI workflow runs on pushes and pull requests. It validates the lockfile, formatting, lint, typecheck, tests, builds, package contents, and dependency audit. The generated workflow includes manual and scheduled triggers, concurrency protection, explicit contents write permission, and conditional commits. Review permissions and paths before enabling it. The release workflow is manual and does not publish or create a release unless explicitly dispatched with the publish input enabled.

## Development

```bash
git clone https://github.com/PrathamRanka/RepoSync-SDK.git
cd RepoSync-SDK
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Tests use injected GitHub clients and never call live GitHub during regular runs. The Core live smoke test is skipped unless `REPOSYNC_LIVE_TEST`, `REPOSYNC_LIVE_USERNAME`, and suitable credentials are provided.

Read the full guides:

- [Architecture](./docs/architecture.md)
- [Configuration](./docs/configuration.md)
- [API reference](./docs/api.md)
- [CLI reference](./docs/cli.md)
- [Migration from 0.1.0](./docs/migration.md)
- [Testing](./docs/testing.md)
- [Metadata quality](./docs/quality.md)
- [Security](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)
- [Support](./SUPPORT.md)
- [Changelog](./CHANGELOG.md)

## License

RepoSync is released under the [MIT License](./LICENSE).
