# Symphony Smoke Lab

This repository currently hosts a lightweight split-view markdown editor built
as a static web app. The product stays intentionally small:

- left side for writing markdown
- right side for rendered HTML preview
- responsive layout that stacks cleanly on mobile
- no build step required to open the app locally

Open [index.html](./index.html) directly in a browser to use the editor.

## Canonical Mutation Target

Default smoke workflows should edit [SMOKE_TARGET.md](./SMOKE_TARGET.md) unless
the issue explicitly says otherwise.

## Validation

Run:

```bash
sh scripts/validate-smoke-repo.sh
```

CI runs the same command on pushes and pull requests.

## Notes

- The editor persists draft content in browser `localStorage`.
- The markdown renderer is dependency-free and escapes raw HTML by default.
- GitHub label `symphony` is reserved for Symphony-created pull requests.
