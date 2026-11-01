import { access, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { ConfigurationError } from "../errors.js";
import { loadOverrides } from "../overrides/overrides.js";
import { resolveConfig, type ResolvedRepoSyncConfig } from "./config.js";

export type LoadedConfig = {
  config: ResolvedRepoSyncConfig;
  configPath: string | null;
  overrides: Record<string, unknown>;
  overridesPath: string | null;
};

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function loadConfig(
  cwd = process.cwd(),
  explicitPath?: string,
): Promise<LoadedConfig> {
  const candidates = explicitPath
    ? [resolve(cwd, explicitPath)]
    : [resolve(cwd, "reposync.config.ts"), resolve(cwd, "reposync.config.json")];
  const configPath = candidates.find((candidate) => existsSync(candidate)) ?? null;
  if (!configPath)
    throw new ConfigurationError(
      `No RepoSync configuration found in ${cwd}. Create reposync.config.ts or reposync.config.json.`,
    );
  let input: unknown;
  try {
    input = configPath.endsWith(".json")
      ? JSON.parse(await readFile(configPath, "utf8"))
      : (await import(pathToFileURL(configPath).href)).default;
  } catch (error) {
    throw new ConfigurationError(
      `Unable to load configuration "${configPath}": ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
  const config = resolveConfig(input);
  const overrideCandidates = [resolve(cwd, "reposync.overrides.json")];
  const overridesPath =
    (
      await Promise.all(
        overrideCandidates.map(async (candidate) => ((await exists(candidate)) ? candidate : null)),
      )
    ).find(Boolean) ?? null;
  return {
    config,
    configPath,
    overridesPath,
    overrides: await loadOverrides(overridesPath ?? {}),
  };
}
