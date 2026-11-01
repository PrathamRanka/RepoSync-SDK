import { z } from "zod";
import { ConfigurationError } from "../errors.js";

const projectDefaultsSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    technologies: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    image: z
      .string()
      .min(1)
      .refine(isSafeAssetUrl, "must be an HTTP(S) or relative URL")
      .optional(),
    images: z
      .array(z.string().min(1).refine(isSafeAssetUrl, "must be an HTTP(S) or relative URL"))
      .optional(),
    demoUrl: z.string().min(1).refine(isSafeHttpUrl, "must be an HTTP(S) URL").optional(),
    featured: z.boolean().optional(),
    order: z.number().int().optional(),
  })
  .strict();

const aliasesSchema = z
  .object({
    technologies: z
      .array(z.string().trim().min(1))
      .default(["technologies", "technology", "tech stack", "built with"]),
    features: z.array(z.string().trim().min(1)).default(["features", "key features"]),
    demos: z.array(z.string().trim().min(1)).default(["demo", "live demo", "live", "website"]),
  })
  .strict();

const filtersSchema = z
  .object({
    topics: z.array(z.string().trim().min(1)).optional(),
    topicMatch: z.enum(["any", "all"]).default("any"),
    includeForks: z.boolean().default(false),
    includeArchived: z.boolean().default(false),
    minStars: z.number().int().nonnegative().default(0),
  })
  .strict();

const configSchema = z
  .object({
    username: z.string().trim().min(1),
    topics: z.array(z.string().trim().min(1)).default([]),
    token: z.string().optional(),
    includePrivate: z.boolean().default(false),
    excludeForks: z.boolean().default(true),
    excludeArchived: z.boolean().default(true),
    limit: z.number().int().positive().max(1000).default(100),
    sortBy: z.enum(["updated", "stars", "name"]).default("updated"),
    defaults: projectDefaultsSchema.default({}),
    aliases: aliasesSchema.default({
      technologies: ["technologies", "technology", "tech stack", "built with"],
      features: ["features", "key features"],
      demos: ["demo", "live demo", "live", "website"],
    }),
    concurrency: z.number().int().positive().max(20).default(4),
    output: z
      .object({
        file: z.string().min(1).default("projects.json"),
        format: z.enum(["json", "ts", "yaml", "markdown"]).default("json"),
      })
      .strict()
      .default({ file: "projects.json", format: "json" }),
    quality: z
      .object({
        required: z
          .array(z.enum(["description", "technologies", "features", "demoUrl", "image"]))
          .default(["description", "technologies"]),
      })
      .strict()
      .default({ required: ["description", "technologies"] }),
    sync: z
      .object({
        stateFile: z.string().min(1).default(".reposync/state.json"),
        mode: z.enum(["incremental", "full"]).default("incremental"),
      })
      .strict()
      .default({ stateFile: ".reposync/state.json", mode: "incremental" }),
    filters: filtersSchema.default({
      topicMatch: "any",
      includeForks: false,
      includeArchived: false,
      minStars: 0,
    }),
  })
  .strict();

export type RepoSyncConfigInput = z.input<typeof configSchema>;
export type ResolvedRepoSyncConfig = z.output<typeof configSchema> & {
  aliases: z.output<typeof aliasesSchema>;
  filters: z.output<typeof filtersSchema>;
};
export { configSchema };

function isSafeHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function isSafeAssetUrl(value: string): boolean {
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) return true;
  return isSafeHttpUrl(value);
}

export function resolveConfig(input: unknown): ResolvedRepoSyncConfig {
  const candidate = input && typeof input === "object" ? (input as Record<string, unknown>) : input;
  const normalized =
    candidate && typeof candidate === "object" && "github" in candidate
      ? {
          ...(candidate.github as Record<string, unknown>),
          topics: (
            (candidate as Record<string, unknown>).discovery as Record<string, unknown> | undefined
          )?.topic
            ? [((candidate as Record<string, unknown>).discovery as Record<string, unknown>).topic]
            : undefined,
          filters: {
            includeForks: (
              (candidate as Record<string, unknown>).discovery as
                Record<string, unknown> | undefined
            )?.includeForks,
            includeArchived: (
              (candidate as Record<string, unknown>).discovery as
                Record<string, unknown> | undefined
            )?.includeArchived,
          },
          aliases: (candidate as Record<string, unknown>).aliases,
        }
      : candidate;
  const source =
    normalized && typeof normalized === "object"
      ? {
          ...normalized,
          topics:
            (normalized as Record<string, unknown>).topics ??
            ((normalized as Record<string, unknown>).topic
              ? [(normalized as Record<string, unknown>).topic]
              : undefined),
          excludeForks: (normalized as Record<string, unknown>).excludeForks,
          excludeArchived: (normalized as Record<string, unknown>).excludeArchived,
          filters: (() => {
            const filters =
              ((normalized as Record<string, unknown>).filters as
                Record<string, unknown> | undefined) ?? {};
            return {
              ...filters,
              ...(filters.includeForks === undefined &&
              typeof (normalized as Record<string, unknown>).excludeForks === "boolean"
                ? { includeForks: !(normalized as Record<string, unknown>).excludeForks }
                : {}),
              ...(filters.includeArchived === undefined &&
              typeof (normalized as Record<string, unknown>).excludeArchived === "boolean"
                ? { includeArchived: !(normalized as Record<string, unknown>).excludeArchived }
                : {}),
            };
          })(),
        }
      : normalized;
  const result = configSchema.safeParse(source);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return `${path || "config"}: ${issue.message}`;
      })
      .join("; ");

    throw new ConfigurationError(`Invalid RepoSync configuration: ${details}`);
  }

  const data = result.data;
  const token = data.token ?? process.env.GITHUB_TOKEN;
  if (data.includePrivate && !token) {
    throw new ConfigurationError(
      "Private repository discovery requires a GitHub token via token or GITHUB_TOKEN.",
    );
  }
  return {
    ...data,
    token,
    aliases: data.aliases,
    filters: {
      ...data.filters,
      topics: data.filters?.topics ?? data.topics,
      includeForks: data.filters?.includeForks ?? !data.excludeForks,
      includeArchived: data.filters?.includeArchived ?? !data.excludeArchived,
    },
  };
}

export function defineConfig(input: RepoSyncConfigInput): RepoSyncConfigInput {
  resolveConfig(input);
  return input;
}
