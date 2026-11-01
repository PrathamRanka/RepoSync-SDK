import { z } from "zod";
import { ConfigurationError } from "../errors.js";

const projectDefaultsSchema = z
  .object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.url().optional(),
    images: z.array(z.url()).optional(),
    demoUrl: z.url().optional(),
    featured: z.boolean().optional(),
  })
  .strict();

const configSchema = z
  .object({
    username: z.string().trim().min(1),
    topics: z.array(z.string().trim().min(1)).default([]),
    token: z.string().optional(),
    excludeForks: z.boolean().default(true),
    excludeArchived: z.boolean().default(true),
    limit: z.number().int().positive().max(1000).default(100),
    sortBy: z.enum(["updated", "stars", "name"]).default("updated"),
    defaults: projectDefaultsSchema.default({}),
  })
  .strict();

export type RepoSyncConfigInput = z.input<typeof configSchema>;
export type ResolvedRepoSyncConfig = z.output<typeof configSchema>;

export function resolveConfig(input: unknown): ResolvedRepoSyncConfig {
  const result = configSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => {
        const path = issue.path.join(".");
        return `${path || "config"}: ${issue.message}`;
      })
      .join("; ");

    throw new ConfigurationError(
      `Invalid RepoSync configuration: ${details}`,
    );
  }

  return {
    ...result.data,
    token: result.data.token ?? process.env.GITHUB_TOKEN,
  };
}