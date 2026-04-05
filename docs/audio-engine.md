# Audio Engine

## Overview

All audio is synthesized in real-time using the Web Audio API via Tone.js. There are no audio files — every chord and note is computed from frequency math. This enables full offline operation.

## iOS Requirement

Safari on iOS (and iPadOS) requires a user gesture before any audio can start. The `AudioGate` component handles this: the app renders a full-screen tap prompt and calls `Tone.start()` on the first tap. Subsequent audio works without further interaction.

## Synthesis Approach

We use Tone.js `PolySynth` with an `AMSynth` voice. This gives a piano-like attack/decay envelope without requiring samples.

```typescript
const synth = new Tone.PolySynth(Tone.AMSynth).toDestination()
synth.set({
  harmonicity: 3.5,
  detune: 0,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1.2 },
  modulation: { type: 'square' },
  modulationEnvelope: { attack: 0.5, decay: 0.01, sustain: 1, release: 0.5 },
})
```

## Note → Frequency Mapping

Tone.js accepts Scientific Pitch Notation strings (`"C4"`, `"G#3"`, etc.). We assign octaves as follows:

- **Tonic / cadence chord**: octave 3–4 (lower, fuller)
- **Exercise chord**: octave 4 (mid range)
- **Melody note**: octave 5 (higher, clearly audible over chord)

## Chord Voicing

Chords are voiced in close position starting from the root in octave 4. For 7th chords the 7th is added on top.

Example — G dominant 7 (G7):
```
G4, B4, D5, F5
```

For the tonic cadence arpeggiation, notes are staggered 150ms apart.

## Playback Sequence

1. **Session start** — tonic chord arpeggiated, tempo 72 BPM equivalent
2. **Each question**:
   a. Exercise chord plays as block chord (all notes simultaneously), duration 1.5s
   b. 300ms pause
   c. Melody note plays, duration 1.5s
3. **Replay** — repeats step 2 only (chord + note, no tonic re-establishment)

## Timing

All timing uses Tone.js Transport scheduling (`Tone.Transport`) to ensure sample-accurate timing regardless of JavaScript event loop jitter.

## Volume

Master volume: −6 dB via `Tone.getDestination().volume.value = -6`.
