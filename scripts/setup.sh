#!/usr/bin/env bash
# Solfege Trainer — one-shot dev environment setup
#
# Run once at the start of every session (or after cloning).
# Safe to re-run (idempotent).
#
# What this does:
#   1. npm install
#   2. Playwright browsers — tries a network download first; if that fails
#      (403 / no network), wires up the pre-installed Chromium via symlink
#   3. Prints the commands you'll need for dev/test work

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== Solfege Trainer dev setup ==="
echo ""

# ── 1. npm dependencies ──────────────────────────────────────────────────────
echo "→ Installing npm dependencies..."
npm install
echo "  ✓ Done"
echo ""

# ── 2. Playwright browsers ───────────────────────────────────────────────────
echo "→ Setting up Playwright browsers..."

if PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npm run install:browsers 2>/dev/null; then
  echo "  ✓ Browsers installed via download."
else
  echo "  Network download unavailable — wiring up pre-installed Chromium..."

  node - <<'NODEEOF'
const fs   = require('fs');
const path = require('path');

const PW_BROWSERS = '/opt/pw-browsers';

// ── Find the installed headless_shell binary ────────────────────────────────
const dirs = fs.readdirSync(PW_BROWSERS);
const installedDir = dirs.find(d =>
  d.startsWith('chromium_headless_shell-') &&
  fs.existsSync(path.join(PW_BROWSERS, d, 'chrome-linux', 'headless_shell'))
);

if (!installedDir) {
  console.error('  ERROR: No pre-installed chromium_headless_shell-* found in', PW_BROWSERS);
  console.error('  Available:', dirs.join(', '));
  process.exit(1);
}

const installedBinary = path.join(PW_BROWSERS, installedDir, 'chrome-linux', 'headless_shell');
console.log('  Found installed binary:', installedBinary);

// ── Ask Playwright where it expects its executable ──────────────────────────
const { registry } = require('./node_modules/playwright-core/lib/server/registry/index.js');
const chs = registry.executables().find(e => e.name === 'chromium-headless-shell');

let expectedPath;
try {
  chs.executablePathOrDie('linux');
} catch (e) {
  const match = e.message.match(/Executable doesn't exist at ([^\n]+)/);
  if (match) expectedPath = match[1].trim();
}

if (!expectedPath) {
  console.error('  ERROR: Could not determine expected Chromium path from Playwright registry.');
  process.exit(1);
}

// ── Create symlink ───────────────────────────────────────────────────────────
const expectedDir = path.dirname(expectedPath);
fs.mkdirSync(expectedDir, { recursive: true });

if (fs.existsSync(expectedPath)) {
  console.log('  ✓ Chromium symlink already in place:', expectedPath);
} else {
  fs.symlinkSync(installedBinary, expectedPath);
  console.log('  ✓ Chromium symlink created:');
  console.log('      ' + expectedPath);
  console.log('    → ' + installedBinary);
}
NODEEOF

  echo "  ℹ  WebKit: download blocked in this environment — CI (GitHub Actions) runs the webkit suite automatically."
fi

echo ""

# ── 3. Done ───────────────────────────────────────────────────────────────────
echo "=== Setup complete ==="
echo ""
echo "Useful commands:"
echo ""
echo "  npm test                          Unit tests (Vitest)"
echo "  npm run lint                      TypeScript type-check"
echo "  npm run dev                       Dev server → http://localhost:5173"
echo "  npm run test:integration          Playwright (Chromium + WebKit if available)"
echo "  npm run test:integration:webkit   WebKit only (if installed)"
echo ""
