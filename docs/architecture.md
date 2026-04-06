# Architecture

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Mainstream, strong ecosystem, good testing story |
| Build | Vite 6 | Fast HMR, native ESM, excellent PWA plugin |
| Audio | Tone.js 15 | High-level Web Audio API wrapper; synthesizes any pitch offline |
| Styling | Tailwind CSS 3 | Mobile-first, no runtime overhead |
| State | Zustand 5 | Minimal boilerplate, works well with localStorage persistence |
| PWA | vite-plugin-pwa | Service worker + manifest generation, offline asset caching |
| Unit tests | Vitest + React Testing Library | Vite-native, fast, compatible with Jest API |
| Integration | Playwright | Cross-browser, iPhone simulator, screenshot support |
| AI testing | Playwright + Claude API | Screenshots fed to claude-sonnet for visual UI verification |

## Module Map

```
src/
├── types/
│   └── index.ts          Core domain types (NoteName, ChordQuality, Question, Answer…)
│
├── theory/               Pure TypeScript — no audio, no React, no side effects
│   ├── notes.ts          Chromatic note list, enharmonic equivalents, semitone math
│   ├── scales.ts         Scale interval patterns, scale construction from root
│   ├── chords.ts         Chord interval patterns, diatonic chord generation
│   └── index.ts          Re-exports
│
├── audio/                All Tone.js interaction lives here
│   ├── engine.ts         Singleton audio engine: init, play chord, play note, play cadence
│   └── index.ts          Re-exports
│
├── exercises/            Exercise orchestration — pure logic, no audio/React
│   ├── generator.ts      Generates Question objects from a session config
│   ├── validator.ts      Validates Answer against Question, returns Result
│   ├── stats.ts          Accumulates and queries session/historical stats
│   └── index.ts          Re-exports
│
├── store/
│   ├── sessionStore.ts   Zustand: current session state (key, tier, questions, score)
│   └── historyStore.ts   Zustand: persisted history across sessions
│
├── components/
│   ├── AudioGate.tsx     Tap-to-start screen (iOS Web Audio requirement)
│   ├── SessionSetup.tsx  Key + tier selection
│   ├── ExerciseScreen.tsx Main exercise UI (orchestrates sub-components)
│   ├── NoteSelector.tsx  Note answer buttons
│   ├── ChordSelector.tsx Chord answer buttons
│   ├── Feedback.tsx      Correct/incorrect display
│   └── StatsScreen.tsx   End-of-session stats
│
└── main.tsx              App entry point
```

## Data Flow

```
SessionSetup
  → creates SessionConfig { key, tier }
  → sessionStore.startSession(config)

ExerciseScreen mounts
  → generator.generateQuestion(config) → Question { chord, note }
  → audioEngine.playQuestion(question)

User selects note + chord → Answer { noteName, chordLabel }
  → validator.validate(question, answer) → Result { correct, correctNote, correctChord }
  → sessionStore.recordResult(result)
  → stats.update(result)
  → show Feedback
  → after 1.5s: next question
```

## Key Type Definitions (summary)

```typescript
// A note pitch class with no octave information
type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

type ChordQuality =
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'major7' | 'dominant7' | 'minor7' | 'halfDiminished7' | 'diminished7'

type Chord = { root: NoteName; quality: ChordQuality }

type Question = { chord: Chord; note: NoteName }

type Answer = { noteName: NoteName; chordLabel: string }

type Result = { correct: boolean; noteCorrect: boolean; chordCorrect: boolean; question: Question }
```

## PWA / Offline Strategy

- All JS/CSS/HTML bundled and cached by the service worker at install time
- Tone.js synthesis is fully in-browser — no audio files fetched
- Stats persisted to localStorage (synced by Zustand persist middleware)
- No network requests during normal use

## Path Aliases

`@/` maps to `src/` throughout. Use `@/theory`, `@/audio`, etc.
