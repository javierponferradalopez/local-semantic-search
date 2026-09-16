#!/bin/sh
# Runs one probe over a list of "key dtype" pairs read from stdin.
# Usage: printf 'minilm fp32\nminilm q8\n' | sh run-one.sh tokens [extra] [suffix]
set -u
probe=$1
extra=${2:-}
suffix=${3:-}
outfile="out_${probe}${suffix}.jsonl"
errfile="err_${probe}${suffix}.txt"
while read -r key dtype; do
  [ -z "$key" ] && continue
  echo "--- $key $dtype" >> "$errfile"
  if out=$(node "${probe}.mjs" "$key" "$dtype" $extra 2>>"$errfile"); then
    printf "%s\n" "$out" >> "$outfile"
    echo "$key $dtype ok"
  else
    echo "{\"key\":\"$key\",\"dtype\":\"$dtype\",\"ok\":false,\"error\":\"process aborted or threw\"}" >> "$outfile"
    echo "$key $dtype FAILED"
  fi
done
