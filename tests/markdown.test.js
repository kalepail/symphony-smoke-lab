import { describe, expect, it } from "vitest";

import { applyInlineMarkdown, normalizeUrl, renderMarkdown } from "../src/markdown.js";

describe("normalizeUrl", () => {
  it("accepts relative and safe absolute links", () => {
    expect(normalizeUrl("./README.md")).toBe("./README.md");
    expect(normalizeUrl("https://example.com/docs")).toBe("https://example.com/docs");
    expect(normalizeUrl("mailto:team@example.com")).toBe("mailto:team@example.com");
  });

  it("rejects unsafe schemes", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
    expect(normalizeUrl("data:text/html,boom")).toBe("");
    expect(normalizeUrl("//example.com")).toBe("");
  });
});

describe("applyInlineMarkdown", () => {
  it("renders links and emphasis while preserving code spans", () => {
    const html = applyInlineMarkdown("Use **bold** and `code` with [docs](./README.md).");

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain('<a href="./README.md">docs</a>');
  });
});

describe("renderMarkdown", () => {
  it("renders headings, lists, quotes, and fenced code", () => {
    const html = renderMarkdown([
      "# Heading",
      "",
      "- One",
      "- Two",
      "",
      "> quoted",
      "",
      "```js",
      "console.log('ok')",
      "```",
    ].join("\n"));

    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("<ul><li>One</li><li>Two</li></ul>");
    expect(html).toContain("<blockquote><p>quoted</p></blockquote>");
    expect(html).toContain("<pre data-language=\"js\"><code>console.log(&#39;ok&#39;)</code></pre>");
  });

  it("escapes raw html and strips unsafe link urls", () => {
    const html = renderMarkdown("<script>bad()</script> [x](javascript:alert(1))");

    expect(html).toContain("&lt;script&gt;bad()&lt;/script&gt;");
    expect(html).not.toContain("javascript:alert(1)");
  });

  it("returns an empty preview state for blank drafts", () => {
    expect(renderMarkdown("   ")).toContain("preview-empty");
  });
});
