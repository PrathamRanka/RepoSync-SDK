# @reposync/cli

The RepoSync command-line workflow for configuration, validation, discovery, diagnostics, quality reports, and deterministic output generation.

```bash
pnpm add -D @reposync/core @reposync/cli
pnpm exec reposync init
pnpm exec reposync validate
pnpm exec reposync preview --json --quality
pnpm exec reposync sync --format json
```

Commands are documented in [../../docs/cli.md](../../docs/cli.md). The CLI discovers `reposync.config.ts` or `reposync.config.json`, reads `reposync.overrides.json`, consumes only Core APIs, and never writes tokens to generated output.

## Development

```bash
pnpm install --frozen-lockfile
pnpm --filter @reposync/cli typecheck
pnpm --filter @reposync/cli test
pnpm --filter @reposync/cli build
```
