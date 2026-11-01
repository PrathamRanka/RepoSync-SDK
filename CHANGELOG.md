# Changelog

All notable changes are documented here.

## [2.0.1] - Unreleased

### Changed

- Prepared the first public RepoSync 2.0.1 npm release with matching Core and
  CLI package metadata, documentation, and trusted publishing validation.

## [2.0.0] - Unreleased

### Added

- Production-ready Core discovery and normalization with README parsing, filters, aliases, defaults, overrides, quality analysis, diagnostics, and incremental state.
- CLI commands for initialization, validation, preview, listing, synchronization, and diagnostics.
- JSON, TypeScript, YAML, and Markdown output formats.
- Cross-platform CI, npm Trusted Publishing workflow, package validation, and framework examples.
- Octokit discovery with pagination, filtering, sorting, limits, and bounded concurrency.
- Remark README extraction with aliases and safe links/images.
- Zod-validated configuration, defaults, JSON overrides, and deterministic precedence.
- `@reposync/cli` with `init`, `validate`, `preview`, `list`, `sync`, and `doctor`.
- Atomic JSON output and optional workflow bootstrap.
- Workspace CI, release safeguards, documentation, and contributor policies.

### Compatibility

- Existing Core `Project` output and constructor options remain supported.
- Legacy `excludeForks` and `excludeArchived` options remain supported.

## [0.1.0]

Initial Core release.
