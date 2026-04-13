#!/bin/bash
# SessionStart hook — runs automatically at the start of every remote session.
# Delegates to scripts/setup.sh which is idempotent and handles:
#   1. npm install
#   2. Playwright browser setup (download if available, symlink fallback)
set -euo pipefail

# Only run in Claude Code remote sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
bash scripts/setup.sh
