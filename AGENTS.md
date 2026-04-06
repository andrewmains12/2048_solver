# Solfege Trainer — Agent Guide

This file is the table of contents for all project documentation. Read it first.

## What This Project Is

A Progressive Web App (PWA) for ear training, inspired by GNU Solfege and functional ear training apps. Runs offline in any browser and on iPhone (installed via "Add to Home Screen"). No Swift, no native code.

The core exercise: hear a key established by a tonic chord → hear a diatonic chord → hear a single note played over it → identify the note name and the chord name.

## Documentation Index

| Document | Contents |
|---|---|
| [docs/features.md](docs/features.md) | Full feature spec, exercise types, difficulty tiers |
| [docs/design.md](docs/design.md) | UX flow, screen layouts, interaction model |
| [docs/architecture.md](docs/architecture.md) | Tech stack decisions, module map, data flow |
| [docs/audio-engine.md](docs/audio-engine.md) | Tone.js design, chord voicing, synthesis approach |
| [docs/testing.md](docs/testing.md) | Test strategy, conventions, AI-in-the-loop harness |

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

## Running the Project

```bash
npm install
npm run dev          # dev server at http://localhost:5173
npm test             # unit tests (Vitest)
npm run test:integration  # Playwright integration tests (requires dev server)
npm run build        # production PWA build
```
