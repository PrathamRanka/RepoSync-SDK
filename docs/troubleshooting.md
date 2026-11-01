# Troubleshooting

## Configuration fails before discovery

Run:

```bash
pnpm exec reposync validate --json
```

Unknown properties, invalid URLs, unsupported output formats, and missing
private-repository tokens are configuration errors. Check the exact file
selected with `--config`; the CLI otherwise prefers `reposync.config.ts` over
`reposync.config.json`.

## Private repositories are missing

Set `includePrivate: true` and provide `token` or `GITHUB_TOKEN`. The token
must have access to the repositories. Public discovery does not require a
token, but GitHub rate limits can be lower.

## Preview or sync fails during GitHub access

Run `pnpm exec reposync doctor --network --json` to distinguish connectivity,
authentication, permission, and rate-limit failures. Check the exported Core
error type before retrying. RepoSync does not return partial discovery results
after a failure.

## Projects have missing metadata

README extraction is deterministic and depends on headings and aliases. Check
the README sections, configure `aliases`, and use
`reposync preview --quality --json` to see missing configured fields. Metadata
precedence is `override > defaults > README > GitHub`.

## Sync is blocked by a lock

A live `.reposync/state.json.lock` indicates another synchronization. Stop the
other process and retry. Locks older than the built-in stale threshold are
recovered automatically. Do not delete an active lock while another sync is
running.

## State is corrupt or output is stale

State writes and output writes are atomic. A corrupt or unsupported state file
fails clearly; use `reposync sync --full` to bypass prior state after reviewing
the file. Generated output is not rewritten when its content is unchanged.

## Package or CLI installation fails

Use Node.js 24+, install with the package manager shown in the package README,
and verify the package version. For local tarballs, ensure the packed Core
tarball is available to the CLI dependency or use the documented packed
consumer override. Do not expect an unpublished version to resolve from npm.

## Reporting a new problem

Search existing issues, then use the appropriate issue form. Remove tokens,
private repository names, and sensitive logs. Report vulnerabilities through
the private process in [SECURITY.md](../SECURITY.md).
