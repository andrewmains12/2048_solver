# Style Guide and Best Practices

This document is authoritative. Follow it when writing new code or reviewing existing code.

---

## 1. TypeScript Conventions

### Strict mode

The project runs with `strict: true`. All strict-mode implications (no implicit `any`, strict null checks, etc.) are in force and are not repeated here.

### `type` vs `interface`

Use `type` for domain types and unions. Use `interface` only for React prop shapes (this is the one place interfaces remain idiomatic because they produce better error messages from React).

```typescript
// domain types — use type
type ChordQuality = 'major' | 'minor' | 'dominant7' // ...

type Chord = { root: NoteName; quality: ChordQuality }

// component props — use interface
interface Props {
  chords: Chord[]
  selected: ChordLabel | null
  onSelect: (label: ChordLabel) => void
  disabled?: boolean
}
```

All shared domain types live in `src/types/index.ts`. Do not redeclare domain shapes inside modules.

### `satisfies`

Use `satisfies` when building a value that must conform to a type but where you want the narrowest inferred type preserved. The canonical example in this project is inline record entries within `applyResult` in `src/exercises/stats.ts`:

```typescript
{
  noteName: note,
  attempts: prevNote.attempts + 1,
  correct: prevNote.correct + (result.noteCorrect ? 1 : 0),
} satisfies SessionStats['noteStats'][NoteName]
```

Do not use `satisfies` as a substitute for a proper type annotation on a variable declaration; only use it where you need simultaneous narrowing and conformance checking.

### Avoiding `any`

Never use `any`. If you are consuming an untyped external API response, use `unknown` and narrow it with a type guard or `zod` parse before use.

### Return type annotations

Annotate return types on all exported functions. Omit them on trivially-obvious internal helpers where the return type is a primitive inferred from a single literal. The theory and exercise modules demonstrate this — see `src/theory/scales.ts` (`buildScale`, `isDiatonic`, `scaleDegree`) and `src/theory/chords.ts` (`chordNotes`, `chordLabel`, `diatonicChords`).

### Readonly arrays

Mark constant interval and quality tables as `readonly`. See `CHORD_INTERVALS` in `src/theory/chords.ts`:

```typescript
export const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = { ... }
```

---

## 2. Module Structure

```
src/
  types/       Shared TypeScript types only — no logic
  theory/      Pure TS music theory — no audio, no React, no side effects
  exercises/   Exercise logic — pure functions, no audio, no React
  audio/       All Tone.js interaction — engine.ts is the only entry point
  store/       Zustand slices
  components/  React components only
```

### Pure functions in `theory/` and `exercises/`

Every function in `src/theory/` and `src/exercises/` must be a pure function: same inputs always produce the same outputs, no side effects, no I/O, no imports from `audio/`, `store/`, or `components/`. This is what makes them trivially testable.

If you find yourself needing to import from `@/audio` or calling `useSessionStore` inside `exercises/`, you are in the wrong module.

### `audio/`

All Tone.js calls go through `src/audio/engine.ts`. No other file may import from `tone` directly. See the audio section below.

### `store/`

Zustand slices for session and history state. Slices may import from `theory/` and `exercises/` but not from `components/` or `audio/`.

### `types/`

Types only. No functions, no constants.

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Source files | kebab-case | `chord-utils.ts`, `exercise-screen.tsx` |
| Components | PascalCase (file and export) | `ExerciseScreen.tsx`, `export function ExerciseScreen` |
| Functions | camelCase | `buildScale`, `validateAnswer` |
| Types and interfaces | PascalCase | `ChordQuality`, `SessionStats`, `Props` |
| Constants (module-level) | SCREAMING_SNAKE_CASE | `CHORD_INTERVALS`, `FEEDBACK_DURATION_MS` |
| Test files | `*.test.ts` co-located | `src/theory/chords.test.ts` |
| Integration tests | `*.spec.ts` in `tests/integration/` | `tests/integration/exercise-flow.spec.ts` |

Component prop interfaces are always named `Props` (not `ChordSelectorProps`). The component name already provides the namespace.

---

## 4. React Conventions

### Functional components only

No class components.

### Prop interfaces

Name the interface `Props`, defined inline at the top of the file, before the component. See `src/components/ChordSelector.tsx`.

### `useCallback` and `useMemo`

Use `useCallback` for handlers passed as props to child components and for handlers listed in `useEffect` dependency arrays. See `handleSubmit` in `src/components/ExerciseScreen.tsx`.

Use `useMemo` for derived values that are expensive to compute. Do not use it for simple derivations that TypeScript can trivially evaluate — the cost of memoisation must exceed the cost of recomputation.

Do not add `useCallback` or `useMemo` speculatively. Add them when you have a clear dependency-stability or performance reason.

### No Tone.js in components

Components call the audio engine through the wrapper functions exported from `src/audio/`. They never import `tone` directly. `ExerciseScreen.tsx` demonstrates the correct pattern:

```typescript
import { playQuestion, replayQuestion } from '@/audio'
// ...
playQuestion(currentQuestion.chord, currentQuestion.note)
```

### Local vs store state

UI-only ephemeral state (selected value, awaiting flag, last result) lives in component-local `useState`. Domain data (session config, question history, score, persisted stats) lives exclusively in Zustand stores. Never mirror domain data from a store into local state.

---

## 5. Testing Conventions

The full testing strategy is in `docs/testing.md`. The rules below are the binding subset.

### Keep tests DRY — use factory functions

Factor shared setup into factory functions, not top-level variables. Factory functions ensure each test gets a fresh value with no shared mutable state.

