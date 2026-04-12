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
| **Voice input mode** | In progress — see below |
| Phone install (PWA) | MVP blocker |
| Help / intro screen | MVP blocker |
| Demo bug: plays all at once | MVP blocker |
| All-time score tracking | Wishlist |
| Relative degree mode | Planned |
| Minor keys | Planned |
| Chord progressions | Planned |
| Intervals | Planned |
| Chord / note only modes | Planned |
| Tier 3 — chromatic notes | Planned |

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

## Voice Input Mode

Allows users to speak their note + chord answer instead of tapping buttons.
Targets iOS Safari 14.5+ (`webkitSpeechRecognition`) and Chrome.

### Shipped

- `useSpeechRecognition` hook — continuous recognition, interim results, per-question
  transcript reset, toggle/stop lifecycle, graceful unsupported handling
- `parseVoiceTranscript` parser — note aliases (with enharmonics), quality aliases,
  `NOTE QUALITY`, `NOTE QUALITY NOTE`, and quality-first patterns; availability gating
  so chords not in the current key are silently dropped
- Mic button with four visual states: unsupported (greyed), idle, listening (pulsing), error (red)
- Inline human-readable error messages (mic denied, no microphone, network, no speech)
- Live transcript display for debugging
- 30 unit tests (parser), 12 Playwright E2E tests with mocked Speech API
- WebKit added to CI; `npm run install:browsers` for local setup

### Known Issues

**Answer stickiness — parser receives full accumulated transcript**

Symptom: once an answer is spoken, saying a different answer doesn't update the
selection. "D major [pause] C major" fails to register "C major".

Root cause: the parser is called with `accumulatedRef.current` (the full concatenated
transcript) rather than just `newFinals` (the new breath group). The parser sees
`"D major C major"`, matches `"D major"` first, finds D major isn't in the key, returns
`{}`, and never reaches `"C major"`.

Fix — one line in `useSpeechRecognition.ts`:
```ts
// Before — full accumulated text causes stickiness
onTranscriptRef.current(accumulatedRef.current.trim())

// After — each breath group parsed independently
onTranscriptRef.current(newFinals.trim())
```
`accumulatedRef` stays as-is for the display transcript. Single-breath `NOTE QUALITY NOTE`
phrases ("G seven B") are unaffected — they arrive as one final segment.

**Unrecognised input gives no feedback**

When a phrase yields `{}` (chord not in key, unknown quality, etc.) the previously-set
answer sticks silently. Consider a brief "?" indicator or shake on the transcript line.

### TODO

**P0 — Fix per-segment parsing** (prerequisite for all other improvements)
Apply the one-line fix above; update E2E tests to confirm no regression.

**P1 — Parser edge cases + test coverage**

| Input | Policy |
|---|---|
| `"D major"` (not in key) | `{}` — silent; optionally surface a "not recognised" hint |
| Long irrelevant monologue | With P0 fix: irrelevant finals yield `{}`; only valid ones update state |
| `"C major D minor"` (two chords, one breath) | First match wins, stops — document and test |
| `"G sev"` (truncated) | `{}` — finals only drive parser; add test to confirm |
| Silence / noise only | `{}` — already correct; add test |
| Repeated same answer | Idempotent re-set — confirm with test |

**P2 — Hands-free: Submit / Next voice commands**

| Spoken | Action |
|---|---|
| "submit" / "check" / "done" | `handleSubmit()` |
| "next" / "continue" | `handleNext()` |

Wire into `handleVoiceTranscript` in `ExerciseScreen` after note/chord parsing.
Natural pause before finals reduces false positives.

**P3 — Audio feedback**

| Event | Feedback |
|---|---|
| Correct answer submitted | Short ascending tone (e.g. 440 → 880 Hz, 150 ms) |
| Wrong answer submitted | Low descending tone or buzz |
| Voice command recognised | Neutral tick |

Optional: `SpeechSynthesis` for spoken confirmation ("Correct" / "Try again") — no
permission prompt required, available in all major browsers.

---

## Roadmap — MVP Blockers

Features required before the app is considered ready for regular phone use.

- **Phone install (PWA)** — The "Add to Home Screen" / install-to-phone flow is not working correctly; needs end-to-end testing and any manifest/service-worker fixes required to make it reliable on iOS and Android.
- **Help / intro** — New users have no onboarding. Need some form of first-run intro or persistent help screen explaining the exercise, controls, and scoring.
- **Demo bug: plays all at once** — The demo mode currently triggers all audio simultaneously instead of sequencing questions. Root cause TBD; likely a scheduling/state issue in `DemoMode.tsx`.

---

## Wishlist

Nice-to-have improvements with no fixed milestone.

- ~~**Live score during a round**~~ — Already implemented (`score-counter` in the exercise screen header).
- **All-time score tracking** — Persist session history (date, key, tier, score) across sessions, accessible from a stats/history screen.

---

## Planned / Future Features

- **Relative degree mode** — Show scale degree (1–7 / do–ti) instead of absolute names
- **Minor keys** — Natural, harmonic, melodic minor scale options
- **Chord progressions** — Hear a 2–4 chord sequence before the melody note (harder)
- **Intervals** — Classic GNU Solfege-style interval recognition
- **Chord only** — Identify chord without a melody note (simpler warmup)
- **Note only** — Identify note in key context without a chord (simpler warmup)
