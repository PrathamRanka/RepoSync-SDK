# Release guide

RepoSync publishes `@reposync/core` and `@reposync/cli` from
`.github/workflows/publish.yml`. Publishing is tag-driven and uses npm Trusted
Publishing through GitHub Actions OIDC.

## One-time npm configuration

Configure an npm trusted publisher for each package:

- Organization/user: `PrathamRanka`
- Repository: `RepoSync-SDK`
- Workflow filename: `publish.yml`
- Environment: leave blank

Leave the **Environment** field blank in both npm Trusted Publisher
configurations. The workflow does not use a GitHub environment. It requires
`contents: read` and `id-token: write`. Do not add `NPM_TOKEN`,
`NODE_AUTH_TOKEN`, or other npm credentials. Node 24 and npm 11.5.1+ are
installed by the workflow.

## Preparing a release

1. Update both publishable package versions to the same semver version.
2. Set the CLI dependency to `workspace:<core-version>`.
3. Update `packages/core/src/index.ts` if the exported SDK version changes.
4. Update `CHANGELOG.md` and the package READMEs.
5. Run the complete verification commands from [the testing guide](testing.md).
6. Merge the changes to `main`.
7. Create and push a new tag only after review:

   ```bash
   git tag v2.0.0
   git push origin v2.0.0
   ```

The tag must point at the reviewed commit and match both package versions.
Do not move an existing tag. If the desired version tag already exists at an
older commit, stop and resolve that release-history conflict with the
repository owner before publishing.

## Workflow safeguards

The workflow:

- validates tag/package/Core dependency versions;
- installs with `pnpm install --frozen-lockfile`;
- runs formatting, lint, typecheck, tests, build, package validation, and audit;
- packs both packages and checks their manifests;
- publishes Core before CLI;
- uses npm `--provenance` and OIDC;
- relies on npm's immutable versions, so a duplicate publication fails rather
  than overwriting an existing version.

The old manual token-based release path is intentionally verification-only.

## First 2.0.0 release

The repository currently contains a `v2.0.0` tag that predates the final
release metadata. Because tags must not be moved or overwritten, do not push
that tag again. First reconcile the existing tag with the repository owner and
npm trusted-publisher configuration. Once an approved release tag points to the
reviewed `2.0.0` commit, pushing that new tag starts the workflow.

Monitor the workflow and npm package pages. Core must publish successfully
before the CLI step runs. No package is published by local development
commands.
