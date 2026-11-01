import type { Project, ProjectOverride, ReadmeData } from "./types/index.js";

type Repository = {
  name: string; full_name: string; html_url: string; description: string | null; homepage: string | null;
  topics?: string[]; language?: string | null; stargazers_count: number; forks_count: number;
  archived: boolean; fork: boolean; updated_at: string;
};

export function normalizeProject(repo: Repository, languages: Record<string, number>, readme: ReadmeData, defaults: ProjectOverride, override?: ProjectOverride): Project {
  const chosen = <T>(overrideValue: T | undefined, defaultValue: T | undefined, readmeValue: T, metadataValue: T): T =>
    overrideValue ?? defaultValue ?? readmeValue ?? metadataValue;
  const title = override?.title ?? defaults.title ?? repo.name;
  const description = override?.description ?? defaults.description ?? readme.introduction ?? repo.description ?? "";
  const technologies = chosen(override?.technologies ?? override?.tags, defaults.technologies ?? defaults.tags, readme.technologies, Object.keys(languages));
  const features = chosen(override?.features, defaults.features, readme.features, []);
  const images = override?.images ?? (override?.image ? [override.image] : undefined) ?? defaults.images ?? (defaults.image ? [defaults.image] : undefined) ?? readme.imageUrls;
  return {
    name: repo.name, title, fullName: repo.full_name, description, githubDescription: repo.description,
    url: repo.html_url, homepage: repo.homepage, demoUrl: override?.demoUrl ?? defaults.demoUrl ?? readme.demoUrl ?? repo.homepage,
    imageUrls: images, tags: override?.tags ?? defaults.tags ?? repo.topics ?? [], topics: repo.topics ?? [],
    technologies, features, introduction: readme.introduction, languages, stars: repo.stargazers_count,
    forks: repo.forks_count, featured: override?.featured ?? defaults.featured ?? false, order: override?.order ?? defaults.order ?? null,
    updatedAt: repo.updated_at,
  };
}