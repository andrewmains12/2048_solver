# Solfege Trainer — Agent Guide

This file is the table of contents for all project documentation. Read it first.

## What This Project Is

A Progressive Web App (PWA) for ear training, inspired by GNU Solfege and functional ear training apps. Runs offline in any browser and on iPhone (installed via "Add to Home Screen"). No Swift, no native code.

The core exercise: hear a key established by a tonic chord → hear a diatonic chord → hear a single note played over it → identify the note name and the chord name.

## Documentation

All design and architecture docs live in `docs/`. Run `ls docs/` to see what's
available — filenames are self-documenting.

**Conventions:**
- `docs/features.md` — high-level status table + brief spec for each feature; links
  to per-feature detail docs
- `docs/<feature>.md` — created for any feature with meaningful in-flight complexity;
  holds progress notes, known issues, and TODOs while work is active

When implementing a feature: update `docs/features.md` to reflect shipped/in-progress
status, and keep the feature's own detail doc current with issues and remaining work.

## Repository Layout

```
src/
  audio/       Tone.js engine — plays chords, notes, cadences
  theory/      Pure TS music theory — scales, chords, intervals (no audio, no React)
  exercises/   Exercise logic — question generation, answer validation, stats
  components/  React UI components
  store/       Zustand state slices
  types/       Shared TypeScript types
tests/
  unit/        Mirrors src/ — Vitest tests for theory, exercises
  integration/ Playwright end-to-end flows (+ Claude API visual verification)
docs/          Design and architecture documents
```

## Key Conventions

- **TypeScript everywhere.** No `.js` files in `src/`.
- **Pure functions for logic.** `src/theory/` and `src/exercises/` have zero side effects and are trivially testable.
- **Audio only in `src/audio/`.** React components never call Tone.js directly.
- **Tests are DRY.** Factor shared setup into helpers. Assert on full return values, not fragments.
- See [docs/testing.md](docs/testing.md) for full test conventions.

## Verification Gate — Required Before Marking Work Ready for Human Review

A change is **not** ready for human review until it has passed all four levels in order:

### Level 1 — Type check + unit tests
```bash
npm run lint && npm test
```
`npm run lint` runs `tsc --noEmit` — catches type errors that Vitest misses
(Vitest transpiles with esbuild and skips type checking). Both must pass before proceeding.

### Level 2 — Integration tests
```bash
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test --project=chromium
```
All Playwright tests must pass (visual-verify tests may be skipped if `ANTHROPIC_API_KEY` is absent — that is handled at level 3 instead).

**Environment note — chromium:** The pre-installed Playwright browser lives at `/opt/pw-browsers` but may be a different build number than the version in `package.json`. If Playwright cannot find its executable, create a symlink:
```bash
mkdir -p /opt/pw-browsers/chromium_headless_shell-<expected>/chrome-headless-shell-linux64
ln -sf /opt/pw-browsers/chromium_headless_shell-<installed>/chrome-linux/headless_shell \
       /opt/pw-browsers/chromium_headless_shell-<expected>/chrome-headless-shell-linux64/chrome-headless-shell
```
Find `<installed>` with `ls /opt/pw-browsers/` and `<expected>` from the error message.

**Environment note — webkit:** WebKit is not pre-installed. Install it once after cloning (requires sudo for system deps on Linux):
```bash
npm run install:browsers   # installs chromium + webkit with all system dependencies
```
After installing, run the webkit suite to verify iOS Safari behaviour:
```bash
npx playwright test --project=webkit
```
CI (GitHub Actions) installs both browsers automatically via the `Install Playwright browsers` step in `deploy.yml` — webkit failures in CI mean a real cross-browser regression, not a missing binary.

### Level 3 — Agent visual inspection
After the dev server is running (`npm run dev`), use Playwright to take screenshots of:
1. The audio gate screen
2. The session setup screen (after tapping the gate)
3. The exercise screen (after starting a C major Tier 1 session)
4. The stats screen (after ending the session)

Read each screenshot and verify it matches the expected layout described in `tests/integration/visual-verify.spec.ts`. If `ANTHROPIC_API_KEY` is set, run `npm run test:integration` — the visual-verify suite will do this automatically.

Any screen that looks broken, blank, or wrong must be diagnosed and fixed before proceeding to level 4.

### Level 4 — Human review
Only after levels 1–3 pass: commit, push, and hand off to the human.

## Running the Project

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm test             # unit tests (Vitest)
npm run test:integration  # Playwright integration tests (requires dev server)
npm run build        # production PWA build
```
