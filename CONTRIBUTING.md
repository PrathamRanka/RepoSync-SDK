# Contributing

Thank you for improving RepoSync. Open an issue before large behavioral changes so the API and documentation can be discussed.

## Development setup

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Node.js 24 and pnpm 11 are required. Do not commit `node_modules`, `dist`, `.env` files, tokens, or generated temporary files.

Preserve the Core public contract, add tests for success and failure paths, use Zod for external input validation, use existing errors, keep CLI logic on Core APIs, keep output deterministic, and update relevant documentation.

Use descriptive branches such as `feat/config-loader` or `fix/readme-links`. Use Conventional Commit messages such as `feat(core): add config loader` and `fix(cli): preserve atomic output`.

Pull requests should explain the user-visible change, compatibility impact, tests run, and documentation updates. CI must pass before review.

## Adding functionality

Core changes must remain framework-independent and use injected clients for
network tests. Add or update the public type and error contract before wiring
CLI behavior. New formatters belong in `packages/cli/src/output.ts`, must be
deterministic, preserve the normalized `Project` shape, and need escaping and
unchanged-file tests. New framework examples belong under `examples/`, consume
generated data rather than copying Core internals, and must document how tokens
stay server-side.

For synchronization changes, test successful, repeated, failed, corrupted
state, lock cleanup, and recovery paths. For parser changes, add realistic
Markdown fixtures and unsafe-input cases. Run the independent packed consumer
when package exports, dependencies, or the CLI executable change.

Only maintainers may release. Update package versions, `CHANGELOG.md`, and lockfiles together. The release workflow is manual, requires explicit publish input and environment approval, and must never publish unreviewed changes.
