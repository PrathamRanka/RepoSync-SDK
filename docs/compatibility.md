# Compatibility and maintenance policy

## Runtime support

RepoSync supports Node.js 24 and newer. The CI matrix currently verifies Node
24 on Ubuntu, Windows, and macOS. Do not assume older Node.js versions are
supported.

Repository development uses pnpm 11.20.0 as declared by `packageManager`.

## Package support

The current 2.x release line is the supported package line. Security fixes are
handled according to [SECURITY.md](../SECURITY.md). Older lines may continue
to install but are not guaranteed fixes or compatibility maintenance.

## Versioning and breaking changes

RepoSync follows semantic versioning. Patch releases contain compatible bug
fixes, documentation, and maintenance changes. Minor releases may add
backward-compatible APIs or CLI behavior. Major releases are required for
breaking public API, configuration, output-shape, or supported-runtime changes.

Breaking changes require migration documentation and explicit release notes.
Deprecations should remain documented for at least one minor release when
practical; no deprecation timeline is promised without a maintainer decision.

## Releases

There is no fixed release cadence or support SLA. Maintainers evaluate releases
when verified changes justify them. Releases are tag-driven through npm Trusted
Publishing; see [docs/release.md](release.md). Published npm versions and
their tags are immutable in normal recovery procedures.
