# @reposync/core

Framework-independent GitHub repository discovery for Node.js applications.
RepoSync Core uses Octokit for GitHub access, Remark for deterministic README
metadata extraction, and Zod for external configuration validation.

## Requirements

- Node.js 24 or newer
- A GitHub username
- A token is optional for public repositories and required for private discovery

## Installation

```bash
npm install @reposync/core@2.0.1
```

```bash
pnpm add @reposync/core@2.0.1
```

## Quick start

```ts
import { RepoSync } from "@reposync/core";

const sync = new RepoSync({
  username: "your-github-username",
  topics: ["portfolio"],
  filters: {
    topicMatch: "any",
    includeForks: false,
    includeArchived: false,
    minStars: 0,
  },
});

const projects = await sync.discover();
console.log(projects);
```

`discover()` returns a stable, framework-independent `Project[]`. Core does
not render UI, write files, or include GitHub tokens in project output.

## Configuration

`resolveConfig()` validates and applies defaults. `defineConfig()` validates a
configuration for use in TypeScript files. The CLI uses the same schema.

```ts
import { RepoSync } from "@reposync/core";

const sync = new RepoSync({
  username: "your-github-username",
  token: process.env.GITHUB_TOKEN,
  includePrivate: false,
  filters: {
    topics: ["typescript", "react"],
    topicMatch: "all",
    includeForks: false,
    includeArchived: false,
    minStars: 1,
  },
  sortBy: "updated",
  limit: 50,
  concurrency: 4,
});
```

Important options are `username`, `token`, `includePrivate`, `topics`,
`filters`, `excludeForks`, `excludeArchived`, `limit`, `sortBy`, `aliases`,
`defaults`, `overrides`, and `concurrency`. Topic matching is
case-insensitive. `minStars` is inclusive, and limits are applied after
filtering and sorting.

Private discovery is opt-in:

```ts
const sync = new RepoSync({
  username: "your-github-username",
  token: process.env.GITHUB_TOKEN,
  includePrivate: true,
});
```

Never expose `GITHUB_TOKEN` to browser code or commit it to source control.

## README extraction

README parsing is deterministic and uses Markdown ASTs rather than custom
regular expressions. Core extracts introductions, technologies, features,
HTTP(S) demo links, safe images, nested lists, tables, and paragraphs. Code
blocks are not treated as metadata. Configure section aliases when a project
uses different headings:

```ts
const sync = new RepoSync({
  username: "your-github-username",
  aliases: {
    technologies: ["stack", "built with"],
    features: ["capabilities"],
    demos: ["deployment", "live site"],
  },
});
```

Unsafe URL schemes are rejected. Relative image paths and HTTP(S) image URLs
are supported. Missing READMEs are valid; malformed API responses, excessive
README content, authentication failures, rate limits, and other GitHub errors
are surfaced through the exported error hierarchy.

## Defaults and overrides

Metadata is resolved in this order:

```text
individual override > global defaults > README metadata > GitHub metadata
```

Explicit `false`, `0`, empty strings, and empty arrays are preserved. Full
repository keys such as `owner/repository` take precedence over short-name
compatibility entries.

```ts
const sync = new RepoSync({
  username: "your-github-username",
  defaults: { featured: false },
  overrides: {
    "owner/repository": {
      title: "Custom title",
      tags: ["TypeScript"],
      demoUrl: "https://example.com",
      featured: true,
      order: 1,
    },
  },
});
```

## Project output

```ts
import type { Project } from "@reposync/core";

const projects: Project[] = await sync.discover();
```

`Project` includes repository identity and URLs, resolved description and
title, tags, topics, technologies, features, README introduction, images,
demo URL, language statistics, stars, forks, featured state, order, and
`updatedAt`. The shape is framework-independent and stable for consumers.

## Public API

The package exports `RepoSync`, `Project`, `resolveConfig`, `defineConfig`,
`loadConfig`, `parseReadme`, `normalizeProject`, `discoverRepositories`,
`createGitHubClient`, `loadOverrides`, `diagnoseGitHub`, quality analysis,
sync-state helpers, and the typed error hierarchy.

## Errors and limitations

Catch `ConfigurationError`, `GitHubAuthenticationError`,
`GitHubRateLimitError`, `GitHubAPIError`, and `RepositoryNotFoundError` when
applications need specific handling. API causes and rate-limit information are
preserved where available, while configured tokens are redacted.

Discovery performs complete paginated repository discovery. Incremental CLI
sync classifies normalized projects using local fingerprints; it does not use
ETag or conditional GitHub requests. GitHub API availability, permissions,
rate limits, and repository README quality can affect results.

## Further documentation

- [Configuration guide](../../docs/configuration.md)
- [Architecture](../../docs/architecture.md)
- [Testing guide](../../docs/testing.md)
- [Root project documentation](../../README.md)

## License

MIT
