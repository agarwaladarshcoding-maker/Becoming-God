#!/bin/bash
# Daily auto-commit/push for the Becoming-God repo.
# Run by launchd (see ~/Library/LaunchAgents/com.adarsh.becominggod.dailypush.plist).

set -euo pipefail

REPO_DIR="/Users/adarshagarwala/Documents/Becoming-God"
LOG_FILE="$REPO_DIR/scripts/daily_push.log"

exec >> "$LOG_FILE" 2>&1
echo "===== $(date '+%Y-%m-%d %H:%M:%S %Z') ====="

cd "$REPO_DIR"

# Make sure this is a git repo before doing anything else.
if [ ! -d .git ]; then
  echo "Not a git repository: $REPO_DIR"
  exit 1
fi

git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
  today="$(date '+%Y-%m-%d')"
  if grep -q '^Last checked: ' README.md 2>/dev/null; then
    sed -i '' "s/^Last checked: .*/Last checked: $today/" README.md
  else
    printf '\nLast checked: %s\n' "$today" >> README.md
  fi
  git add README.md
  if git diff --cached --quiet; then
    echo "README already up to date, nothing to push."
    exit 0
  fi
  git commit -m "Daily check-in: no new changes"
else
  changed_files="$(git diff --cached --name-status | awk '{print $2}' | tr '\n' ' ')"
  echo "Changes detected in: $changed_files"
  git commit -m "Daily update: $(date '+%Y-%m-%d') changes to $changed_files"
fi

git push origin main
echo "Push complete."
