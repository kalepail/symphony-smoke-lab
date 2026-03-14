import { useEffect, useMemo, useRef, useState } from "react";
import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react";

import { renderMarkdown } from "./markdown.js";
import { Button } from "./components/ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { Textarea } from "./components/ui/textarea.jsx";

const draftStorageKey = "markdown-editor:draft";
const themeStorageKey = "markdown-editor:theme";
const saveDelayMs = 180;
const themeOptions = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "dark", label: "Dark", icon: MoonStar },
  { value: "system", label: "System", icon: LaptopMinimal },
];

const sampleMarkdown = `# Markdown Editor

Build notes, product copy, and technical drafts in one place.

## Why this repo changed

- The app now lives in a Vite-friendly structure.
- Markdown rendering logic is isolated for Vitest coverage.
- The interface now supports both light and dark reading modes.

> The repository should look like a real editor product, not just a smoke harness.

### Working rhythm

1. Draft in Markdown.
2. Preview the rendered result instantly.
3. Copy the generated HTML when you need to publish elsewhere.

\`\`\`js
const stack = ["vite", "react", "tailwind", "shadcn"];
console.log(stack.join(" / "));
\`\`\`

Read the repo notes in [README.md](./README.md).`;

function resolveInitialDraft() {
  try {
    const storedDraft = window.localStorage.getItem(draftStorageKey);
    return storedDraft ?? sampleMarkdown;
  } catch {
    return sampleMarkdown;
  }
}

function resolveInitialTheme() {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system" ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function resolveSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function countStats(markdown) {
  const trimmed = markdown.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = markdown ? markdown.split("\n").length : 0;
  const readingMinutes = words ? Math.max(1, Math.ceil(words / 180)) : 0;

  return {
    words: `${words} ${words === 1 ? "word" : "words"}`,
    lines: `${lines} ${lines === 1 ? "line" : "lines"}`,
    readTime: `${readingMinutes} min read`,
  };
}

async function writeClipboard(text) {
  if (!navigator.clipboard?.writeText) {
    throw new Error("clipboard-unavailable");
  }

  await navigator.clipboard.writeText(text);
}

