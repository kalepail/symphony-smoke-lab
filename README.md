# Symphony Smoke Lab

This repository exists only for Symphony end-to-end smoke tests.

It is safe to:
- create short-lived branches
- open and review pull requests
- merge smoke-test changes into `main`

## Canonical Mutation Target

Default smoke workflows should edit [SMOKE_TARGET.md](./SMOKE_TARGET.md) unless the Linear issue explicitly says otherwise.

## Validation

Run:

```bash
sh scripts/validate-smoke-repo.sh
```

CI runs the same command on pushes and pull requests.

## Notes

- GitHub label `symphony` is reserved for Symphony-created pull requests.
- Review and rework smoke tests may leave short inline or top-level PR comments.
- Merge smoke tests may squash-merge test pull requests back to `main`.
