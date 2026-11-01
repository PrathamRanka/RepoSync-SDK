import { readFile } from "node:fs/promises";
import { z } from "zod";
import { ConfigurationError } from "../errors.js";
import type { ProjectOverride } from "../types/index.js";

const overrideSchema = z.object({
  title: z.string().optional(), description: z.string().optional(), tags: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(), features: z.array(z.string()).optional(),
  image: z.string().optional(), images: z.array(z.string()).optional(), demoUrl: z.string().optional(),
  featured: z.boolean().optional(), order: z.number().int().optional(),
}).strict();
const overridesSchema = z.record(z.string().min(1), overrideSchema);

export async function loadOverrides(input: unknown): Promise<Record<string, ProjectOverride>> {
  let value = input;
  if (typeof input === "string") {
    try { value = JSON.parse(await readFile(input, "utf8")); }
    catch (error) { throw new ConfigurationError(`Unable to load overrides: ${error instanceof Error ? error.message : String(error)}`, { cause: error }); }
  }
  const result = overridesSchema.safeParse(value ?? {});
  if (!result.success) throw new ConfigurationError(`Invalid project overrides: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  return result.data;
}