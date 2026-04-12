# Voice Input Mode

Allows users to speak their note + chord answer instead of tapping buttons.
Targets iOS Safari 14.5+ (`webkitSpeechRecognition`) and Chrome.

## Shipped

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

---

## Known Issues

### Answer stickiness — parser receives full accumulated transcript

**Symptom:** Once an answer is spoken, saying a different answer doesn't update the
selection. "D major [pause] C major" fails to register "C major".

**Root cause:** The parser is called with `accumulatedRef.current` (the full
concatenated transcript) rather than just `newFinals` (the latest breath group). The
parser sees `"D major C major"`, matches `"D major"` first, finds D major isn't in the
key, returns `{}`, and never reaches `"C major"`.

**Fix — one line in `useSpeechRecognition.ts`:**
```ts
// Before — full accumulated text causes stickiness
onTranscriptRef.current(accumulatedRef.current.trim())

// After — each breath group parsed independently
onTranscriptRef.current(newFinals.trim())
```
`accumulatedRef` stays as-is for the display transcript. Single-breath `NOTE QUALITY NOTE`
phrases ("G seven B") are unaffected — they arrive as one final segment.

### Unrecognised input gives no feedback

When a phrase yields `{}` (chord not in key, unknown quality, etc.) the previously-set
answer sticks silently. Consider a brief "?" indicator or shake on the transcript line.

---

## TODO

### P0 — Fix per-segment parsing (prerequisite for all other improvements)

Apply the one-line fix above; update E2E tests to confirm no regression.

### P1 — Parser edge cases + test coverage

Reason through policy for each case, write tests first, then adjust parser if needed.

| Input | Policy |
|---|---|
| `"D major"` (not in key) | `{}` — silent; optionally surface a "not recognised" hint |
| Long irrelevant monologue | With P0 fix: irrelevant finals yield `{}`; only valid ones update state |
| `"C major D minor"` (two chords, one breath) | First match wins, stops — document and test |
| `"G sev"` (truncated) | `{}` — finals only drive parser; add test to confirm |
| Silence / noise only | `{}` — already correct; add test |
| Repeated same answer | Idempotent re-set — confirm with test |

### P2 — Hands-free: Submit / Next voice commands

Extend the parser (or add a separate action parser) to recognise command words:

| Spoken | Action |
|---|---|
| "submit" / "check" / "done" | `handleSubmit()` |
| "next" / "continue" | `handleNext()` |

Wire into `handleVoiceTranscript` in `ExerciseScreen` after note/chord parsing.
Natural pause before finals reduces false positives.

### P3 — Audio feedback

| Event | Feedback |
|---|---|
| Correct answer submitted | Short ascending tone (e.g. 440 → 880 Hz, 150 ms) |
| Wrong answer submitted | Low descending tone or buzz |
| Voice command recognised | Neutral tick |

Optional: `SpeechSynthesis` for spoken confirmation ("Correct" / "Try again") — no
permission prompt required, available in all major browsers.
