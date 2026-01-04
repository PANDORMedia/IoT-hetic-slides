#!/usr/bin/env bash
set -euo pipefail

shopt -s nullglob

files=(lessons/*.md)
if [ ${#files[@]} -eq 0 ]; then
  echo "No lessons found in lessons/." >&2
  exit 0
fi

for file in "${files[@]}"; do
  base=$(basename "$file")
  echo "${base%.md}"
done
