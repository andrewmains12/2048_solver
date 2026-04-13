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
- **Trace all render sites when changing display logic.** If you change how a data type is displayed (e.g. note names), grep for every component that renders that type and update them all in the same PR. Partial propagation creates UI inconsistencies that are easy to miss in tests but obvious to users (e.g. note buttons say "Bb" but the page header says "A#").

## Verification Gate — Required Before Marking Work Ready for Human Review

A change is **not** ready for human review until it has passed all four levels in order:

### Level 1 — Type check + unit tests
```bash
npm install          # always run first — node_modules may not exist
npm run lint && npm test
```
`npm run lint` runs `tsc --noEmit` — catches type errors that Vitest misses
(Vitest transpiles with esbuild and skips type checking). Both must pass before proceeding.

### Level 2 — Integration tests
```bash
npm run test:integration
```
All Playwright tests must pass on Chromium (visual-verify tests may be skipped if `ANTHROPIC_API_KEY` is absent — that is handled at level 3 instead). WebKit runs automatically in CI; run `npm run test:integration:webkit` locally if it was installed by `npm run setup`.

**Note:** `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` is baked into all `test:integration*` scripts in `package.json`. No need to set it manually.

### Level 3 — Agent visual inspection
After the dev server is running (`npm run dev`), use Playwright to take screenshots of:
1. The audio gate screen
2. The session setup screen (after tapping the gate)
3. The exercise screen (after starting a C major Tier 1 session)
4. The stats screen (after ending the session)

Read each screenshot and verify it matches the expected layout described in `tests/integration/visual-verify.spec.ts`. If `ANTHROPIC_API_KEY` is set, run `npm run test:integration` — the visual-verify suite will do this automatically.

Any screen that looks broken, blank, or wrong must be diagnosed and fixed before proceeding to level 4.

### Level 4 — Independent agent review
After levels 1–3 pass, spawn a **fresh agent** with no memory of the current session to review your diff:

```
Review the staged changes in this repository for correctness, style, and potential
issues. Run `git diff HEAD` (or `git diff main...HEAD` if commits are already made)
to get the diff. Check: type safety, logic correctness, adherence to project
conventions in AGENTS.md (pure functions in theory/, no Tone.js in components/,
tests are DRY), full propagation of any display-logic changes (grep for all render
sites), and any security or performance concerns. Report findings as a short
bulleted list grouped by severity: blocking / warning / minor.
```

The reviewing agent must have no context from the implementation session — it should
reach its own conclusions independently. Address any **blocking** findings before
proceeding. Use your judgment on warnings and minors.

### Level 5 — Human review
Only after levels 1–4 pass: commit, push, and hand off to the human.

## Session Setup — Run This First

At the start of every new session (or after cloning):
```bash
npm run setup
```
This single command: installs npm deps, installs Playwright browsers (or wires the pre-installed Chromium via symlink if the network is unavailable), and prints ready-to-use commands.

## Running the Project

```bash
npm run dev                   # dev server at http://localhost:5173
npm test                      # unit tests (Vitest)
npm run lint                  # TypeScript type-check
npm run test:integration      # Playwright integration tests (Chromium)
npm run test:integration:webkit  # WebKit / iOS Safari (if installed)
npm run build                 # production PWA build
```
