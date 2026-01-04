#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  echo "Usage: $0 \"Lesson Title\" [slug]" >&2
  exit 0
fi

if [ $# -lt 1 ]; then
  echo "Usage: $0 \"Lesson Title\" [slug]" >&2
  exit 1
fi

title="$1"
slug="${2:-}"

if [ -z "$slug" ]; then
  slug=$(echo "$title" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed -e 's/^-//' -e 's/-$//')
fi

if [ -z "$slug" ]; then
  echo "Could not derive a slug from the title." >&2
  exit 1
fi

dest="lessons/${slug}.md"

if [ -e "$dest" ]; then
  echo "Lesson already exists: $dest" >&2
  exit 1
fi

sed "s/{{TITLE}}/${title}/g" templates/lesson-template.md > "$dest"

cat <<EOF2
Created $dest
Open: http://localhost:8000/?lesson=${slug}
EOF2
