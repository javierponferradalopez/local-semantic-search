#!/bin/sh
# Downloads every candidate, five at a time. Only the network runs here.
# Every measurement then runs from a warm cache, one process at a time.
set -u
node -e '
import("./common.mjs").then(({CANDIDATES}) => {
  for (const c of CANDIDATES) for (const d of c.dtypes) console.log(`${c.key} ${d}`);
});
' | xargs -P 5 -L 1 sh -c 'node prefetch.mjs "$0" "$1"' 2>&1 | tee prefetch.txt
