# Roadmap

This roadmap records areas under consideration, not promises or committed
features. Changes must preserve the framework-independent Core and the
validated CLI architecture.

## Completed

- Paginated GitHub discovery with filtering, sorting, limits, and bounded
  concurrency.
- Deterministic Remark README extraction with aliases and safe URLs.
- Defaults, per-repository overrides, quality analysis, diagnostics, and
  incremental state.
- JSON, TypeScript, YAML, and Markdown output.
- Cross-platform CI, package validation, packed-consumer checks, and npm OIDC
  publishing.

## Planned

- Improve release and documentation validation without adding runtime
  dependencies.
- Expand deterministic fixtures for new GitHub API and Markdown edge cases.
- Keep consumer smoke tests representative of published package usage.

## Under consideration

- ETag or conditional requests, only after additions, renames, deletions, and
  README changes remain correct.
- Rate-limit-aware scheduling and metadata caching, with explicit invalidation
  rules.
- Configurable metadata validation rules and additional output formats where a
  real consumer need is demonstrated.
- Organization discovery, GitHub App authentication, monorepo discovery, and
  a dedicated GitHub Action.
- A documentation website or reusable workflow templates.

These items are deliberately deferred because they add API surface,
credential complexity, cache invalidation, or maintenance cost without a
current requirement.