```typescript
// BAD — top-level variable; shared across tests
const stats = createSessionStats()

// GOOD — factory function; fresh value per call
const freshStats = () => createSessionStats()
```

The test files `src/theory/scales.test.ts`, `src/theory/chords.test.ts`, and `src/exercises/stats.test.ts` all demonstrate this pattern.

### Strong assertions — assert the full return value

Use `toEqual` on the entire return value. Do not cherry-pick individual properties unless the function returns a large structure and only one field is relevant to the specific test case.

```typescript
// BAD
expect(chord.root).toBe('G')
expect(chord.quality).toBe('dominant7')

// GOOD
expect(chord).toEqual({ root: 'G', quality: 'dominant7' })
```

### Parameterized tests with `it.each`

Use `it.each` for exhaustive coverage over a range of inputs. See `src/theory/chords.test.ts` (`chordNotes`, `chordLabel`) and `src/theory/scales.test.ts` (`buildScale`):

```typescript
it.each([
  [chord('C', 'major'),     ['C','E','G']],
  [chord('G', 'dominant7'), ['G','B','D','F']],
] as const)('%o → %j', (c, expected) => {
  expect(chordNotes(c)).toEqual(expected)
})
```

### No "does not throw" tests

`expect(() => fn()).not.toThrow()` is not a meaningful assertion. Test what the function returns instead.

### Test file location

Unit tests are co-located with their source file: `src/theory/chords.ts` is tested by `src/theory/chords.test.ts`. Integration tests (Playwright) live in `tests/integration/`.

---

## 6. State Management

### Zustand slice conventions

Each Zustand slice has its own file in `src/store/`. Each slice exports a single `use*Store` hook. Store files may import from `@/theory` and `@/exercises` but not from `@/audio` or `@/components`.

### No component-local state for domain data

Session config, the current question, score, and persisted history are domain data. They live in Zustand. Components read them via `useSessionStore` or `useHistoryStore`. If you are reaching for `useState` to hold a `Question` or `SessionConfig`, put it in the store instead.

---

## 7. Audio

All Tone.js interaction lives in `src/audio/engine.ts`. This is a hard boundary.

- No file outside `src/audio/` may import from `tone`.
- `engine.ts` exports plain async functions: `init`, `playQuestion`, `replayQuestion`, `playNote`, `playChord`, `playCadence`.
- Components call the exported wrapper functions from `@/audio` (which re-exports from `engine.ts`).
- In unit tests, Tone.js is stubbed via `src/test-setup.ts`. In integration tests, the audio engine module is mocked entirely.

---

## 8. `data-testid`

Every interactive element (button, input, selector group) and every major structural region must carry a `data-testid`. Integration tests and AI visual verification depend on them.

### Naming convention

`data-testid` values use kebab-case. For container elements, the value matches the component name lowercased: `exercise-screen`, `chord-selector`. For individual interactive elements, prefix with the component name: `chord-btn-{label}`, `submit-btn`, `replay-btn`, `end-session-btn`.

```tsx
// Container
<div data-testid="chord-selector">

// Individual button, parameterised by content
<button data-testid={`chord-btn-${label}`}>

// Named action buttons
<button data-testid="submit-btn">
<button data-testid="replay-btn">
<button data-testid="end-session-btn">
```

See `src/components/ChordSelector.tsx` and `src/components/ExerciseScreen.tsx` for working examples.

---

## 9. Error Handling

### Validate at boundaries only

Validate external inputs (user answers, URL params, localStorage reads) at the point they enter the system. Do not defensively guard against impossible states inside pure functions.

### No error handling for impossible cases

If a code path cannot be reached given the type system, do not add a runtime guard or `throw` for it. The type system is the documentation. Adding `if (x === undefined) throw` for a value typed as non-optional creates noise and implies the type is wrong.

If you genuinely need a runtime invariant check, use an assertion function rather than scattering `if/throw` inline:

```typescript
function assertDefined<T>(value: T | undefined, msg: string): asserts value is T {
  if (value === undefined) throw new Error(msg)
}
```

Call it once at the boundary, then work with the narrowed type downstream.

---

## 10. Code Style

### Immutability

Prefer immutable updates. Never mutate an argument or module-level object. `applyResult` in `src/exercises/stats.ts` is the canonical example — it spreads the previous stats into a new object rather than mutating in place.

The immutability test in `src/exercises/stats.test.ts` makes this expectation explicit:

```typescript
it('is immutable — does not mutate the input stats object', () => {
  const original = createSessionStats()
  applyResult(original, correctResult())
  expect(original).toEqual(createSessionStats())
})
```

### `const` preference

Use `const` by default. Use `let` only when reassignment is unavoidable (e.g., accumulating results in a loop). Never use `var`.

### Import ordering

1. External packages (`react`, `tone`, `zustand`)
2. Internal path-alias imports (`@/types`, `@/theory`, `@/audio`, `@/store`)
3. Relative imports (`./notes`, `../components/Feedback`)

Separate each group with a blank line. Use `import type` for type-only imports.

```typescript
import { useEffect, useState, useCallback } from 'react'

import type { ChordLabel, NoteName, Result } from '@/types'
import { buildScale, diatonicChords } from '@/theory'
import { playQuestion, replayQuestion } from '@/audio'
import { validateAnswer } from '@/exercises'
import { useSessionStore } from '@/store/sessionStore'

import { NoteSelector } from './NoteSelector'
import { ChordSelector } from './ChordSelector'
import { Feedback } from './Feedback'
```

See `src/components/ExerciseScreen.tsx` for this pattern in practice.

### No inline magic values

Extract magic numbers and durations to named constants at the top of the file:

```typescript
const FEEDBACK_DURATION_MS = 1800
```
