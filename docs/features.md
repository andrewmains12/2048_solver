# Features

## Status Overview

| Feature | Status |
|---|---|
| Core exercise — note + chord identification | Shipped |
| Tier 1 triads + Tier 2 seventh chords | Shipped |
| Key selection (all 12 major keys) | Shipped |
| Pure-synthesis audio via Tone.js | Shipped |
| Replay + tonic cadence playback | Shipped |
| Per-session score counter | Shipped |
| PWA manifest + offline support | Shipped |
| Voice input mode | Shipped (see [docs/voice-mode.md](voice-mode.md)) |
| Practice mode toggle | Shipped |
| PWA phone install flow | [#19](https://github.com/andrewmains12/2048_solver/issues/19) |
| Help / intro screen | [#20](https://github.com/andrewmains12/2048_solver/issues/20) |
| Demo bug: plays all at once | [#21](https://github.com/andrewmains12/2048_solver/issues/21) |
| All-time score tracking | [#22](https://github.com/andrewmains12/2048_solver/issues/22) |
| Relative degree / solfège mode | [#14](https://github.com/andrewmains12/2048_solver/issues/14) |
| Minor keys | [#23](https://github.com/andrewmains12/2048_solver/issues/23) |
| Chord progressions mode | [#13](https://github.com/andrewmains12/2048_solver/issues/13) |
| Chord inversions (playback) | [#12](https://github.com/andrewmains12/2048_solver/issues/12) |
| Interval recognition | [#24](https://github.com/andrewmains12/2048_solver/issues/24) |
| Chord-only / note-only modes | [#25](https://github.com/andrewmains12/2048_solver/issues/25) |
| Tier 3 — chromatic notes | [#26](https://github.com/andrewmains12/2048_solver/issues/26) |

---

## Core Exercise: Note + Chord Identification

The primary exercise trains the user to identify both a diatonic chord and a melody
note played over it, in the context of an established key.

### Exercise Flow

1. **Key establishment** — A tonic chord (I) plays at the start of a session. The key remains fixed for the entire session.
2. **Chord prompt** — A diatonic chord within the key plays (e.g. G major = V in C major).
3. **Note prompt** — A single note plays over that chord.
4. **User answers** — Identifies the **note name** (e.g. "B") and the **chord** (e.g. "G7").
5. **Feedback** — Correct/incorrect shown immediately. Wrong answers show the correct answer.
6. **Next question** — New chord + note, same key.

### What the User Identifies

| Component | Examples | Display |
|---|---|---|
| Note name | C, D, E, F, G, A, B | Button grid of diatonic notes in key |
| Chord | G major, Dm, FΔ7, G7 | Button grid of diatonic chords |

Identification is **absolute** (real note/chord names), not Roman numeral / scale degree. Relative degree training is tracked in [#14](https://github.com/andrewmains12/2048_solver/issues/14).

---

## Difficulty Tiers

### Tier 1 — Triads, Diatonic Notes
- Chords: 7 diatonic triads (I, ii, iii, IV, V, vi, vii°)
- Notes: 7 diatonic notes of the key only
- No chord extensions

### Tier 2 — Seventh Chords
- Adds diatonic 7th chords (IΔ7, ii7, iii7, IVΔ7, V7, vi7, viiø7)
- Notes remain diatonic (7 notes)

### Tier 3 — Chromatic Notes
Tracked in [#26](https://github.com/andrewmains12/2048_solver/issues/26).

---

## Session Configuration

- **Key selection** — User picks the key for the session (any of 12 major keys; minor keys tracked in [#23](https://github.com/andrewmains12/2048_solver/issues/23))
- **Tier selection** — Choose difficulty tier before starting
- **Question count** — Optional: end session after N questions, or free-running

---

## Stats and Progress

- Accuracy per note (e.g. "F: 60% correct")
- Accuracy per chord (e.g. "iii: 45% correct")
- Session history: date, key, tier, score
- Stored offline in localStorage / IndexedDB

All-time cross-session persistence tracked in [#22](https://github.com/andrewmains12/2048_solver/issues/22).

---

## Audio

- Pure synthesis via Tone.js (Web Audio API) — no audio files, fully offline
- Tonic chord: arpeggiated to clearly establish key
- Exercise chord: block chord (all notes at once)
- Melody note: single tone, slightly higher octave for clarity
- Tempo: configurable (default 72 BPM)
- Instrument: piano-like synth (PolySynth)
- Replay button: re-plays the chord + note without generating a new question

Chord inversion playback tracked in [#12](https://github.com/andrewmains12/2048_solver/issues/12).

---

## Practice Mode Toggle

A toggle on the exercise screen that switches the session into a no-stakes practice mode.

- **Button placement** — A dedicated row between the playback controls and the chord selector (Option C from design). Renders as a subtle pill when off; expands to an amber banner when on.
- **Audio preview** — In practice mode, tapping a chord or note button plays that option (`playChordPreview` / `playNotePreview` in `src/audio/engine.ts`), letting the user audition each choice by ear before committing.
- **Score isolation** — `recordResult` is skipped while the toggle is on. The score counter stays frozen for the duration of practice. Toggling back to normal resumes counting.
- **Feedback still shows** — The "Check (no score)" button (renamed from "Submit") still validates the answer and shows correct/incorrect feedback, so the user can self-assess without pressure.
- **State scope** — Local React state in `ExerciseScreen`; resets when the session ends.

---

## Voice Input Mode

Speak note + chord answers instead of tapping. Targets iOS Safari 14.5+ and Chrome.
See [`docs/voice-mode.md`](voice-mode.md) for the shipped implementation, known issues, and open TODOs ([#15](https://github.com/andrewmains12/2048_solver/issues/15) [#16](https://github.com/andrewmains12/2048_solver/issues/16) [#17](https://github.com/andrewmains12/2048_solver/issues/17) [#18](https://github.com/andrewmains12/2048_solver/issues/18)).
