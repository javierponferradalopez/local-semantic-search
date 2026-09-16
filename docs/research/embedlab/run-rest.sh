#!/bin/sh
# Runs one probe over every candidate that loaded, one process at a time.
# Usage: sh run-rest.sh <probe> [extra-arg] [suffix]
# Reads out_load.jsonl, so it only runs what actually loaded.
set -u
probe=$1
extra=${2:-}
suffix=${3:-}
outfile="out_${probe}${suffix}.jsonl"
errfile="err_${probe}${suffix}.txt"
: > "$outfile"
: > "$errfile"
node -e '
import("node:fs").then(async (fs) => {
  const { CANDIDATES } = await import("./common.mjs");
  const ok = new Set();
  for (const line of fs.readFileSync("out_load.jsonl", "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.ok) ok.add(`${d.key} ${d.dtype}`);
  }
  for (const c of CANDIDATES) for (const d of c.dtypes) if (ok.has(`${c.key} ${d}`)) console.log(c.key, d);
});
' | while read -r key dtype; do
  echo "--- $key $dtype" >> "$errfile"
  if out=$(node "${probe}.mjs" "$key" "$dtype" $extra 2>>"$errfile"); then
    printf "%s\n" "$out" >> "$outfile"
    echo "$key $dtype ok"
  else
    echo "{\"key\":\"$key\",\"dtype\":\"$dtype\",\"ok\":false,\"error\":\"process aborted or threw\"}" >> "$outfile"
    echo "$key $dtype FAILED"
  fi
done
