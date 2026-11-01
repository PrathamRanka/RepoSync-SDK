# CLI reference

## Commands

- `reposync init` creates starter configuration and overrides. Add `--workflow` for a manual workflow starter.
- `reposync validate` validates configuration and overrides without GitHub API calls.
- `reposync preview` discovers and prints normalized projects without writing files.
- `reposync list` prints name, full name, stars, and topics.
- `reposync sync` atomically writes the configured output. Use `--format json|ts|yaml|markdown` to override the configured format.
- `reposync doctor` reports Node.js version, discovered configuration, and token presence.

`reposync preview --quality` adds deterministic metadata findings to the preview response. Configure the checked fields with `quality.required`.

Common flags are `--config <path>`, `--format <format>`, `--quality`, `--json`, `--verbose`, `--quiet`, `--workflow`, and `--help`.
Exit codes are `0` for success, `1` for configuration/runtime failure, and `2` for invalid CLI usage. `--json` produces machine-readable command summaries. `--quiet` suppresses normal output and `--verbose` includes error causes where available.
