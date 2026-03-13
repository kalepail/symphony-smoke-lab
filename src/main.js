import { renderMarkdown } from "./markdown.js";
import "./styles.css";

const storageKey = "markdown-editor:draft";
const sampleMarkdown = `# Markdown Editor

Build notes, product copy, and technical drafts in one place.

## Why this repo changed

- The app now lives in a Vite-friendly structure.
- Markdown rendering logic is isolated for Vitest coverage.
- OXC linting has a dedicated script entry point.

> The repository should look like a real editor product, not just a smoke harness.

### Working rhythm

1. Draft in Markdown.
2. Preview the rendered result instantly.
3. Copy the generated HTML when you need to publish elsewhere.

\`\`\`js
const stack = ["vite", "vitest", "oxc"];
console.log(stack.join(" / "));
\`\`\`

Read the repo notes in [README.md](./README.md).`;

const textarea = document.querySelector("#markdown-input");
const previewOutput = document.querySelector("#preview-output");
const saveState = document.querySelector("#save-state");
const wordCount = document.querySelector("#word-count");
const lineCount = document.querySelector("#line-count");
const readTime = document.querySelector("#read-time");
const loadSampleButton = document.querySelector("#load-sample");
const copyHtmlButton = document.querySelector("#copy-html");
const clearEditorButton = document.querySelector("#clear-editor");

let frameHandle = 0;

function setSaveState(text, tone = "neutral") {
  saveState.textContent = text;
  saveState.dataset.tone = tone;
}

function updateStats(markdown) {
  const trimmed = markdown.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = markdown ? markdown.split("\n").length : 0;
  const readingMinutes = words ? Math.max(1, Math.ceil(words / 180)) : 0;

  wordCount.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  lineCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"}`;
  readTime.textContent = `${readingMinutes} min read`;
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
    setSaveState("Saved locally", "success");
    return true;
  } catch {
    setSaveState("Autosave unavailable", "warning");
    return false;
  }
}

function setDraft(markdown, { focus = false, persist = true } = {}) {
  textarea.value = markdown;
  scheduleRender(markdown);

  if (persist) {
    persistDraft(markdown);
  }

  if (focus) {
    textarea.focus();
  }
}

function resolveInitialDraft() {
  try {
    const storedDraft = localStorage.getItem(storageKey);

    if (storedDraft !== null) {
      setSaveState("Restored local draft", "success");
      return storedDraft;
    }
  } catch {
    setSaveState("Autosave unavailable", "warning");
    return sampleMarkdown;
  }

  setSaveState("Loaded starter note", "neutral");
  return sampleMarkdown;
}

async function copyPreviewHtml() {
  const html = previewOutput.innerHTML.trim();

  if (!html) {
    setSaveState("Nothing to copy yet", "neutral");
    return;
  }

  if (!navigator.clipboard?.writeText) {
    setSaveState("Clipboard unavailable", "warning");
    return;
  }

  try {
    await navigator.clipboard.writeText(html);
    setSaveState("Preview HTML copied", "success");
  } catch {
    setSaveState("Clipboard unavailable", "warning");
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
  textarea.selectionStart = start + insertion.length;
  textarea.selectionEnd = start + insertion.length;

  scheduleRender(nextValue);
  persistDraft(nextValue);
});

loadSampleButton.addEventListener("click", () => {
  setDraft(sampleMarkdown, { focus: true });
});

copyHtmlButton.addEventListener("click", async () => {
  await copyPreviewHtml();
});

clearEditorButton.addEventListener("click", () => {
  setDraft("", { focus: true });
  setSaveState("Draft cleared", "neutral");
});

setDraft(resolveInitialDraft(), { persist: false });
