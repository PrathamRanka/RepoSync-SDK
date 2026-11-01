// Public RepoSync API.
export { RepoSync } from "./reposync.js";
export { defineConfig, resolveConfig } from "./config/config.js";
export { loadConfig } from "./config/loader.js";
export type { LoadedConfig } from "./config/loader.js";
export { parseReadme } from "./parser/readme-parser.js";
export { normalizeProject } from "./normalizer.js";
export { discoverRepositories, repositoryMatches } from "./github/repositories.js";
export { loadOverrides } from "./overrides/overrides.js";
export * from "./types/index.js";
export * from "./errors.js";
export const reposyncVersion = "0.1.0";
