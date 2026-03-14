# Markdown Editor

This repository is now shaped around a single product: a Markdown Editor with a
live preview, local draft persistence, and a modern repo workflow based on
VoidZero and OXC tooling.

## Stack

- `vite` for local development and production builds
- `vitest` for renderer coverage
- `oxlint` for fast linting
- plain browser JavaScript for the editor itself

## App Structure

- [index.html](./index.html) is the Vite entry document
- [src/main.js](./src/main.js) wires the editor UI and browser persistence
- [src/markdown.js](./src/markdown.js) contains the Markdown rendering logic
- [src/styles.css](./src/styles.css) contains the application styles
- [tests/markdown.test.js](./tests/markdown.test.js) covers the renderer

## Development

```bash
npm install
npm run dev
```

## Validation

Run the repo smoke validation:

```bash
sh scripts/validate-smoke-repo.sh
```

When dependencies are installed, the full local check is:

```bash
npm run check
```

## Smoke Workflow Files

This repository still keeps a small amount of Symphony workflow scaffolding
because the repo is also used for live smoke tasks:

- [SMOKE_TARGET.md](./SMOKE_TARGET.md)
- [smoke/review-target.md](./smoke/review-target.md)

Those files are operational repo fixtures, not part of the Markdown Editor UI.
