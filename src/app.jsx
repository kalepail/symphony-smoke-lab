import { useEffect, useMemo, useRef, useState } from "react";

import { renderMarkdown } from "./markdown.js";
import { Button } from "./components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { Textarea } from "./components/ui/textarea.jsx";

const draftStorageKey = "markdown-editor:draft";
const saveDelayMs = 180;
const mobileViews = [
  { value: "write", label: "Write" },
  { value: "preview", label: "Preview" },
];

const sampleMarkdown = `# Weekly notes

Ship the smallest useful version first.

## Today

- Tighten the mobile layout
- Keep the editor fast
- Make preview easy to scan

> Good Markdown tools stay out of the way.

\`\`\`md
## Next
- Review
- Merge
\`\`\`
`;

function resolveInitialDraft() {
  try {
    const storedDraft = window.localStorage.getItem(draftStorageKey);
    return storedDraft ?? sampleMarkdown;
  } catch {
    return sampleMarkdown;
  }
}

function countWords(markdown) {
  const trimmed = markdown.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function App() {
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(0);
  const pendingDraftRef = useRef(null);
  const [draft, setDraft] = useState(resolveInitialDraft);
  const [mobileView, setMobileView] = useState("write");
  const [saveState, setSaveState] = useState(() => ({
    text: draft === sampleMarkdown ? "Starter note loaded" : "Draft restored",
    tone: draft === sampleMarkdown ? "neutral" : "success",
  }));

  const previewMarkup = useMemo(() => renderMarkdown(draft), [draft]);
  const wordCount = useMemo(() => countWords(draft), [draft]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      if (pendingDraftRef.current !== null) {
        persistDraft(pendingDraftRef, pendingDraftRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const flushOnHide = () => {
      if (pendingDraftRef.current !== null) {
        persistDraft(pendingDraftRef, pendingDraftRef.current);
      }
    };

    window.addEventListener("pagehide", flushOnHide);
    return () => window.removeEventListener("pagehide", flushOnHide);
  }, []);

  function updateDraft(nextDraft, { immediate = false } = {}) {
    setDraft(nextDraft);
    pendingDraftRef.current = nextDraft;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = 0;
    }

    if (immediate) {
      persistDraft(pendingDraftRef, nextDraft, setSaveState);
      return;
    }

    setSaveState({ text: "Saving locally...", tone: "neutral" });
    saveTimerRef.current = window.setTimeout(() => {
      persistDraft(pendingDraftRef, nextDraft, setSaveState);
      saveTimerRef.current = 0;
    }, saveDelayMs);
  }

  function handleTabKey(event) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextValue = `${draft.slice(0, start)}  ${draft.slice(end)}`;

    updateDraft(nextValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 2;
    });
  }

  function handleLoadSample() {
    updateDraft(sampleMarkdown, { immediate: true });
    setMobileView("write");
    textareaRef.current?.focus();
  }

  function handleClear() {
    updateDraft("", { immediate: true });
    setMobileView("write");
    setSaveState({ text: "Draft cleared", tone: "neutral" });
    textareaRef.current?.focus();
  }

  const editorVisibility = mobileView === "write" ? "block" : "hidden";
  const previewVisibility = mobileView === "preview" ? "block" : "hidden";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <section className="rounded-[2rem] border border-border bg-card shadow-panel">
          <div className="border-b border-border px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                  Markdown editor
                </p>
                <h1 className="font-serif text-3xl leading-none tracking-[-0.04em] sm:text-4xl">
                  Write. Preview. Ship.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Mobile keeps one focused pane at a time. Larger screens show the draft and preview side by side.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" onClick={handleLoadSample}>
                  Load sample
                </Button>
                <Button type="button" variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge tone={saveState.tone}>{saveState.text}</StatusBadge>
              <StatusBadge>{wordCount} words</StatusBadge>
              <StatusBadge>Local draft</StatusBadge>
            </div>

            <div className="mt-4 inline-flex rounded-full border border-border bg-background p-1 lg:hidden">
              {mobileViews.map((view) => {
                const active = view.value === mobileView;

                return (
                  <Button
                    key={view.value}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "ghost"}
                    className="rounded-full px-4"
                    aria-pressed={active}
                    onClick={() => setMobileView(view.value)}
                  >
                    {view.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-px bg-border lg:grid-cols-2">
            <Card className={`${editorVisibility} rounded-none border-0 shadow-none lg:block`}>
              <CardHeader className="border-b border-border bg-muted/35 px-4 py-3 sm:px-6">
                <CardTitle className="text-base font-semibold tracking-[0.01em]">Editor</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <label className="sr-only" htmlFor="markdown-input">
                  Markdown input
                </label>
                <Textarea
                  ref={textareaRef}
                  id="markdown-input"
                  value={draft}
                  onChange={(event) => updateDraft(event.target.value)}
                  onKeyDown={handleTabKey}
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  placeholder="# Start typing"
                  className="min-h-[58vh] rounded-none border-0 bg-card px-4 py-4 font-mono text-[0.95rem] leading-7 shadow-none focus-visible:ring-0 sm:min-h-[62vh] sm:px-6 sm:py-5"
                />
              </CardContent>
            </Card>

            <Card className={`${previewVisibility} rounded-none border-0 shadow-none lg:block`}>
              <CardHeader className="border-b border-border bg-muted/35 px-4 py-3 sm:px-6">
                <CardTitle className="text-base font-semibold tracking-[0.01em]">Preview</CardTitle>
              </CardHeader>
              <CardContent className="min-h-[58vh] bg-card p-4 sm:min-h-[62vh] sm:p-6">
                <article
                  id="preview-output"
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: previewMarkup }}
                />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ children, tone = "neutral" }) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-700"
        : "border-border bg-background text-muted-foreground";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1.5 ${toneClassName}`}>{children}</span>
  );
}

function persistDraft(pendingDraftRef, markdown, setSaveState) {
  try {
    window.localStorage.setItem(draftStorageKey, markdown);
    pendingDraftRef.current = null;
    setSaveState?.({ text: "Saved locally", tone: "success" });
  } catch {
    pendingDraftRef.current = null;
    setSaveState?.({ text: "Autosave unavailable", tone: "warning" });
  }
}
