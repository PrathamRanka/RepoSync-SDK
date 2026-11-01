# Testing

Regular tests never call live GitHub APIs. Core tests inject a typed GitHub client; CLI tests use temporary directories and local files.

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level high
```

The Core live smoke test is skipped by default. To run it manually, set `REPOSYNC_LIVE_TEST=1`, `REPOSYNC_LIVE_USERNAME`, and an appropriate `GITHUB_TOKEN`. Do not run credentials in pull-request jobs.

The independent packed-package project at `E:\RepoSync-Integration` verifies
local tarball installation, ESM imports, CLI execution, configuration loading,
incremental fingerprints, and JSON/TypeScript/YAML/Markdown formatters without
network access:

```powershell
pnpm build
pnpm --filter @reposync/core pack --pack-destination E:\RepoSync-Integration\artifacts
pnpm --filter @reposync/cli pack --pack-destination E:\RepoSync-Integration\artifacts
Set-Location E:\RepoSync-Integration
pnpm install
pnpm run verify
```

GitHub-hosted workflow execution and authenticated API checks remain external
tests; the repository only validates generated workflow structure locally.
