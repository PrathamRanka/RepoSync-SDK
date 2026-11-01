import { resolveConfig } from "./config/config.js";
import { discoverRepositories } from "./github/repositories.js";
import { loadOverrides } from "./overrides/overrides.js";
import { parseReadme } from "./parser/readme-parser.js";
import { normalizeProject } from "./normalizer.js";
import type { Project, RepoSyncOptions } from "./types/index.js";

export class RepoSync {
  private readonly config;
  private readonly overridesInput: unknown;
  private readonly client;

  constructor(options: RepoSyncOptions) {
    const { overrides, client, ...config } = options;
    this.config = resolveConfig(config);
    this.overridesInput = overrides;
    this.client = client;
  }

  async discover(): Promise<Project[]> {
    const overrides = await loadOverrides(this.overridesInput);
    const repositories = await discoverRepositories(this.config, this.client);
    return repositories.map(({ repository, languages, readme }) => normalizeProject(
      repository,
      languages,
      parseReadme(readme, this.config.aliases),
      this.config.defaults,
      overrides[repository.full_name] ?? overrides[repository.name],
    )).sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
  }
}