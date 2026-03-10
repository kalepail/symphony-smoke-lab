#!/bin/sh
set -eu

test -f README.md
test -f SMOKE_TARGET.md
test -f smoke/review-target.md

grep -q '^# Symphony Smoke Target$' SMOKE_TARGET.md
grep -q '^## Change Log$' SMOKE_TARGET.md
grep -Eq '^- 20[0-9]{2}-[0-9]{2}-[0-9]{2}:' SMOKE_TARGET.md

grep -q '^# Symphony Review Target$' smoke/review-target.md
grep -q 'sh scripts/validate-smoke-repo.sh' README.md

echo 'smoke repo validation passed'
