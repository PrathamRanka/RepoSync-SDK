import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Project } from "@reposync/core";

export type OutputFormat = "json" | "ts" | "yaml" | "markdown";

export function isOutputFormat(value: string | undefined): value is OutputFormat {
  return value === "json" || value === "ts" || value === "yaml" || value === "markdown";
}

function yamlValue(value: unknown, indent = 0): string {
  const prefix = " ".repeat(indent);
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        const rendered = yamlValue(item, indent + 2);
        return rendered.includes("\n") ? `${prefix}-\n${rendered}` : `${prefix}- ${rendered}`;
      })
      .join("\n");
  }
  return Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => {
      const rendered = yamlValue(item, indent + 2);
      return rendered.includes("\n")
        ? `${prefix}${key}:\n${rendered}`
        : `${prefix}${key}: ${rendered}`;
    })
    .join("\n");
}

function markdownValue(value: unknown): string {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

export function formatProjects(projects: Project[], format: OutputFormat): string {
  if (format === "json") return `${JSON.stringify(projects, null, 2)}\n`;
  if (format === "ts") {
    return `import type { Project } from "@reposync/core";\n\nexport const projects = ${JSON.stringify(projects, null, 2)} satisfies readonly Project[];\n\nexport default projects;\n`;
  }
  if (format === "yaml") return `${yamlValue(projects)}\n`;
  const rows = projects
    .map(
      (project) =>
        `| ${markdownValue(project.title)} | ${markdownValue(project.description)} | ${markdownValue(project.technologies.join(", "))} | ${markdownValue(project.demoUrl)} |`,
    )
    .join("\n");
  return `# Projects\n\n| Project | Description | Technologies | Demo |\n| --- | --- | --- | --- |\n${rows}\n`;
}

export async function writeProjects(
  file: string,
  projects: Project[],
  format: OutputFormat = "json",
): Promise<boolean> {
  const target = resolve(file);
  const data = formatProjects(projects, format);
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
