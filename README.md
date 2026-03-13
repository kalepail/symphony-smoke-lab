# Markdown Editor

This repository is now scoped to one product: a local-first Markdown Editor
with a live preview pane, browser persistence, and a modern front-end toolchain.

## Product Surface

- Left pane for raw Markdown authoring
- Right pane for rendered preview
- Mobile-friendly responsive layout
- Dependency-free Markdown rendering logic with HTML escaping

## Tooling Direction

The repo is structured to use the VoidZero and OXC ecosystem directly:

- `vite` for local development and production builds
- `vitest` for renderer coverage
- `oxlint` for fast linting on the codebase

## Project Layout

- `index.html`: app entry point
- `src/main.js`: DOM wiring and editor behavior
- `src/markdown.js`: Markdown rendering and stats logic
- `src/styles.css`: interface styling
- `tests/markdown.test.js`: renderer regression coverage

## Commands

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
sh scripts/validate-smoke-repo.sh
```

## Notes

- Draft content persists in browser `localStorage`.
- Raw HTML is escaped before rendering into the preview pane.
- `sh scripts/validate-smoke-repo.sh` remains the smoke-repo validation command.
