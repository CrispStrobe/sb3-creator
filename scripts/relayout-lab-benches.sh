#!/bin/sh
# Lay out every lab bench again with scripts/lib/bench-layout.mjs: the owning
# generator for generated benches, scripts/seat-lab-benches.mjs for the rest.
# LAYOUT_PENDING benches (scripts/lib/lab-bench-owners.mjs) are left alone.
# Then prove the nets: scripts/prove-lab-nets.mjs --base=<rev>.
set -e
cd "$(dirname "$0")/.."
for set in 4 5 6; do
  ids=$(node -e "Promise.all([import('./scripts/lib/lab-benches-$set.mjs'), import('./scripts/lib/lab-bench-owners.mjs')]).then(([m, o]) => console.log(Object.keys(m.BENCHES).filter(k => !o.LAYOUT_PENDING.has(k)).join(' ')))")
  # shellcheck disable=SC2086
  node scripts/gen-lab-circuits-4.mjs --set=$set $ids
done
node scripts/gen-lab-batch2.mjs
node scripts/seat-lab-benches.mjs
