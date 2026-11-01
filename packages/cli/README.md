# @reposync/cli

The RepoSync command-line tool for validating configuration, discovering
projects, generating deterministic output, and diagnosing local or GitHub
connectivity.

## Requirements and installation

- Node.js 24 or newer
- A GitHub username
- A token is optional for public discovery and required for private discovery

Install the CLI and its matching Core release:

```bash
npm install --save-dev @reposync/cli@2.0.1 @reposync/core@2.0.1
```

```bash
pnpm add --save-dev @reposync/cli@2.0.1 @reposync/core@2.0.1
```

The executable is `reposync`.

## Quick start

```bash
pnpm exec reposync init
pnpm exec reposync validate
pnpm exec reposync preview --json
pnpm exec reposync sync --format json
pnpm exec reposync doctor --json
```

The CLI searches the current directory for `reposync.config.ts`, then
`reposync.config.json`, unless `--config <path>` is provided. It reads
`reposync.overrides.json` beside the configuration.

## Commands

| Command    | Behavior                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------- |
| `init`     | Creates starter configuration and overrides. `--workflow` also creates a GitHub Actions starter.           |
| `validate` | Validates configuration and overrides without GitHub API calls.                                            |
| `preview`  | Discovers and prints normalized projects without writing output.                                           |
| `list`     | Prints repository summaries from discovery.                                                                |
| `sync`     | Generates output atomically and updates incremental state after success.                                   |
| `doctor`   | Checks local setup. Add `--network` for opt-in GitHub connectivity, authentication, and rate-limit checks. |

Common flags are `--config <path>`, `--format <format>`, `--quality`, `--full`,
`--network`, `--json`, `--verbose`, `--quiet`, `--workflow`, and `--help`.
Exit code `0` indicates success, `1` a configuration or runtime failure, and
`2` invalid CLI usage.

## Configuration

TypeScript configuration can use Core's `defineConfig`:

```ts
import { defineConfig } from "@reposync/core";

export default defineConfig({
  username: "your-github-username",
  token: process.env.GITHUB_TOKEN,
  topics: ["portfolio"],
  filters: {
    topicMatch: "any",
    includeForks: false,
    includeArchived: false,
    minStars: 0,
  },
  aliases: {
    technologies: ["technologies", "stack"],
    features: ["features", "capabilities"],
    demos: ["demo", "live site"],
  },
  defaults: { featured: false },
  output: { file: "projects.json", format: "json" },
  quality: {
    required: ["description", "technologies", "features", "demoUrl", "image"],
  },
});
```

JSON configuration uses the same validated shape. Unknown properties and
invalid URLs, filters, formats, and private-repository settings fail before
discovery.

## Overrides and precedence

Put per-repository overrides in `reposync.overrides.json`:

```json
{
  "owner/repository": {
    "title": "Custom title",
    "description": "A portfolio description.",
    "technologies": ["TypeScript", "Node.js"],
    "demoUrl": "https://example.com",
    "featured": true,
    "order": 1
  }
}
```

Resolution is deterministic:

```text
individual override > global defaults > README metadata > GitHub metadata
```

Explicit false values, zero, empty strings, and empty arrays are retained.

## Output and synchronization

`sync` supports `json`, `ts`, `yaml`, and `markdown` output. It creates parent
directories, writes atomically, skips unchanged content, and never writes
tokens. Incremental state is stored in `.reposync/state.json`; use
`reposync sync --full` to bypass prior state. State is updated only after
successful output generation and protected by a lock with stale-lock recovery.

## Quality and diagnostics

`reposync preview --quality --json` reports deterministic missing-field
findings configured by `quality.required`. It does not invent metadata.

`reposync doctor` performs local checks without credentials. Add
`--network` to check public GitHub connectivity, authentication, rate limits,
and actionable HTTP failures. Diagnostic output redacts configured tokens.

## GitHub Actions

`reposync init --workflow` creates a reviewed starter workflow. It uses Node 24,
passes `GITHUB_TOKEN` only to the sync command, and supports manual and
scheduled execution with conditional commits. Review permissions and paths
before enabling it.

## Further documentation

- [CLI reference](../../docs/cli.md)
- [Configuration guide](../../docs/configuration.md)
- [Examples](../../docs/examples.md)
- [Testing guide](../../docs/testing.md)
- [Core SDK](../core/README.md)

## Development

```bash
pnpm install --frozen-lockfile
pnpm --filter @reposync/cli typecheck
pnpm --filter @reposync/cli test
pnpm --filter @reposync/cli build
```

## License

MIT
