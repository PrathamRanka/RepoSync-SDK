# Metadata quality

RepoSync exposes `analyzeProjectQuality(project, requiredFields)` and
`analyzeProjectsQuality(projects, requiredFields)` from `@reposync/core`.

Each report contains:

- `score`: the percentage of configured fields that are present.
- `checkedFields`: the de-duplicated fields that were checked.
- `findings`: missing fields, severity, explanation, and a concrete suggestion.

Supported fields are `description`, `technologies`, `features`, `demoUrl`, and
`image`. The analysis is deterministic and local. It does not call an AI
service, fabricate metadata, or mutate projects.

The CLI includes the same reports with:

```bash
reposync preview --quality --json
```

Configure the required fields in `reposync.config.ts`:

```ts
quality: {
  required: ["description", "technologies", "features", "demoUrl"],
}
```

Quality scoring is intentionally simple: each configured field has equal
weight. It is an editorial completeness signal, not a measure of code quality,
security, popularity, or user experience.
