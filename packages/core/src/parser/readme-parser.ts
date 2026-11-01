import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { toString } from "mdast-util-to-string";
import type { ReadmeData } from "../types/index.js";

type MarkdownNode = { type: string; children?: MarkdownNode[]; url?: string; depth?: number };
type MarkdownTree = { children: MarkdownNode[] };
const key = (value: string) => value.trim().toLowerCase().replace(/[:#]/g, "").replace(/\s+/g, " ");
const matches = (value: string, aliases: string[]) =>
  aliases.some((alias) => key(value) === key(alias));
const MAX_README_LENGTH = 1_000_000;

function safeHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function safeAssetUrl(value: string): boolean {
  return (
    value.startsWith("/") || value.startsWith("./") || value.startsWith("../") || safeHttpUrl(value)
  );
}

export type ReadmeAliases = { technologies: string[]; features: string[]; demos: string[] };

function sectionNodes(tree: MarkdownTree, aliases: string[]) {
  const headingIndex = tree.children.findIndex(
    (node) => node.type === "heading" && matches(toString(node as never), aliases),
  );
  if (headingIndex < 0) return [];
  const nodes: MarkdownNode[] = [];
  for (const node of tree.children.slice(headingIndex + 1)) {
    if (node.type === "heading" && (node.depth ?? 1) <= (tree.children[headingIndex]?.depth ?? 1))
      break;
    nodes.push(node);
  }
  return nodes;
}

function values(nodes: MarkdownNode[]) {
  const listValues = (node: MarkdownNode): string[] =>
    (node.children ?? [])
      .flatMap((item) =>
        (item.children ?? []).flatMap((child) =>
          child.type === "paragraph"
            ? [toString(child as never).trim()]
            : child.type === "list"
              ? listValues(child)
              : [],
        ),
      )
      .filter(Boolean);
  const extracted = nodes
    .flatMap((node) =>
      node.type === "list"
        ? listValues(node)
        : node.type === "table"
          ? (node.children ?? [])
              .slice(1)
              .flatMap((row) => row.children ?? [])
              .map((cell) => toString(cell as never).trim())
              .filter(Boolean)
          : node.type === "paragraph"
            ? [toString(node as never).trim()]
            : [],
    )
    .filter(Boolean);
  return [...new Set(extracted)];
}

export function parseReadme(
  markdown: string | null | undefined,
  aliases: ReadmeAliases,
): ReadmeData {
  if (!markdown?.trim())
    return { technologies: [], features: [], demoUrl: null, imageUrls: [], introduction: null };
  if (markdown.length > MAX_README_LENGTH)
    throw new RangeError("README content exceeds the 1 MB limit.");
  const tree = remark().use(remarkGfm).parse(markdown) as unknown as MarkdownTree;
  const firstHeading = tree.children.findIndex((node) => node.type === "heading");
  const firstHeadingIsTitle =
    firstHeading >= 0 &&
    !matches(toString(tree.children[firstHeading] as never), [
      ...aliases.technologies,
      ...aliases.features,
      ...aliases.demos,
    ]);
  const introStart = firstHeadingIsTitle ? firstHeading + 1 : 0;
  const introEnd = tree.children.findIndex(
    (node, index) => index >= introStart && node.type === "heading",
  );
  const introNodes = tree.children
    .slice(introStart, introEnd < 0 ? tree.children.length : introEnd)
    .filter((node) => node.type === "paragraph");
  const links: string[] = [];
  const images: string[] = [];
  const walk = (node: MarkdownNode): void => {
    if (node.type === "link" && node.url && safeHttpUrl(node.url)) links.push(node.url);
    if (node.type === "image" && node.url && safeAssetUrl(node.url)) images.push(node.url);
    node.children?.forEach(walk);
  };
  tree.children.forEach(walk);
  const demoSectionLinks = sectionNodes(tree, aliases.demos).flatMap((node) => {
    const urls: string[] = [];
    const collect = (child: MarkdownNode): void => {
      if (child.type === "link" && child.url) urls.push(child.url);
      child.children?.forEach(collect);
    };
    collect(node);
    return urls;
  });
  const demo = [...demoSectionLinks, ...links].find(safeHttpUrl) ?? null;
  return {
    technologies: values(sectionNodes(tree, aliases.technologies)),
    features: values(sectionNodes(tree, aliases.features)),
    demoUrl: demo,
    imageUrls: [...new Set(images)],
    introduction: introNodes.length
      ? introNodes
          .map((node) => toString(node as never).trim())
          .filter(Boolean)
          .join("\n\n") || null
      : null,
  };
}
