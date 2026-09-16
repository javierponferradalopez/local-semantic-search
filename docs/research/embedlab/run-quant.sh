#!/bin/sh
# Compares fp32 with q8, for every candidate where both loaded.
set -u
: > out_quant.jsonl
: > err_quant.txt
node -e '
import("node:fs").then(async (fs) => {
  const { CANDIDATES } = await import("./common.mjs");
  const ok = new Set();
  for (const line of fs.readFileSync("out_load.jsonl", "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.ok) ok.add(`${d.key} ${d.dtype}`);
  }
  for (const c of CANDIDATES) if (ok.has(`${c.key} fp32`) && ok.has(`${c.key} q8`)) console.log(c.key);
});
' | while read -r key; do
  echo "--- $key" >> err_quant.txt
  if out=$(node quant.mjs "$key" 2>>err_quant.txt); then
    printf "%s\n" "$out" >> out_quant.jsonl
    echo "$key ok"
  else
    echo "{\"key\":\"$key\",\"ok\":false,\"error\":\"process aborted or threw\"}" >> out_quant.jsonl
    echo "$key FAILED"
  fi
done
