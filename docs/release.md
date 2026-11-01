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
7. Create and push a new tag only after review. For this release:

   ```bash
   git tag v2.0.1
   git push origin v2.0.1
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

There is no local publish command in the repository. The old manual token-based
release path is intentionally verification-only.

## Monitoring and recovery

Monitor the tag workflow and both npm package pages. npm Core must publish
successfully before the CLI step runs. If Core publishes but CLI fails, do not
rerun the same tag workflow blindly: inspect the failed step, correct the
problem in a new commit, and use a new patch version and tag. npm versions are
immutable, so a failed CLI publication cannot be repaired by overwriting the
same version.

If a workflow fails before either package publishes, fix the cause and rerun
the workflow for the same tag only after confirming that npm has no version
for that tag. If one package has already published, treat the release as
partially complete, publish the missing package only through a reviewed
follow-up release process, and do not delete or move tags. Rollback means
releasing a corrected newer version; published npm artifacts cannot be
withdrawn by rewriting Git history.

After publication, verify provenance on the npm package page or with npm's
package metadata and provenance display. The workflow uses `--provenance`;
provenance visibility also depends on npm and GitHub availability.

## First 2.0.1 release

The repository contains an existing `v2.0.0` tag. Preserve it completely; do
not move, delete, recreate, or push it again. The first public release from the
current metadata is `v2.0.1`. After reviewing and merging the `2.0.1` changes,
create and push only the new tag:

```bash
git tag v2.0.1
git push origin v2.0.1
```

The new tag must point to the reviewed `2.0.1` commit and match both package
versions.

No package is published by local development commands. Future patch releases
follow the same process with a new version such as `2.0.2`; never reuse an
existing npm version or move an existing release tag.
