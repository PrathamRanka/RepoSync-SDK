# API reference

## `RepoSync`

```ts
new RepoSync(options: RepoSyncOptions)
discover(): Promise<Project[]>
```

`discover()` performs the complete Core pipeline and rejects on any repository-processing failure.

## Public helpers

- `defineConfig(input)` validates and returns a TypeScript configuration input.
- `resolveConfig(input)` returns resolved defaults.
- `loadConfig(cwd?, explicitPath?)` discovers and loads a configuration plus overrides.
- `parseReadme(markdown, aliases)` extracts README metadata.
- `normalizeProject(repository, languages, readme, defaults, override?)` creates a stable `Project`.
- `discoverRepositories(config, client?)` performs GitHub discovery.
- `repositoryMatches(repository, config)` evaluates repository filters.
- `loadOverrides(input)` validates an object or JSON file path.
- `writeProjects(path, projects)` atomically writes deterministic JSON in the CLI package.

All Core types and error classes are exported from `@reposync/core`.
