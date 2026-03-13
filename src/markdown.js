export function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeUrl(rawUrl) {
  const trimmed = rawUrl.trim();

  if (!trimmed || trimmed.startsWith("//")) {
    return "";
  }

  const schemeMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);

  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();

    if (!["http", "https", "mailto"].includes(scheme)) {
      return "";
    }

    return escapeHtml(trimmed);
  }

  if (/^(#|\/|\?)/.test(trimmed) || /^\.{1,2}\//.test(trimmed) || !trimmed.includes(":")) {
    return escapeHtml(trimmed);
  }

  return "";
}

export function applyInlineMarkdown(source) {
  const codeSpans = [];
  const placeholderToken = `code-${Math.random().toString(36).slice(2)}`;
  const escaped = escapeHtml(source);
  const withPlaceholders = escaped.replace(/`([^`]+)`/g, (_, code) => {
    const placeholder = `\uE000${placeholderToken}:${codeSpans.length}\uE001`;
    codeSpans.push(`<code>${code}</code>`);
    return placeholder;
  });

  let html = withPlaceholders
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
      const safeUrl = normalizeUrl(url);
      const renderedLabel = applyInlineMarkdown(label);

      if (!safeUrl) {
        return renderedLabel;
      }

      const external = /^https?:/i.test(safeUrl);
      const rel = external ? ' rel="noreferrer noopener"' : "";
      const target = external ? ' target="_blank"' : "";

      return `<a href="${safeUrl}"${target}${rel}>${renderedLabel}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<s>$1</s>");

  codeSpans.forEach((snippet, index) => {
    html = html.replaceAll(`\uE000${placeholderToken}:${index}\uE001`, snippet);
  });

  return html;
}

function renderParagraph(lines) {
  return `<p>${applyInlineMarkdown(lines.join(" "))}</p>`;
}

function renderList(lines, ordered) {
  const tag = ordered ? "ol" : "ul";
  const pattern = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
  const items = lines
    .map((line) => line.replace(pattern, "").trim())
    .filter(Boolean)
    .map((item) => `<li>${applyInlineMarkdown(item)}</li>`)
    .join("");

  return `<${tag}>${items}</${tag}>`;
}

export function renderMarkdown(markdown, { nested = false } = {}) {
  const normalized = markdown.replace(/\r\n/g, "\n").trimEnd();

  if (!normalized.trim()) {
    if (nested) {
      return "";
    }

    return [
      '<div class="preview-empty">',
      "<p>Start typing Markdown in the editor and the rendered preview appears here instantly.</p>",
      "</div>",
    ].join("");
  }

  const lines = normalized.split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    const fencedCode = trimmed.match(/^```([\w-]+)?$/);

    if (fencedCode) {
      const language = fencedCode[1] ? ` data-language="${escapeHtml(fencedCode[1])}"` : "";
      const codeLines = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push(`<pre${language}><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);

    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${applyInlineMarkdown(heading[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      blocks.push("<hr>");
      index += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines = [];

      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }

      blocks.push(`<blockquote>${renderMarkdown(quoteLines.join("\n"), { nested: true })}</blockquote>`);
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const listLines = [];

      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderList(listLines, false));
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const listLines = [];

      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        listLines.push(lines[index]);
        index += 1;
      }

      blocks.push(renderList(listLines, true));
      continue;
    }

    const paragraphLines = [];

    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();

      if (
        !currentTrimmed ||
        /^(#{1,6})\s+/.test(currentTrimmed) ||
        currentTrimmed.startsWith(">") ||
        /^(---|\*\*\*|___)$/.test(currentTrimmed) ||
        currentTrimmed.startsWith("```") ||
        /^\s*[-*+]\s+/.test(current) ||
        /^\s*\d+\.\s+/.test(current)
      ) {
        break;
      }

      paragraphLines.push(currentTrimmed);
      index += 1;
    }

    blocks.push(renderParagraph(paragraphLines));
  }

  return blocks.join("\n");
}
