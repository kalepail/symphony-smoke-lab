import { fallbackMarkdown, getMarkdownStats, renderMarkdown, storageKey } from "./markdown.js";
import "./styles.css";

const textarea = document.querySelector("#markdown-input");
const previewOutput = document.querySelector("#preview-output");
const wordCount = document.querySelector("#word-count");
const lineCount = document.querySelector("#line-count");
const loadSampleButton = document.querySelector("#load-sample");
const clearEditorButton = document.querySelector("#clear-editor");

let frameHandle = 0;

function updateStats(markdown) {
  const stats = getMarkdownStats(markdown);
  wordCount.textContent = `${stats.words} ${stats.words === 1 ? "word" : "words"}`;
  lineCount.textContent = `${stats.lines} ${stats.lines === 1 ? "line" : "lines"}`;
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
    // Keep the editor usable even if storage is unavailable.
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
  textarea.selectionStart = start + insertion.length;
  textarea.selectionEnd = start + insertion.length;
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
