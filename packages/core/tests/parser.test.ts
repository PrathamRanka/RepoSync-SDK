import { describe, expect, it } from "vitest";
import { parseReadme } from "../src/parser/readme-parser.js";

describe("parseReadme", () => {
  it("extracts aliased sections, links, and images with remark", () => {
    const result = parseReadme(`# App

An application for teams.

## Stack
- TypeScript
- Node.js

## Highlights
- Fast
- Small

## Try it
[Open the demo](https://example.com)

![Preview](./preview.png)`, {
      technologies: ["stack"],
      features: ["highlights"],
      demos: ["try it"],
    });
    expect(result).toEqual({
      technologies: ["TypeScript", "Node.js"],
      features: ["Fast", "Small"],
      demoUrl: "https://example.com",
      imageUrls: ["./preview.png"],
      introduction: "An application for teams.",
    });
  });

  it("handles missing or empty README content", () => {
    expect(parseReadme(undefined, { technologies: [], features: [], demos: [] })).toEqual({
      technologies: [], features: [], demoUrl: null, imageUrls: [], introduction: null,
    });
  });
});