# @reposync/core

**GitHub-powered portfolio discovery SDK.**

RepoSync discovers your GitHub repositories, extracts useful project information from their READMEs, and transforms everything into structured, portfolio-ready data.

Use it to power your developer portfolio without manually maintaining project details.

## Features

- **GitHub discovery:** Fetch repositories from a GitHub username with pagination support.
- **Private repositories:** Opt in to authenticated owner, collaborator, and organization repository discovery.
- **Repository filtering:** Filter by topics, stars, forks, and archived status.
- **README parsing:** Extract project introductions, technologies, features, demo links, and images.
- **Custom conventions:** Configure README section aliases to match your documentation style.
- **Project overrides:** Customize titles, descriptions, tags, images, demo URLs, featured status, and display order.
- **Configurable defaults:** Define global defaults and override individual projects.
- **Bounded concurrency:** Process repositories concurrently without launching unbounded requests.
- **Type-safe output:** Validate configuration and return structured TypeScript-friendly project data.

## Requirements

- Node.js 24 or later
- A GitHub account

## Installation

```bash
npm install @reposync/core
```

Or:

```bash
pnpm add @reposync/core
```

## Quick Start

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: "your-github-username",
});

const projects = await reposync.discover();

console.log(projects);
```

RepoSync discovers repositories and returns normalized project data that you can use in any frontend or backend application.

## Configuration

Pass configuration directly to the `RepoSync` constructor.

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: "your-github-username",
  topics: ["typescript", "react"],
  excludeForks: true,
  excludeArchived: true,
  limit: 50,
  sortBy: "updated",
});

const projects = await reposync.discover();
```

The CLI can discover the same configuration from `reposync.config.ts` or
`reposync.config.json`. Core applications can use `loadConfig()` when they need
that file-based discovery directly.

### Configuration options

| Option            | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `username`        | GitHub username to discover repositories from                     |
| `topics`          | Repository topics used for filtering                              |
| `token`           | Optional GitHub personal access token                             |
| `includePrivate`  | Opt in to authenticated private repository discovery              |
| `excludeForks`    | Exclude forked repositories                                       |
| `excludeArchived` | Exclude archived repositories                                     |
| `limit`           | Maximum number of repositories to process                         |
| `sortBy`          | Sort repositories by `updated`, `stars`, or `name`                |
| `defaults`        | Global defaults for project metadata                              |
| `aliases`         | README heading aliases for technologies, features, and demos      |
| `filters`         | Any/all topic matching, fork/archive inclusion, and minimum stars |
| `concurrency`     | Maximum concurrent repository detail loads                        |
| `output`          | JSON output path and format used by the CLI                       |

For authenticated requests, provide a GitHub token through the `token` option or the `GITHUB_TOKEN` environment variable.

Set `includePrivate: true` explicitly to use GitHub's authenticated repository
endpoint. Private discovery requires a token with access to the repositories;
the token is never included in `Project` output. Review generated output and
repository permissions before publishing private project metadata.

```env
GITHUB_TOKEN=your_github_token
```

Do not expose your token in client-side code or commit it to version control.

## Project Overrides

GitHub metadata and README content provide a starting point. You can customize individual projects using overrides.

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: "your-github-username",

  defaults: {
    featured: false,
  },

  overrides: {
    "owner/repository-name": {
      title: "Custom Project Title",
      description: "A custom project description.",
      tags: ["TypeScript", "Backend", "Open Source"],
      demoUrl: "https://example.com",
      featured: true,
      order: 1,
    },
  },
});

const projects = await reposync.discover();
```

Overrides allow you to control how projects appear without changing their GitHub repositories or READMEs.

## Project Output

`discover()` returns an array of normalized `Project` objects.

The output includes:

| Property            | Description                      |
| ------------------- | -------------------------------- |
| `name`              | Repository name                  |
| `title`             | Display title                    |
| `fullName`          | Repository owner and name        |
| `description`       | Resolved project description     |
| `githubDescription` | Original GitHub description      |
| `url`               | GitHub repository URL            |
| `homepage`          | GitHub homepage URL              |
| `demoUrl`           | Resolved demo URL                |
| `imageUrls`         | Project image URLs               |
| `tags`              | Resolved project tags            |
| `topics`            | GitHub repository topics         |
| `technologies`      | Extracted technologies           |
| `features`          | Extracted project features       |
| `introduction`      | Extracted README introduction    |
| `languages`         | GitHub language statistics       |
| `stars`             | Repository stars                 |
| `forks`             | Repository forks                 |
| `featured`          | Whether the project is featured  |
| `order`             | Optional display order           |
| `updatedAt`         | Last repository update timestamp |

Import the `Project` type when you need to type your application data.

```ts
import type { Project } from "@reposync/core";

const projects: Project[] = await reposync.discover();
```

## Framework Compatibility

RepoSync Core is framework-independent.

You can use it with:

- Next.js
- React
- Astro
- Express
- Node.js applications
- Static site generators

The SDK handles discovery and normalization. Your application controls how the resulting project data is stored, rendered, or consumed.

## License

MIT
