# Migration from 0.1.0

The Core constructor and stable `Project` shape remain compatible with the 0.1.0 contract.

## New in 1.0

- Add `@reposync/cli` for configuration-file discovery and JSON generation.
- Use `filters` for `topicMatch`, `includeForks`, `includeArchived`, and `minStars`.
- Use `aliases` for README heading conventions.
- Use `concurrency` to bound repository detail requests.
- Use `output` to configure CLI JSON generation.

The legacy `topics`, `excludeForks`, `excludeArchived`, `limit`, and `sortBy` options continue to work. Review generated URLs and README-relative image behavior before adopting automated output.
