import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Project } from "@reposync/core";

export async function writeProjects(file: string, projects: Project[]): Promise<boolean> {
  const target = resolve(file);
  const data = `${JSON.stringify(projects, null, 2)}\n`;
  try {
    const current = await import("node:fs/promises").then(({ readFile }) =>
      readFile(target, "utf8"),
    );
    if (current === data) return false;
  } catch {
    /* Missing output is handled by the atomic write below. */
  }
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, data, "utf8");
  await rename(temporary, target);
  return true;
}
