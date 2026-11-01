# @reposync/core

**Turn GitHub repositories into structured, portfolio-ready project data.**

RepoSync is a TypeScript SDK that discovers GitHub repositories, understands their README content, extracts relevant project metadata, and normalizes everything into a consistent data structure.

Instead of manually maintaining project information across your portfolio, let RepoSync collect what already exists on GitHub and give you control over what should be displayed.

Use the SDK directly in your application, customize individual projects, and consume the resulting data in any frontend or backend framework.

[![npm version](https://img.shields.io/npm/v/@reposync/core)](https://www.npmjs.com/package/@reposync/core)
[![npm downloads](https://img.shields.io/npm/dm/@reposync/core)](https://www.npmjs.com/package/@reposync/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

---

## Table of Contents

- [Why RepoSync?](#why-reposync)
- [How It Works](#how-it-works)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Repository Discovery](#repository-discovery)
- [README Intelligence](#readme-intelligence)
- [Project Customization](#project-customization)
- [Metadata Resolution](#metadata-resolution)
- [Project Output](#project-output)
- [Framework Integration](#framework-integration)
- [GitHub Authentication](#github-authentication)
- [Error Handling](#error-handling)
- [Requirements](#requirements)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Why RepoSync?

Developer portfolios often contain information that already exists across GitHub repositories:

- Project descriptions in repository metadata.
- Technologies mentioned in README files.
- Features documented in project descriptions.
- Screenshots and images embedded in documentation.
- Demo links and deployment URLs.
- Programming language statistics.

Maintaining all of this manually creates duplication and makes portfolios difficult to update.

RepoSync provides a structured discovery and normalization layer between GitHub and your application.

### What it does

- Discovers repositories belonging to a GitHub user.
- Retrieves repository metadata and language statistics.
- Reads and parses README files.
- Extracts technologies, features, introductions, images, and relevant links.
- Supports configurable README section conventions.
- Applies global metadata defaults.
- Supports individual project overrides.
- Produces predictable, framework-independent project objects.

### What it does not do

RepoSync Core focuses on discovery and data normalization.

It does not:
- Generate or host your portfolio.
- Render UI components.
- Automatically deploy your application.
- Require a database.
- Force you to use a particular frontend framework.

Your application remains responsible for rendering, storing, and consuming the returned data.

## How It Works

RepoSync follows a discovery, extraction, and normalization workflow.

```text
              GitHub Username
                     |
                     v
              Repository Discovery
                     |
              Filtering & Sorting
                     |
                     v
             GitHub Repository Data
                     |
             +-------+-------+
             |               |
             v               v
       README Retrieval   Language Data
             |
             v
        README Parsing
             |
      +------+------+ 
      |             |
      v             v
 Technologies    Features
 Images          Introduction
 Demo Links      Other Metadata
      |             |
      +------+------+
             |
             v
       Metadata Resolution
             |
      +------+------+ 
      |             |
      v             v
 Global Defaults  Project Overrides
      |             |
      +------+------+
             |
             v
       Normalized Project[]
             |
             v
       Your Application
```

The result is a consistent project representation, regardless of how much information was originally available on GitHub.

## Installation

Install the package using your preferred package manager.

```bash
npm install @reposync/core
```

```bash
pnpm add @reposync/core
```

```bash
yarn add @reposync/core
```

## Quick Start

Create a RepoSync instance and discover repositories using your GitHub username.

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: "your-github-username",
});

const projects = await reposync.discover();

console.log(projects);
```

That's it.

RepoSync discovers repositories, retrieves available metadata, processes README content, and returns normalized project objects.

### Example output

```ts
[
  {
    name: "my-project",
    title: "My Project",
    fullName: "username/my-project",
    description: "A project built with TypeScript.",
    githubDescription: "Original GitHub description",
    url: "https://github.com/username/my-project",
    homepage: null,
    demoUrl: null,
    imageUrls: [],
    tags: ["TypeScript", "Backend"],
    topics: ["typescript", "nodejs"],
    technologies: ["TypeScript", "Node.js", "Redis"],
    features: ["Rate limiting", "Concurrent request handling"],
    introduction: "An introduction extracted from the README.",
    languages: {
      TypeScript: 12000,
      JavaScript: 3000
    },
    stars: 42,
    forks: 8,
    featured: false,
    order: null,
    updatedAt: "2026-01-01T12:00:00Z"
  }
]
```

The values above illustrate the output structure. Actual values depend on your GitHub repositories and available README content.

## Configuration

RepoSync accepts configuration through its constructor.

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: "your-github-username",

  topics: ["typescript", "react"],

  excludeForks: true,
  excludeArchived: true,

  limit: 50,
  sortBy: "updated",

  defaults: {
    featured: false,
  },
});

const projects = await reposync.discover();
```

### Configuration reference

| Option | Description |
|---|---|
| `username` | GitHub username whose repositories should be discovered |
| `token` | Optional GitHub personal access token |
| `topics` | Repository topics used for filtering |
| `excludeForks` | Exclude forked repositories |
| `excludeArchived` | Exclude archived repositories |
| `limit` | Maximum number of repositories to process |
| `sortBy` | Repository sorting strategy: `updated`, `stars`, or `name` |
| `defaults` | Global defaults applied to project metadata |

Configuration is validated before discovery begins. Invalid configuration produces a descriptive configuration error.

### GitHub token

You can provide a GitHub token through the `token` option or the `GITHUB_TOKEN` environment variable.

```env
GITHUB_TOKEN=your_github_token
```

Never expose a GitHub token in client-side code or commit it to version control.

## Repository Discovery

RepoSync retrieves repositories through the GitHub API and supports pagination.

Repository discovery can be customized through filters and sorting options.

### Topic filtering

```ts
const reposync = new RepoSync({
  username: "your-github-username",
  topics: ["typescript", "react"],
});
```

Topic matching supports configurable matching behaviour, allowing repositories to be selected based on matching any or all requested topics.

Topic matching is case-insensitive.

### Repository exclusions

```ts
const reposync = new RepoSync({
  username: "your-github-username",
  excludeForks: true,
  excludeArchived: true,
});
```

### Sorting and limits

```ts
const reposync = new RepoSync({
  username: "your-github-username",
  limit: 25,
  sortBy: "stars",
});
```

Supported sorting strategies:

- `updated`
- `stars`
- `name`

Repository processing uses bounded concurrency to avoid launching an unbounded number of operations.

## README Intelligence

One of RepoSync's main responsibilities is extracting useful project information from README files.

Rather than treating README content as plain text, RepoSync parses its Markdown structure.

### Supported extraction

| Information | Description |
|---|---|
| Introduction | Main introductory content |
| Technologies | Technologies identified from relevant README sections |
| Features | Features extracted from documented sections |
| Demo links | Relevant demonstration and deployment links |
| Images | Image references from README content |

RepoSync supports structured Markdown content, including:

- Headings and paragraphs.
- Nested lists.
- Tables.
- GitHub Flavored Markdown.
- Code blocks.
- Images and links.

### Configurable README conventions

Different developers structure their README files differently.

For example, one project might use:

```md
## Tech Stack
## Features
## Live Demo
```

Another might use:

```md
## Built With
## What It Does
## Deployment
```

RepoSync supports configurable section aliases so different README conventions can map to the same normalized project fields.

This means you do not need to rewrite every README to follow one rigid format.

The parser also handles missing or incomplete README content without requiring every repository to contain every supported section.

## Project Customization

Automatic extraction is useful, but it should not take control away from developers.

RepoSync supports two customization levels:

1. Global defaults for shared project metadata.
2. Individual project overrides for project-specific information.

This allows you to automate discovery while retaining complete control over how your projects are presented.

### Global defaults

Use `defaults` to define shared metadata values.

```ts
const reposync = new RepoSync({
  username: "your-github-username",

  defaults: {
    featured: false,
  },
});
```

Global defaults are useful when you want consistent behaviour across projects without repeating the same configuration.

### Individual project overrides

Some projects deserve custom descriptions, titles, images, or display ordering.

You can override individual projects using their repository name or full repository identifier.

```ts
const reposync = new RepoSync({
  username: "your-github-username",

  overrides: {
    "username/my-project": {
      title: "Custom Project Title",
      description: "A manually written project description.",
      tags: ["TypeScript", "Backend", "Open Source"],
      demoUrl: "https://example.com",
      featured: true,
      order: 1,
    },
  },
});

const projects = await reposync.discover();
```

Supported override fields include:

| Field | Description |
|---|---|
| `title` | Custom display title |
| `description` | Custom project description |
| `tags` | Custom project tags |
| `image` | Primary project image |
| `images` | Additional project images |
| `demoUrl` | Custom demonstration URL |
| `featured` | Whether the project should be featured |
| `order` | Custom display ordering |

Overrides can explicitly set values such as `false`, empty arrays, and zero where supported. They are not treated as missing values.

### JSON-based overrides

For larger portfolios, keep project customization separate from your application code.

For example, create a `reposync.overrides.json` file:

```json
{
  "username/my-project": {
    "title": "My Project",
    "description": "A custom project description.",
    "tags": ["TypeScript", "Backend"],
    "featured": true,
    "order": 1
  },
  "username/another-project": {
    "title": "Another Project",
    "featured": false,
    "order": 2
  }
}
```

You can load this JSON in your application and pass the parsed object as the `overrides` option.

```ts
import { readFile } from "node:fs/promises";
import { RepoSync } from "@reposync/core";

const overrides = JSON.parse(
  await readFile("./reposync.overrides.json", "utf8")
);

const reposync = new RepoSync({
  username: "your-github-username",
  overrides,
});

const projects = await reposync.discover();
```

This keeps project-specific content outside your discovery logic and makes it easier to maintain.

## Metadata Resolution

RepoSync combines information from multiple sources.

The intended resolution order is:

```text
Individual Project Overrides
             |
             v
      Global Defaults
             |
             v
       README Metadata
             |
             v
      GitHub Metadata
```

In other words:

**Project overrides > Global defaults > README-derived data > GitHub metadata**

For example, if a GitHub repository has a description but you provide a custom description in its override, the custom description takes precedence.

This separation gives you a useful balance between automation and manual control.

GitHub remains the source of repository information, README files provide project context, global defaults establish consistent behaviour, and individual overrides handle exceptions.

## Project Output

The `discover()` method returns an array of normalized `Project` objects.

The `Project` type is exported by the package.

```ts
import type { Project } from "@reposync/core";

const projects: Project[] = await reposync.discover();
```

### Project reference

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Repository name |
| `title` | `string` | Display title |
| `fullName` | `string` | Repository owner and name |
| `description` | `string` | Resolved project description |
| `githubDescription` | `string \| null` | Original GitHub description |
| `url` | `string` | GitHub repository URL |
| `homepage` | `string \| null` | GitHub homepage |
| `demoUrl` | `string \| null` | Resolved demonstration URL |
| `imageUrls` | `string[]` | Project image URLs |
| `tags` | `string[]` | Resolved project tags |
| `topics` | `string[]` | GitHub repository topics |
| `technologies` | `string[]` | Extracted technologies |
| `features` | `string[]` | Extracted features |
| `introduction` | `string \| null` | README introduction |
| `languages` | `Record<string, number>` | GitHub language statistics |
| `stars` | `number` | Repository stars |
| `forks` | `number` | Repository forks |
| `featured` | `boolean` | Featured project flag |
| `order` | `number \| null` | Optional display order |
| `updatedAt` | `string` | Last repository update timestamp |

The output is framework-independent and can be passed directly into your own application logic.

## Framework Integration

RepoSync Core does not depend on a frontend framework.

Use the returned project data wherever you need it.

### Next.js

```ts
// lib/projects.ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  username: process.env.GITHUB_USERNAME!,
});

export const getProjects = () => reposync.discover();
```

You can consume the result in your Server Components or other server-side application code.

Keep GitHub credentials on the server. Do not expose them through client-side environment variables.

### React

Pass the project data to your React components through props or application state.

### Astro

Use RepoSync during your build or server-side data preparation and render the returned projects in your pages.

### Other environments

The core SDK can also be used with Node.js applications, Express, and other JavaScript or TypeScript environments compatible with its Node.js requirements.

## Error Handling

RepoSync exposes structured errors to help applications distinguish between different failure conditions.

| Error | Description |
|---|---|
| `RepoSyncError` | Base error class |
| `ConfigurationError` | Invalid configuration or overrides |
| `GitHubAPIError` | General GitHub API failure |
| `GitHubAuthenticationError` | GitHub authentication failure |
| `GitHubRateLimitError` | GitHub API rate limit exceeded |
| `RepositoryNotFoundError` | Repository missing or inaccessible |

Example:

```ts
import {
  RepoSync,
  ConfigurationError,
  GitHubRateLimitError,
} from "@reposync/core";

try {
  const reposync = new RepoSync({
    username: "your-github-username",
  });

  const projects = await reposync.discover();

  console.log(projects);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error("Invalid RepoSync configuration:", error.message);
  } else if (error instanceof GitHubRateLimitError) {
    console.error("GitHub rate limit exceeded:", error.message);
  } else {
    throw error;
  }
}
```

## Requirements

- Node.js 24 or later.
- A GitHub username.
- Internet connectivity for GitHub API requests.

A GitHub token is optional for public repository discovery, but authenticated requests are recommended for higher API rate limits.

## Roadmap

RepoSync is being developed as a modular developer tooling ecosystem.

Planned capabilities include:

- **CLI:** Initialize configuration, validate overrides, preview discovered projects, and synchronize project data.
- **Build-time generation:** Generate portable JSON project data for static sites and frontend applications.
- **Metadata suggestions:** Identify missing project information and suggest improvements without silently overwriting developer-defined content.
- **Automated synchronization:** GitHub Actions integration for scheduled and manual project updates.
- **Framework integrations:** Additional integrations and reusable UI tooling.

These are planned capabilities and are not part of the current `@reposync/core` release.

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

- Repository: [RepoSync-SDK](https://github.com/PrathamRanka/RepoSync-SDK)
- Issues: [Report a bug or request a feature](https://github.com/PrathamRanka/RepoSync-SDK/issues)

Before submitting changes, run the project's tests, type checking, linting, and build.

## License

RepoSync Core is released under the [MIT License](./LICENSE).