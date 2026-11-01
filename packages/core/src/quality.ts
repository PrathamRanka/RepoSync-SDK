import type {
  MetadataQualityReport,
  Project,
  QualityField,
  QualityFinding,
} from "./types/index.js";

const fieldLabels: Record<QualityField, string> = {
  description: "description",
  technologies: "technologies",
  features: "features",
  demoUrl: "demo URL",
  image: "project image",
};

function isPresent(project: Project, field: QualityField): boolean {
  switch (field) {
    case "description":
      return project.description.trim().length > 0;
    case "technologies":
      return project.technologies.length > 0;
    case "features":
      return project.features.length > 0;
    case "demoUrl":
      return project.demoUrl !== null;
    case "image":
      return project.imageUrls.length > 0;
  }
}

export function analyzeProjectQuality(
  project: Project,
  required: QualityField[] = ["description", "technologies"],
): MetadataQualityReport {
  const checkedFields = [...new Set(required)];
  const findings: QualityFinding[] = checkedFields
    .filter((field) => !isPresent(project, field))
    .map((field) => ({
      field,
      severity: field === "description" || field === "technologies" ? "warning" : "info",
      message: `Missing ${fieldLabels[field]}.`,
      suggestion: `Add a ${fieldLabels[field]} in the README or reposync.overrides.json.`,
    }));
  const score =
    checkedFields.length === 0
      ? 100
      : Math.round(((checkedFields.length - findings.length) / checkedFields.length) * 100);
  return { score, checkedFields, findings };
}

export function analyzeProjectsQuality(
  projects: Project[],
  required: QualityField[] = ["description", "technologies"],
): MetadataQualityReport[] {
  return projects.map((project) => analyzeProjectQuality(project, required));
}
