//All shared TypeScript interfaces and types.

import type { RepoSyncConfigInput } from "../config/config.js";
import type { GitHubClient } from "../github/repositories.js";

export type ProjectOverride = {
  title?: string;
  description?: string;
  tags?: string[];
  technologies?: string[];
  features?: string[];
  image?: string;
  images?: string[];
  demoUrl?: string;
  featured?: boolean;
  order?: number;
};

export type Project = {
  name: string;
  title: string;
  fullName: string;
  description: string;
  githubDescription: string | null;
  url: string;
  homepage: string | null;
  demoUrl: string | null;
  imageUrls: string[];
  tags: string[];
  topics: string[];
  technologies: string[];
  features: string[];
  introduction: string | null;
  languages: Record<string, number>;
  stars: number;
  forks: number;
  featured: boolean;
  order: number | null;
  updatedAt: string;
};

export type RepoSyncOptions = RepoSyncConfigInput & {
  overrides?: unknown;
  client?: GitHubClient;
};

export type ReadmeData = {
  technologies: string[];
  features: string[];
  demoUrl: string | null;
  imageUrls: string[];
  introduction: string | null;
};