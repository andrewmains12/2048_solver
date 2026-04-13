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

# Run in the background so the session opens immediately.
# The setup takes ~5–15 s on a warm run. If you kick off tests or lint
# right away and they fail with "module not found", the hook is still
# running — wait a moment and retry.
echo '{"async": true, "asyncTimeout": 300000}'

cd "$CLAUDE_PROJECT_DIR"
bash scripts/setup.sh
