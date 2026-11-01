# Security policy

## Supported versions

The `main` branch and the latest published v1 release receive security fixes.

## Reporting

Do not open a public issue for a vulnerability. Use [GitHub private vulnerability reporting](https://github.com/PrathamRanka/RepoSync-SDK/security/advisories/new) when available. Include reproduction steps, impact, affected package/version, and a suggested mitigation.

## Security practices

- Never commit `GITHUB_TOKEN`, `.env` files, or credentials.
- Keep tokens server-side and out of generated JSON.
- CI permissions are read-only unless a job explicitly requires otherwise.
- Unsafe Markdown URL schemes are rejected.
- Review dependencies with `pnpm audit`.
