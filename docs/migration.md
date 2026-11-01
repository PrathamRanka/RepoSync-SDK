# Migration from 0.1.0

The Core constructor and stable `Project` shape remain compatible with the 0.1.0 contract.

## New in 1.0

- Add `@reposync/cli` for configuration-file discovery and JSON generation.
- Use `filters` for `topicMatch`, `includeForks`, `includeArchived`, and `minStars`.
- Use `aliases` for README heading conventions.
- Use `concurrency` to bound repository detail requests.
- Use `output` to configure CLI JSON generation.

The legacy `topics`, `excludeForks`, `excludeArchived`, `limit`, and `sortBy` options continue to work. Review generated URLs and README-relative image behavior before adopting automated output.

## 2.x and 2.0.1

The 2.x line preserves the stable Core `Project` shape and legacy constructor
options. The CLI adds deterministic multi-format output, quality analysis,
diagnostics, and incremental synchronization. Install matching package
versions and review [the compatibility policy](compatibility.md) before
upgrading. Patch releases such as 2.0.1 do not intentionally change public
APIs or output shape.
