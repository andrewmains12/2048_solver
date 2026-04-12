# Voice Input Mode

Allows users to speak their note + chord answer instead of tapping buttons.
Targets iOS Safari 14.5+ (`webkitSpeechRecognition`) and Chrome.

## Shipped

### Infrastructure
- `useSpeechRecognition` hook (`src/hooks/useSpeechRecognition.ts`)
  - Continuous recognition (`continuous: true`) so a pause mid-answer doesn't abort
  - Interim results (`interimResults: true`) for live word-by-word transcript display
  - `event.resultIndex`-based accumulation — only new segments processed per event
  - Per-question transcript reset via `reset()` (called from `ExerciseScreen` on question change)
  - Unsupported environments (`state: 'unsupported'`) handled gracefully
  - `toggle()` starts/stops recognition; cleanup on unmount

- `parseVoiceTranscript` parser (`src/lib/voiceParser.ts`)
  - Note aliases: natural letters + enharmonic sharps/flats (e.g. "E flat" → D#)
  - Quality aliases: major, minor, diminished, half-diminished, dominant 7th, major 7th, minor 7th, augmented — including alternate spoken forms ("dominant seventh", "half dim", etc.)
  - Patterns: `NOTE QUALITY`, `NOTE QUALITY NOTE` (chord + trailing melody note), `QUALITY NOTE` (quality-first)
  - Availability gating: chord label only returned if in `availableChordLabels` for the current exercise
  - `NOTE QUALITY` alone fills chord only — note stays empty until explicitly spoken

### UI
- Mic button in the playback controls row with four visual states: unsupported (greyed), idle, listening (pulsing), error (red)
- Inline human-readable error messages (mic denied, no microphone, network error, no speech)
- Live transcript display below controls (monospace, dimmed) for debugging

### Tests
- 30 unit tests covering all parser paths (`src/lib/voiceParser.test.ts`)
- 12 Playwright E2E tests with a `MockSpeechRecognition` injected via `page.addInitScript()`
  (`tests/integration/voice-mode.spec.ts`)
- WebKit added to CI (`deploy.yml`) + `npm run install:browsers` script for local setup

---

## Known Issues

### 1. Answer stickiness — parser receives full accumulated transcript

**Symptom:** Once an answer is spoken, saying a different answer doesn't update the
selection. "D major [pause] C major" fails to register "C major".

**Root cause:** `onTranscriptRef.current` is called with `accumulatedRef.current`
(the full concatenated transcript) rather than just the new segment. The parser
receives `"D major C major"`, matches `"D major"` at the start, and returns `{}`
because D major isn't in the key — the "C major" suffix is never reached.

**Fix (one line in `useSpeechRecognition.ts:138`):**
```ts
// Before — full accumulated text, causes stickiness
onTranscriptRef.current(accumulatedRef.current.trim())

// After — only the new breath group, each segment parsed independently
onTranscriptRef.current(newFinals.trim())
```
`accumulatedRef` stays as-is for the display transcript; parsing becomes per-segment.
The `NOTE QUALITY NOTE` single-breath pattern ("G seven B") still works because that
whole phrase arrives as one final segment.

### 2. Unrecognized input isn't fully silent

**Symptom:** Speaking a chord quality that exists but isn't in the current key (e.g.
"D major" in C major, where only `Dm` is diatonic) returns `{}` — nothing is set —
but previously-set answers remain. There's no indication to the user that the phrase
wasn't understood.

**Possible fix:** Show a brief "?" or shake animation on the transcript line when the
parser returns `{}` for a non-empty input, so the user knows to re-speak.

---

## TODO

### P0 — Fix per-segment parsing (prerequisite for everything else)

See Known Issue #1 above. One-line fix + update the E2E tests that currently pass
a single final result (they'll continue to pass; confirm no regression).

### P1 — Parser edge cases and test coverage

Reason through policy for each case, write tests first, then adjust parser if needed.

| Input | Current behaviour | Desired behaviour |
|---|---|---|
| `"D major"` (not in key) | `{}` — silent | Silent is fine; maybe add "not recognised" UI hint |
| Long irrelevant monologue before answer | Cumulative parse breaks | With per-segment fix: irrelevant segments yield `{}`; only valid ones set state |
| `"C major D minor"` (two chords, one breath) | First note match wins, stops | Document "first wins" as the policy; add test |
| `"G sev"` (truncated) | `{}` — no quality match | Correct — finals only; add test to confirm |
| `"submit"` / `"next"` | Unrecognised | See P2 below |
| Silence / noise only | `{}` | Correct; add test |
| Repeated same answer | Idempotent re-set | Should be fine; confirm with test |

### P2 — Hands-free flow: Submit / Next voice commands

Extend the parser (or add a separate action parser) to recognise command words:

| Spoken | Action |
|---|---|
| "submit" / "check" / "done" | `handleSubmit()` |
| "next" / "continue" | `handleNext()` |

Wire into `handleVoiceTranscript` in `ExerciseScreen` after checking for note/chord.
Consider requiring a short silence before acting (already natural with continuous
mode — finals only fire after a pause) to reduce false positives.

### P3 — Audio feedback

At minimum, play a tone on submit so the user knows the answer was registered
(important for hands-free use where they can't look at the screen).

| Event | Feedback |
|---|---|
| Answer submitted — correct | Short ascending tone (e.g. 440 → 880 Hz, 150 ms) |
| Answer submitted — wrong | Low descending tone or buzz |
| Voice command recognised | Neutral click / tick |

Optionally: `SpeechSynthesis` for spoken confirmation ("Correct" / "Try again").
That API requires no permission prompt and is available in all major browsers.
