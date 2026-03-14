#!/bin/sh
set -eu

test -f README.md
test -f SMOKE_TARGET.md
test -f smoke/review-target.md
test -f package.json
test -f index.html
test -f src/main.js
test -f src/markdown.js
test -f src/styles.css
test -f tests/markdown.test.js

grep -q '"dev": "vite"' package.json
grep -q '"test": "vitest run"' package.json
grep -q '"lint": "oxlint \."' package.json

grep -q '^# Symphony Smoke Target$' SMOKE_TARGET.md
grep -q '^## Change Log$' SMOKE_TARGET.md
grep -Eq '^- 20[0-9]{2}-[0-9]{2}-[0-9]{2}:' SMOKE_TARGET.md

grep -q '^# Symphony Review Target$' smoke/review-target.md
grep -q 'sh scripts/validate-smoke-repo.sh' README.md

echo 'smoke repo validation passed'
