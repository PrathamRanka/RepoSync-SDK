import { remark } from "remark";
import remarkGfm from "remark-gfm";
import { toString } from "mdast-util-to-string";
import type { ReadmeData } from "../types/index.js";

type MarkdownNode = { type: string; children?: MarkdownNode[]; url?: string; depth?: number };
type MarkdownTree = { children: MarkdownNode[] };
const key = (value: string) => value.trim().toLowerCase().replace(/[:#]/g, "").replace(/\s+/g, " ");
const matches = (value: string, aliases: string[]) => aliases.some((alias) => key(value) === key(alias));

export type ReadmeAliases = { technologies: string[]; features: string[]; demos: string[] };

function sectionNodes(tree: MarkdownTree, aliases: string[]) {
  const headingIndex = tree.children.findIndex((node) =>
    node.type === "heading" && matches(toString(node as never), aliases),
  );
  if (headingIndex < 0) return [];
  const nodes: MarkdownNode[] = [];
  for (const node of tree.children.slice(headingIndex + 1)) {
    if (node.type === "heading" && (node.depth ?? 1) <= (tree.children[headingIndex]?.depth ?? 1)) break;
    nodes.push(node);
  }
  return nodes;
}

function values(nodes: MarkdownNode[]) {
  return nodes.flatMap((node) => node.type === "list"
    ? (node.children ?? []).map((item) => toString(item as never).trim()).filter(Boolean)
    : node.type === "paragraph" ? [toString(node as never).trim()] : []).filter(Boolean);
}

export function parseReadme(markdown: string | null | undefined, aliases: ReadmeAliases): ReadmeData {
  if (!markdown?.trim()) return { technologies: [], features: [], demoUrl: null, imageUrls: [], introduction: null };
  const tree = remark().use(remarkGfm).parse(markdown) as unknown as MarkdownTree;
  const firstHeading = tree.children.findIndex((node) => node.type === "heading");
  const introNode = tree.children.slice(firstHeading < 0 ? 0 : firstHeading + 1)
    .find((node) => node.type === "paragraph");
  const links: string[] = [];
  const images: string[] = [];
  const walk = (node: MarkdownNode): void => {
    if (node.type === "link" && node.url) links.push(node.url);
    if (node.type === "image" && node.url) images.push(node.url);
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
  const demo = [...demoSectionLinks, ...links].find((url) => /^https?:\/\//i.test(url)) ?? null;
  return {
    technologies: values(sectionNodes(tree, aliases.technologies)),
    features: values(sectionNodes(tree, aliases.features)),
    demoUrl: demo,
    imageUrls: images,
    introduction: introNode ? toString(introNode).trim() || null : null,
  };
}