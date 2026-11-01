import { createHash } from "node:crypto";
import { mkdir, open, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { ConfigurationError } from "./errors.js";
import type { Project } from "./types/index.js";

export const SYNC_STATE_VERSION = 1;

const stateSchema = z.object({
  version: z.literal(SYNC_STATE_VERSION),
  synchronizedAt: z.string().datetime(),
  projects: z.record(
    z.string().min(1),
    z.object({
      name: z.string().min(1),
      fullName: z.string().min(1),
      fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
});

export type SyncState = z.infer<typeof stateSchema>;
export type SyncChanges = {
  added: string[];
  updated: string[];
  unchanged: string[];
  removed: string[];
};

export function fingerprintProject(project: Project): string {
  return createHash("sha256").update(JSON.stringify(project)).digest("hex");
}

export function createSyncState(projects: Project[], synchronizedAt = new Date()): SyncState {
  const entries = Object.fromEntries(
    projects.map((project) => [
      project.fullName,
      {
        name: project.name,
        fullName: project.fullName,
        fingerprint: fingerprintProject(project),
      },
    ]),
  );
  return {
    version: SYNC_STATE_VERSION,
    synchronizedAt: synchronizedAt.toISOString(),
    projects: entries,
  };
}

export function diffSyncState(previous: SyncState | null, projects: Project[]): SyncChanges {
  const current = createSyncState(projects);
  const previousProjects = previous?.projects ?? {};
  const added: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
  for (const [fullName, entry] of Object.entries(current.projects)) {
    const old = previousProjects[fullName];
    if (!old) added.push(fullName);
    else if (old.fingerprint === entry.fingerprint) unchanged.push(fullName);
    else updated.push(fullName);
  }
  const removed = Object.keys(previousProjects).filter((fullName) => !current.projects[fullName]);
  return {
    added: added.sort(),
    updated: updated.sort(),
    unchanged: unchanged.sort(),
    removed: removed.sort(),
  };
}

export async function readSyncState(file: string): Promise<SyncState | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(resolve(file), "utf8"));
    const result = stateSchema.safeParse(parsed);
    if (!result.success) {
      throw new ConfigurationError(`Invalid RepoSync state: ${result.error.message}`);
    }
    return result.data;
  } catch (error) {
    if (error instanceof ConfigurationError) throw error;
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new ConfigurationError(
      `Unable to read RepoSync state "${file}": ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

export async function writeSyncState(file: string, state: SyncState): Promise<boolean> {
  const target = resolve(file);
  const data = `${JSON.stringify(state, null, 2)}\n`;
  try {
    if ((await readFile(target, "utf8")) === data) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, data, "utf8");
  await rename(temporary, target);
  return true;
}

export async function withSyncLock<T>(file: string, operation: () => Promise<T>): Promise<T> {
  const lockFile = `${resolve(file)}.lock`;
  await mkdir(dirname(lockFile), { recursive: true });
  let handle;
  try {
    handle = await open(lockFile, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new ConfigurationError(`RepoSync synchronization is already running: ${lockFile}`);
    }
    throw error;
  }
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(lockFile).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
