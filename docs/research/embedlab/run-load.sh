#!/bin/sh
# One process per candidate and dtype, so a crash stops only that one.
# Writes out_load.jsonl and err_load.txt.
set -u
: > out_load.jsonl
: > err_load.txt
node -e '
import("./common.mjs").then(({CANDIDATES}) => {
  for (const c of CANDIDATES) for (const d of c.dtypes) console.log(c.key, d);
});
' | while read -r key dtype; do
  echo "--- $key $dtype" >> err_load.txt
  if out=$(node load.mjs "$key" "$dtype" 2>>err_load.txt); then
    printf "%s\n" "$out" >> out_load.jsonl
    echo "$key $dtype ok"
  else
    echo "{\"key\":\"$key\",\"dtype\":\"$dtype\",\"ok\":false,\"error\":\"process aborted\"}" >> out_load.jsonl
    echo "$key $dtype PROCESS ABORTED"
  fi
done
