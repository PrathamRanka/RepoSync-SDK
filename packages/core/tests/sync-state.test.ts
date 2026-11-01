import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  createSyncState,
  diffSyncState,
  readSyncState,
  withSyncLock,
  writeSyncState,
} from "../src/index.js";
import type { Project } from "../src/types/index.js";

const project = (name: string, description = name): Project => ({
  name,
  title: name,
  fullName: `octocat/${name}`,
  description,
  githubDescription: description,
  url: `https://github.com/octocat/${name}`,
  homepage: null,
  demoUrl: null,
  imageUrls: [],
  tags: [],
  topics: [],
  technologies: [],
  features: [],
  introduction: null,
  languages: {},
  stars: 0,
  forks: 0,
  featured: false,
  order: null,
  updatedAt: "2026-01-01",
});

describe("sync state", () => {
  it("classifies additions, updates, unchanged projects, and removals", () => {
    const previous = createSyncState([project("same"), project("changed"), project("removed")]);
    expect(
      diffSyncState(previous, [project("same"), project("changed", "new"), project("added")]),
    ).toEqual({
      added: ["octocat/added"],
      updated: ["octocat/changed"],
      unchanged: ["octocat/same"],
      removed: ["octocat/removed"],
    });
  });

  it("writes atomically and does not rewrite identical state", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-state-"));
    const file = join(cwd, "nested", "state.json");
    const state = createSyncState([project("demo")]);
    expect(await writeSyncState(file, state)).toBe(true);
    expect(await writeSyncState(file, state)).toBe(false);
    expect(await readSyncState(file)).toEqual(state);
    expect(await readFile(file, "utf8")).toContain('"version": 1');
  });

  it("prevents concurrent operations with a lock", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-state-"));
    const file = join(cwd, "state.json");
    await expect(
      withSyncLock(file, async () => withSyncLock(file, async () => "never")),
    ).rejects.toThrow(/already running/);
  });

  it("recovers a stale lock left by an interrupted process", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-state-"));
    const file = join(cwd, "state.json");
    const lockFile = `${file}.lock`;
    await writeFile(lockFile, "stale");
    const old = new Date(Date.now() - 31 * 60 * 1000);
    await utimes(lockFile, old, old);
    await expect(withSyncLock(file, async () => "recovered")).resolves.toBe("recovered");
  });

  it("rejects corrupted and unsupported state versions", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "reposync-state-"));
    const file = join(cwd, "state.json");
    await writeFile(file, "{not-json");
    await expect(readSyncState(file)).rejects.toThrow(/Unable to read RepoSync state/);
    await writeFile(file, JSON.stringify({ version: 99 }));
    await expect(readSyncState(file)).rejects.toThrow(/Invalid RepoSync state/);
  });
});