export function App() {
  const textareaRef = useRef(null);
  const saveTimerRef = useRef(0);
  const pendingDraftRef = useRef(null);
  const [draft, setDraft] = useState(resolveInitialDraft);
  const [saveState, setSaveState] = useState(() => ({
    text: draft === sampleMarkdown ? "Loaded starter note" : "Restored local draft",
    tone: draft === sampleMarkdown ? "neutral" : "success",
  }));
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [systemTheme, setSystemTheme] = useState(resolveSystemTheme);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const stats = useMemo(() => countStats(draft), [draft]);
  const previewMarkup = useMemo(() => renderMarkdown(draft), [draft]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", onChange);
    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;

    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      // Ignore theme persistence failures and keep the current mode active.
    }
  }, [resolvedTheme, theme]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      if (pendingDraftRef.current !== null) {
        persistDraft(pendingDraftRef, pendingDraftRef.current, setSaveState);
      }
    };
  }, []);

  useEffect(() => {
    const flushOnHide = () => {
      if (pendingDraftRef.current !== null) {
        persistDraft(pendingDraftRef, pendingDraftRef.current, setSaveState);
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

  async function handleCopyHtml() {
    const html = previewMarkup.trim();

    if (!html) {
      setSaveState({ text: "Nothing to copy yet", tone: "neutral" });
      return;
    }

    try {
      await writeClipboard(html);
      setSaveState({ text: "Preview HTML copied", tone: "success" });
    } catch {
      setSaveState({ text: "Clipboard unavailable", tone: "warning" });
    }
  }

  function handleLoadSample() {
    updateDraft(sampleMarkdown, { immediate: true });
    textareaRef.current?.focus();
  }

  function handleClear() {
    updateDraft("", { immediate: true });
    setSaveState({ text: "Draft cleared", tone: "neutral" });
    textareaRef.current?.focus();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.2),transparent_28%),radial-gradient(circle_at_85%_15%,hsl(var(--chart-2)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background))_0%,hsl(var(--muted))_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-editor-grid bg-[size:64px_64px] opacity-[0.08]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-4 rounded-[2rem] border border-border/70 bg-card/75 p-5 shadow-panel backdrop-blur xl:grid-cols-[minmax(0,1.5fr)_auto]">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-accent-foreground/80 shadow-sm">
              Markdown Editor
            </div>
            <div className="space-y-3">
              <h1 className="max-w-4xl font-serif text-4xl leading-[0.92] tracking-[-0.04em] text-balance sm:text-5xl lg:text-7xl">
                Write in raw Markdown. Read it in the mode that fits the room.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                A dual-surface studio for drafting, previewing, and shipping Markdown with local persistence,
                shadcn-style UI primitives, and a deliberate light or dark reading experience.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 xl:items-end">
            <ThemeToggle value={theme} onChange={setTheme} />
            <div className="grid gap-2 sm:grid-cols-3 xl:w-[25rem]">
              <StatPill label="Theme" value={theme === "system" ? `System ${systemTheme}` : theme} />
              <StatPill label="Storage" value="Local draft" />
              <StatPill label="UI" value="Tailwind + shadcn" />
            </div>
          </div>
        </header>
        <section className="grid flex-1 gap-4 xl:grid-cols-2">
          <Card className="overflow-hidden border-border/70 bg-card/80 shadow-panel backdrop-blur">
            <CardHeader className="gap-5 border-b border-border/70 bg-background/55">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Input</p>
                  <CardTitle className="font-serif text-3xl tracking-[-0.03em]">Markdown draft</CardTitle>
                  <CardDescription className="max-w-xl text-sm leading-7">
                    Draft in plain Markdown, tab into soft indentation, and keep every edit stored locally.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={handleLoadSample}>
                    Load sample
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCopyHtml}>
                    Copy HTML
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                <StatusChip tone={saveState.tone}>{saveState.text}</StatusChip>
                <StatusChip>{stats.words}</StatusChip>
                <StatusChip>{stats.lines}</StatusChip>
                <StatusChip>{stats.readTime}</StatusChip>
                <StatusChip>Tab inserts spaces</StatusChip>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-[32rem] flex-col gap-4 p-4 sm:p-6">
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
                placeholder="# Start with a heading"
                aria-describedby="editor-help"
                className="min-h-[26rem] flex-1 resize-none border-0 bg-transparent px-0 py-0 font-mono text-[0.95rem] leading-8 shadow-none focus-visible:ring-0"
              />
              <p id="editor-help" className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm leading-7 text-muted-foreground">
                Drafts are restored from <code className="font-mono text-foreground">localStorage</code> when
                available. The preview intentionally escapes raw HTML.
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/70 bg-card/90 shadow-panel">
            <CardHeader className="border-b border-border/70 bg-accent/8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Output</p>
                  <CardTitle className="font-serif text-3xl tracking-[-0.03em]">Rendered preview</CardTitle>
                  <CardDescription className="max-w-xl text-sm leading-7">
                    The preview inherits the current theme so you can check contrast and cadence before publishing.
                  </CardDescription>
                </div>
                <StatusChip tone="success">Live</StatusChip>
              </div>
            </CardHeader>

            <CardContent className="min-h-[32rem] p-0">
              <article
                id="preview-output"
                className="preview-content min-h-[32rem] p-6 sm:p-8"
                dangerouslySetInnerHTML={{ __html: previewMarkup }}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function ThemeToggle({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1 shadow-sm">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;

        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "ghost"}
            size="sm"
            className="rounded-full px-3"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{option.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

function StatPill { label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-background/75 px-3 py-3 shadow-sm">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}

function StatusChip({children, tone = "neutral"}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : "border-border/70 bg-background/70 text-muted-foreground";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-2 ${toneClassName}`}>
      {children}
    </span>
  );
}

function persistDraft(pendingDraftRef, markdown, setSaveState) {
  try {
    window.localStorage.setItem(draftStorageKey, markdown);
    pendingDraftRef.current = null;
    setSaveState({ text: "Saved locally", tone: "success" });
  } catch {
    pendingDraftRef.current = null;
    setSaveState({ text: "Autosave unavailable", tone: "warning" });
  }
}
