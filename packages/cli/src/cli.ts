import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig, RepoSync } from "@reposync/core";
import { writeProjects } from "./output.js";

type CliOptions = {
  command: string;
  config?: string;
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  workflow: boolean;
};

export function parseArgs(argv: string[]): CliOptions {
  const [command = "help", ...rest] = argv;
  const value = (flag: string) => {
    const index = rest.indexOf(flag);
    return index >= 0 ? rest[index + 1] : undefined;
  };
  return {
    command,
    config: value("--config"),
    json: rest.includes("--json"),
    quiet: rest.includes("--quiet"),
    verbose: rest.includes("--verbose"),
    workflow: rest.includes("--workflow"),
  };
}

function print(value: unknown, options: CliOptions): void {
  if (!options.quiet) {
    const text = options.json
      ? JSON.stringify(value, null, 2)
      : typeof value === "string"
        ? value
        : JSON.stringify(value, null, 2);
    process.stdout.write(`${text}\n`);
  }
}

function help(): string {
  return `RepoSync ${process.env.npm_package_version ?? "1.0.0"}

Usage: reposync <command> [options]

Commands:
  init       Create starter configuration and overrides
  preview    Discover and print projects without writing output
  sync       Discover and atomically write projects.json
  validate   Validate configuration and overrides
  list       List discovered repositories
  doctor     Check runtime and configuration health

Options:
  --config <path>  Configuration file path
  --json           Print machine-readable output
  --verbose        Print diagnostic details
  --quiet          Suppress normal output
  --workflow       Add a GitHub Actions workflow during init
  --help           Show this help
`;
}

async function load(options: CliOptions, cwd: string) {
  const loaded = await loadConfig(cwd, options.config);
  const reposync = new RepoSync({ ...loaded.config, overrides: loaded.overrides });
  return { ...loaded, reposync };
}

export async function runCli(argv: string[], cwd = process.cwd()): Promise<number> {
  const options = parseArgs(argv);
  try {
    if (argv.includes("--help") || options.command === "help") {
      print(help(), options);
      return 0;
    }
    if (options.command === "init") {
      const configPath = resolve(cwd, "reposync.config.json");
      const overridesPath = resolve(cwd, "reposync.overrides.json");
      try {
        await access(configPath);
      } catch {
        await writeFile(
          configPath,
          `${JSON.stringify({ username: "your-github-username", topics: ["portfolio"] }, null, 2)}\n`,
        );
      }
      try {
        await access(overridesPath);
      } catch {
        await writeFile(overridesPath, "{}\n");
      }
      let workflowPath: string | null = null;
      if (options.workflow) {
        workflowPath = resolve(cwd, ".github", "workflows", "reposync.yml");
        await mkdir(resolve(cwd, ".github", "workflows"), { recursive: true });
        await writeFile(
          workflowPath,
          `name: RepoSync
on:
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: npx reposync sync
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`,
        );
      }
      print({ configPath, overridesPath, workflowPath }, options);
      return 0;
    }
    if (options.command === "validate") {
      const loaded = await loadConfig(cwd, options.config);
      print(
        { valid: true, configPath: loaded.configPath, overridesPath: loaded.overridesPath },
        options,
      );
      return 0;
    }
    if (options.command === "doctor") {
      const loaded = await loadConfig(cwd, options.config);
      print(
        {
          node: process.version,
          configPath: loaded.configPath,
          authenticated: Boolean(loaded.config.token),
        },
        options,
      );
      return 0;
    }
    const loaded = await load({ ...options }, cwd);
    const projects = await loaded.reposync.discover();
    if (options.command === "preview") {
      print(projects, options);
      return 0;
    }
    if (options.command === "list") {
      print(
        projects.map((project) => ({
          name: project.name,
          fullName: project.fullName,
          stars: project.stars,
          topics: project.topics,
        })),
        options,
      );
      return 0;
    }
    if (options.command === "sync") {
      const output = await writeProjects(resolve(cwd, loaded.config.output.file), projects);
      print(
        { count: projects.length, changed: output, file: resolve(cwd, loaded.config.output.file) },
        options,
      );
      return 0;
    }
    process.stderr.write(`Unknown command "${options.command}". Use reposync --help.\n`);
    return 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.verbose && error instanceof Error && error.cause)
      process.stderr.write(`${String(error.cause)}\n`);
    process.stderr.write(`${message}\n`);
    return 1;
  }
}
