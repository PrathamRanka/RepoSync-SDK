# Configuration guide

Configuration is validated with the Core Zod schema. `reposync.config.ts` is preferred when environment variables or comments are useful; `reposync.config.json` is useful for tooling and portable projects.

The CLI searches the current directory for `reposync.config.ts`, then `reposync.config.json`. `--config` selects an explicit path. Core consumers can pass options directly to `new RepoSync()`.

`topics` is a compatibility shorthand for `filters.topics`. `filters.topicMatch` is `any` or `all`, topic matching is case-insensitive, and `minStars` is inclusive. `includeForks` and `includeArchived` are false by default. `excludeForks` and `excludeArchived` remain supported for backward compatibility.

`sortBy` accepts `updated`, `stars`, or `name`; `limit` is capped at 1000; `concurrency` is capped at 20 and defaults to 4. Aliases are arrays of heading names for technologies, features, and demos.

`output.format` accepts `json`, `ts`, `yaml`, or `markdown`, with JSON as the default. `quality.required` accepts any combination of `description`, `technologies`, `features`, `demoUrl`, and `image`; it controls the deterministic fields reported by `preview --quality`.

Demo URLs must be HTTP(S). Images may be HTTP(S) or relative paths. Executable schemes such as `javascript:` and `data:` are rejected. Tokens should be supplied through environment variables and are never written to generated projects.

Private discovery is opt-in. Set `includePrivate: true` and provide `token` or
`GITHUB_TOKEN`; configuration validation fails before any API request if the
token is missing. RepoSync uses GitHub's authenticated repository endpoint with
owner, collaborator, and organization-member affiliations. The token is not
stored in `Project` output. Only publish generated private metadata when the
destination and repository permissions are appropriate.
