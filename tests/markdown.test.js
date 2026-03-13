import { describe, expect, it } from "vitest";
import { getMarkdownStats, normalizeUrl, renderMarkdown } from "../src/markdown.js";

describe("renderMarkdown", () => {
  it("renders headings and paragraphs", () => {
    const output = renderMarkdown("# Title\n\nBody copy");

    expect(output).toContain("<h1>Title</h1>");
    expect(output).toContain("<p>Body copy</p>");
  });

  it("escapes unsafe script content", () => {
    const output = renderMarkdown("<script>alert('xss')</script>");

    expect(output).toContain("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
    expect(output).not.toContain("<script>");
  });

  it("drops unsafe links", () => {
    const output = renderMarkdown("[bad](javascript:alert(1))");

    expect(output).not.toContain("<a ");
    expect(output).toContain("bad");
  });
});

describe("normalizeUrl", () => {
  it("preserves safe URLs and rejects unsupported schemes", () => {
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(normalizeUrl("mailto:test@example.com")).toBe("mailto:test@example.com");
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
  });
});

describe("getMarkdownStats", () => {
  it("counts words and lines", () => {
    expect(getMarkdownStats("one two\nthree")).toEqual({ words: 3, lines: 2 });
    expect(getMarkdownStats("")).toEqual({ words: 0, lines: 0 });
  });
});
