# Security policy

## Supported versions

Security fixes are applied to the current `main` branch and the latest
published 2.x release line. Older release lines are not guaranteed security
support; upgrade before reporting a vulnerability when possible. This policy
does not promise a response or fix time.

## Reporting

Do not open a public issue for a vulnerability. Use [GitHub private vulnerability reporting](https://github.com/PrathamRanka/RepoSync-SDK/security/advisories/new) when available. If private reporting is not enabled, contact the repository maintainers through the private channel shown in the repository's Security tab; do not disclose the issue publicly. Include reproduction steps, impact, affected package/version, and a suggested mitigation.

## Security practices

- Never commit `GITHUB_TOKEN`, `.env` files, or credentials.
- Keep tokens server-side and out of generated JSON.
- CI permissions are read-only unless a job explicitly requires otherwise.
- Unsafe Markdown URL schemes are rejected.
- Review dependencies with `pnpm audit`.
- Publishing uses GitHub Actions OIDC and npm provenance; no long-lived npm
  publishing token is stored in the repository.
