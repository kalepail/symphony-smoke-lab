const storageKey = "splitview-markdown-studio:draft";
const fallbackMarkdown = `# Quiet interfaces, faster ideas

Use the left pane as a plain markdown drafting surface.

## Why this editor works

- Split view keeps writing and reading connected.
- Local autosave removes the fear of refreshing.
- The layout collapses into a clean vertical stack on mobile.

> Keep the tool small enough that the content stays in charge.

### Working notes

1. Draft with headings, lists, and links.
2. Drop in fenced code blocks when needed.
3. Let the preview show the final reading rhythm.

\`\`\`js
const note = "Markdown should feel immediate.";
console.log(note);
\`\`\`

Visit [the project README](./README.md) for repository details.`;

const textarea = document.querySelector("#markdown-input");
const previewOutput = document.querySelector("#preview-output");
const wordCount = document.querySelector("#word-count");
const lineCount = document.querySelector("#line-count");
const loadSampleButton = document.querySelector("#load-sample");
const clearEditorButton = document.querySelector("#clear-editor");

let frameHandle = 0;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeUrl(rawUrl) {
  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return "";
  }

  if (/^(https?:|mailto:|\/|#)/i.test(trimmed)) {
    return trimmed.replaceAll('"', "%22");
  }

  return "";
}

function applyInlineMarkdown(source) {
  const codeSpans = [];
  const withPlaceholders = escapeHtml(source).replace(/`([^`]+)`/g, (_, code) => {
    const placeholder = `__CODE_SPAN_${codeSpans.length}__`;
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
    html = html.replace(`__CODE_SPAN_${index}__`, snippet);
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

function renderMarkdown(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n").trimEnd();

  if (!normalized.trim()) {
    return `
      <div class="preview-empty">
        <p>Start typing markdown in the editor and the rendered preview appears here instantly.</p>
      </div>
    `;
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

      blocks.push(
        `<pre${language}><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
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

      blocks.push(`<blockquote>${renderMarkdown(quoteLines.join("\n"))}</blockquote>`);
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
        /^```/.test(currentTrimmed) ||
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

function updateStats(markdown) {
  const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lines = markdown ? markdown.split("\n").length : 0;
  wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  lineCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
}

function commitRender(markdown) {
  previewOutput.innerHTML = renderMarkdown(markdown);
  updateStats(markdown);
}

function scheduleRender(markdown) {
  cancelAnimationFrame(frameHandle);
  frameHandle = requestAnimationFrame(() => {
    commitRender(markdown);
  });
}

function persistDraft(markdown) {
  try {
    localStorage.setItem(storageKey, markdown);
  } catch {
    // Ignore storage failures so the editor remains usable in locked-down browsers.
  }
}

function setDraft(markdown) {
  textarea.value = markdown;
  scheduleRender(markdown);
  persistDraft(markdown);
}

function resolveInitialDraft() {
  try {
    const storedDraft = localStorage.getItem(storageKey);
    return storedDraft && storedDraft.trim() ? storedDraft : fallbackMarkdown;
  } catch {
    return fallbackMarkdown;
  }
}

textarea.addEventListener("input", (event) => {
  const nextDraft = event.currentTarget.value;
  scheduleRender(nextDraft);
  persistDraft(nextDraft);
});

textarea.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") {
    return;
  }

  event.preventDefault();
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const insertion = "  ";
  const nextValue = `${textarea.value.slice(0, start)}${insertion}${textarea.value.slice(end)}`;

  textarea.value = nextValue;
  textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
  scheduleRender(nextValue);
  persistDraft(nextValue);
});

loadSampleButton.addEventListener("click", () => {
  setDraft(fallbackMarkdown);
  textarea.focus();
});

clearEditorButton.addEventListener("click", () => {
  setDraft("");
  textarea.focus();
});

setDraft(resolveInitialDraft());
