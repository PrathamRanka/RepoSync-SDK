import { describe, expect, it } from "vitest";
import { parseReadme } from "../src/parser/readme-parser.js";

describe("parseReadme", () => {
  it("extracts aliased sections, links, and images with remark", () => {
    const result = parseReadme(
      `# App

An application for teams.

## Stack
- TypeScript
- Node.js

## Highlights
- Fast
- Small

## Try it
[Open the demo](https://example.com)

![Preview](./preview.png)`,
      {
        technologies: ["stack"],
        features: ["highlights"],
        demos: ["try it"],
      },
    );
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
      technologies: [],
      features: [],
      demoUrl: null,
      imageUrls: [],
      introduction: null,
    });
  });

  it("handles paragraphs, nested lists, GFM tables, code blocks, duplicates, and multiple demo links", () => {
    const result = parseReadme(
      `Intro paragraph one.

Intro paragraph two.

## Technologies
- TypeScript
- TypeScript
  - Node.js

| Technology | Version |
| --- | --- |
| React | 19 |
| React | 19 |

\`\`\`ts
const ignored = "code";
\`\`\`

## Demo
[Primary](https://primary.example)
[Secondary](https://secondary.example)`,
      {
        technologies: ["technologies"],
        features: ["features"],
        demos: ["demo"],
      },
    );
    expect(result.introduction).toBe("Intro paragraph one.\n\nIntro paragraph two.");
    expect(result.technologies).toEqual(["TypeScript", "Node.js", "React", "19"]);
    expect(result.demoUrl).toBe("https://primary.example");
  });

  it("rejects unsafe URLs, keeps relative images, and tolerates malformed Markdown", () => {
    const result = parseReadme(
      `## Demo
[Unsafe](javascript:alert(1))
[Valid](https://safe.example)

![Safe](../safe.png)
![Unsafe](javascript:alert(1))

**unclosed`,
      { technologies: [], features: [], demos: ["demo"] },
    );
    expect(result.demoUrl).toBe("https://safe.example");
    expect(result.imageUrls).toEqual(["../safe.png"]);
  });

  it("bounds README parsing to avoid untrusted oversized input", () => {
    expect(() =>
      parseReadme("x".repeat(1_000_001), {
        technologies: [],
        features: [],
        demos: [],
      }),
    ).toThrow("1 MB limit");
  });
});
