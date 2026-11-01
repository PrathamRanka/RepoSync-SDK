import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  analyzeProjectsQuality,
  createSyncState,
  diagnoseGitHub,
  diffSyncState,
  loadConfig,
  readSyncState,
  RepoSync,
  withSyncLock,
  writeSyncState,
} from "@reposync/core";
import { isOutputFormat, writeProjects, type OutputFormat } from "./output.js";

type CliOptions = {
  command: string;
  config?: string;
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  workflow: boolean;
  format?: OutputFormat;
  quality: boolean;
  full: boolean;
  network: boolean;
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
    format: value("--format") as OutputFormat | undefined,
    quality: rest.includes("--quality"),
    full: rest.includes("--full"),
    network: rest.includes("--network"),
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
  --format <format> Output format: json, ts, yaml, or markdown
  --quality         Include deterministic metadata quality findings in preview
  --full            Ignore incremental state and perform a full synchronization
  --network         Run opt-in GitHub connectivity and authentication checks
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
  schedule:
    - cron: "0 6 * * *"
permissions:
  contents: write
concurrency:
  group: reposync
  cancel-in-progress: false
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx @reposync/cli sync
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
      - name: Commit generated output
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add projects.json
          git diff --cached --quiet || git commit -m "chore: sync project metadata"
          git push
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
      const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
      const outputDirectory = dirname(resolve(cwd, loaded.config.output.file));
      const stateFile = resolve(cwd, loaded.config.sync.stateFile);
      let outputWritable = true;
      try {
        await access(outputDirectory, constants.W_OK);
      } catch {
        try {
          await access(dirname(outputDirectory), constants.W_OK);
        } catch {
          outputWritable = false;
        }
      }
      const checks: Record<
        string,
        { ok: boolean; value: string | boolean | null; warning?: boolean }
      > = {
        node: { ok: major >= 24, value: process.version },
        configuration: { ok: true, value: loaded.configPath },
        overrides: { ok: true, value: loaded.overridesPath },
        token: {
          ok: true,
          warning: !loaded.config.token,
          value: Boolean(loaded.config.token),
        },
        outputDirectory: { ok: outputWritable, value: outputDirectory },
      };
      try {
        await readSyncState(stateFile);
        checks.state = { ok: true, value: stateFile };
      } catch (error) {
        checks.state = {
          ok: false,
          value: error instanceof Error ? error.message : String(error),
        };
      }
      const networkChecks = options.network
        ? await diagnoseGitHub(loaded.config)
        : {
            connectivity: {
              status: "skipped" as const,
              message: "Use --network to check GitHub connectivity.",
            },
          };
      const networkOk = Object.values(networkChecks).every((check) => check.status !== "failed");
      print(
        {
          checks,
          network: networkChecks,
          ok: Object.values(checks).every((check) => check.ok) && networkOk,
        },
        options,
      );
      return Object.values(checks).every((check) => check.ok) && networkOk ? 0 : 1;
    }
    const loaded = await load({ ...options }, cwd);
    if (options.command === "preview") {
      const projects = await loaded.reposync.discover();
      print(
        options.quality
          ? {
              projects,
              quality: analyzeProjectsQuality(projects, loaded.config.quality.required),
            }
          : projects,
        options,
      );
      return 0;
    }
    if (options.command === "list") {
      const projects = await loaded.reposync.discover();
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
      if (options.format && !isOutputFormat(options.format)) {
        throw new Error(`Unsupported output format "${options.format}".`);
      }
      const format = options.format ?? loaded.config.output.format;
      const stateFile = resolve(cwd, loaded.config.sync.stateFile);
      const result = await withSyncLock(stateFile, async () => {
        const projects = await loaded.reposync.discover();
        const previous =
          options.full || loaded.config.sync.mode === "full"
            ? null
            : await readSyncState(stateFile);
        const output = await writeProjects(
          resolve(cwd, loaded.config.output.file),
          projects,
          format,
        );
        const changes = diffSyncState(previous, projects);
        const stateChanged = await writeSyncState(stateFile, createSyncState(projects));
        return { output, changes, stateChanged };
      });
      print(
        {
          count:
            result.changes.added.length +
            result.changes.updated.length +
            result.changes.unchanged.length,
          changed: result.output,
          stateChanged: result.stateChanged,
          file: resolve(cwd, loaded.config.output.file),
          stateFile,
          changes: result.changes,
        },
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
