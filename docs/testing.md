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

The package validation flow also runs `pnpm pack` and installs the resulting tarballs into a clean external consumer. This catches export, declaration, CLI bin, and publish-time dependency errors.
