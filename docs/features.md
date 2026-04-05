# Feature Specification

## Core Exercise: Note + Chord Identification

The primary exercise trains the user to identify both a diatonic chord and a melody note played over it, in the context of an established key.

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

Identification is **absolute** (real note/chord names), not Roman numeral / scale degree. Relative degree training is a planned future tier.

---

## Difficulty Tiers

### Tier 1 — Triads, Diatonic Notes
- Chords: 7 diatonic triads (I, ii, iii, IV, V, vi, vii°)
- Notes: 7 diatonic notes of the key only
- No chord extensions

### Tier 2 — Seventh Chords
- Adds diatonic 7th chords (IΔ7, ii7, iii7, IVΔ7, V7, vi7, viiø7)
- Notes remain diatonic (7 notes)

### Tier 3 — Chromatic Notes (future)
- All 12 chromatic pitch classes available as note answers
- Useful for passing tones, borrowed chords, blues inflections

---

## Session Configuration

- **Key selection** — User picks the key for the session (any of 12 major keys; minor keys future)
- **Tier selection** — Choose difficulty tier before starting
- **Question count** — Optional: end session after N questions, or free-running

---

## Stats and Progress

- Accuracy per note (e.g. "F: 60% correct")
- Accuracy per chord (e.g. "iii: 45% correct")
- Session history: date, key, tier, score
- Stored offline in localStorage / IndexedDB

---

## Audio

- Pure synthesis via Tone.js (Web Audio API) — no audio files, fully offline
- Tonic chord: arpeggiated to clearly establish key
- Exercise chord: block chord (all notes at once)
- Melody note: single tone, slightly higher octave for clarity
- Tempo: configurable (default 72 BPM)
- Instrument: piano-like synth (PolySynth)
- Replay button: re-plays the chord + note without generating a new question

---

## Planned / Future Features

- **Relative degree mode** — Show scale degree (1–7 / do–ti) instead of absolute names
- **Minor keys** — Natural, harmonic, melodic minor scale options
- **Chord progressions** — Hear a 2–4 chord sequence before the melody note (harder)
- **Intervals** — Classic GNU Solfege-style interval recognition
- **Chord only** — Identify chord without a melody note (simpler warmup)
- **Note only** — Identify note in key context without a chord (simpler warmup)
