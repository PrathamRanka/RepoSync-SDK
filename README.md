# RepoSync

**Turn your GitHub repositories into portfolio-ready project data.**

RepoSync is an open-source TypeScript SDK that discovers your GitHub repositories, extracts useful project information from README files and repository metadata, and transforms everything into structured, customizable portfolio data.

Stop manually maintaining project arrays every time you build something new.

## Why RepoSync?

Maintaining a developer portfolio involves repetitive work:

- Manually adding new projects.
- Writing project descriptions.
- Updating technology tags.
- Managing GitHub and live-demo links.
- Adding project screenshots.
- Keeping portfolio information synchronized with repositories.

RepoSync automates this process.

Add a configurable GitHub topic to your repositories, initialize RepoSync once, and let the SDK handle project discovery and information extraction.

## Features

- **GitHub Discovery:** Automatically discover repositories belonging to a GitHub user.
- **Topic Filtering:** Only include repositories tagged with a configurable topic.
- **README Parsing:** Extract introductions, features, technologies, links, and images.
- **Technology Detection:** Identify project technologies using deterministic extraction rules.
- **Custom Descriptions:** Choose between GitHub descriptions, README introductions, and custom descriptions.
- **Project Overrides:** Customize individual projects through a JSON configuration file.
- **Type Safety:** Receive strongly typed, normalized TypeScript objects.
- **Framework Independent:** Use the core SDK with any compatible Node.js application.
- **Next.js Ready:** Start with a Next.js portfolio integration.

## How It Works

```text
             GitHub Account
                   |
                   v
          Repository Discovery
                   |
             Topic Filtering
                   |
                   v
           Repository Metadata
                   |
          +--------+--------+
          |                 |
          v                 v
      Languages          README.md
          |                 |
          |           Markdown Parser
          |                 |
          +--------+--------+
                   |
                   v
           Project Normalizer
                   |
                   v
          Custom Override Engine
                   |
                   v
          Portfolio Project Objects
                   |
                   v
             Your Portfolio
```

## Installation

**Requirements**

- Node.js 24+
- A GitHub Personal Access Token
- TypeScript (recommended)

```bash
pnpm add @reposync/core
```

> RepoSync is currently under development. npm installation will be available after the initial release.

## Quick Start

### 1. Configure GitHub authentication

Create a GitHub Personal Access Token with the repository permissions required for your intended discovery scope.

Add it to your environment variables:

```env
GITHUB_TOKEN=your_github_token
```

Never expose this token in client-side code.

### 2. Tag your repositories

Add the following GitHub topic to repositories you want to showcase:

```text
portfolio
```

The topic is configurable.

### 3. Initialize RepoSync

```ts
import { RepoSync } from "@reposync/core";

const reposync = new RepoSync({
  github: {
    username: "your-username",
    token: process.env.GITHUB_TOKEN!,
  },

  discovery: {
    topic: "portfolio",
    includeForks: false,
    includeArchived: false,
  },
});

const projects = await reposync.discover();

console.log(projects);
```

### 4. Use the returned data

```tsx
{projects.map((project) => (
  <ProjectCard
    key={project.id}
    title={project.presentation.title}
    description={project.presentation.description}
    technologies={project.presentation.technologies}
    image={project.presentation.image}
  />
))}
```

## Configuration

RepoSync supports global configuration through `reposync.config.ts`.

```ts
import { defineConfig } from "@reposync/core";

export default defineConfig({
  github: {
    username: "your-username",
    token: process.env.GITHUB_TOKEN!,
  },

  discovery: {
    topic: "portfolio",
    includeForks: false,
    includeArchived: false,
  },

  presentation: {
    description: "readme",
    extractTechnologies: true,
    extractFeatures: true,
    extractImages: true,
    extractDemoUrl: true,
  },
});
```

This configuration defines the default behaviour across discovered projects.

## Project Customization

Not every developer wants their portfolio to use information directly extracted from GitHub.

RepoSync supports project-specific overrides through `reposync.overrides.json`.

```json
{
  "agentpay": {
    "title": "AgentPay",
    "description": "Agent-native commerce infrastructure for autonomous transactions.",
    "technologies": [
      "TypeScript",
      "Redis",
      "PostgreSQL",
      "Next.js"
    ],
    "image": "/projects/agentpay.png",
    "demoUrl": "https://example.com",
    "featured": true,
    "order": 1
  },

  "starswap": {
    "description": "A decentralized token swapping application.",
    "featured": true,
    "order": 2
  }
}
```

Overrides allow developers to:

- Replace automatically extracted descriptions.
- Customize project titles.
- Define technology tags manually.
- Provide custom preview images.
- Override live-demo URLs.
- Mark projects as featured.
- Control project ordering.

### Description Modes

RepoSync supports three description modes:

| Mode | Behaviour |
|---|---|
| `github` | Uses GitHub repository description |
| `readme` | Uses README introduction, falling back to GitHub description |
| `custom` | Uses developer-provided description |

Project-specific overrides take priority over automatically extracted information.

## Returned Project Structure

RepoSync returns normalized project objects instead of exposing raw GitHub API responses.

```ts
interface PortfolioProject {
  id: number;

  name: string;
  slug: string;

  source: {
    githubUrl: string;
    description: string | null;
    readme: string | null;
  };

  metadata: {
    stars: number;
    forks: number;
    topics: string[];
    languages: Record<string, number>;
    homepage: string | null;
    updatedAt: string;
  };

  extracted: {
    introduction: string | null;
    features: string[];
    technologies: string[];
    demoUrl: string | null;
    images: string[];
  };

  presentation: {
    title: string;
    description: string;
    image: string | null;
    technologies: string[];
    featured: boolean;
    order: number;
  };
}
```

The returned object separates original GitHub data, extracted information, and portfolio presentation data.

This makes customization predictable without losing the original repository information.

## Architecture

RepoSync uses a framework-independent core.

| Technology | Purpose |
|---|---|
| TypeScript | SDK implementation |
| Node.js 24+ | Runtime |
| GitHub REST API | Repository discovery |
| Native Fetch | HTTP communication |
| Zod | Runtime validation |
| remark | Markdown parsing |
| remark-gfm | GitHub Flavored Markdown |
| tsup | Package bundling |
| Vitest | Testing |
| pnpm | Package management |
| Turborepo | Workspace orchestration |

## Project Roadmap

### v0.1 — GitHub Portfolio Discovery

- [x] Product architecture
- [x] Configuration and customization design
- [ ] pnpm workspace initialization
- [ ] GitHub API client
- [ ] Repository discovery
- [ ] README extraction
- [ ] Project normalization
- [ ] JSON override engine
- [ ] Next.js example
- [ ] Testing and npm release

### v0.2 — Automatic Synchronization

- GitHub webhooks
- Repository change detection
- Automatic metadata refresh
- Event idempotency
- Cache invalidation

### v0.3 — Framework Integrations

- Next.js adapter
- React integration
- Vite integration
- CLI initialization

### v1.0 — Advanced Capabilities

- Optional storage adapters
- PostgreSQL integration
- Persistent project settings
- Advanced synchronization
- Expanded customization APIs

## Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add or update tests.
5. Submit a pull request.

Please keep contributions focused, tested, and consistent with the existing architecture.

## License

MIT License.

---

**RepoSync**

Built for developers who would rather build projects than maintain portfolio entries.