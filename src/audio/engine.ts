import * as Tone from 'tone'

import type { Chord, NoteName } from '@/types'
import { chordNotes } from '@/theory'

type Octave = 2 | 3 | 4 | 5 | 6

/** Tone.js note string, e.g. "C4", "G#5" */
type ToneNote = string

let synth: Tone.PolySynth | null = null
let initialised = false

function toToneNote(note: NoteName, octave: Octave): ToneNote {
  return `${note}${octave}`
}

function getSynth(): Tone.PolySynth {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.AMSynth).toDestination()
    synth.set({
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1.2 },
    })
    Tone.getDestination().volume.value = -6
  }
  return synth
}

/**
 * Must be called on a user gesture (tap/click) before any audio plays.
 * Satisfies iOS Safari Web Audio policy.
 */
export async function initAudio(): Promise<void> {
  if (initialised) return
  await Tone.start()
  initialised = true
}

export function isAudioInitialised(): boolean {
  return initialised
}

/**
 * Plays the tonic chord arpeggiated to establish key context.
 * Notes staggered 150 ms apart.
 */
export function playTonicCadence(keyRoot: NoteName): void {
  const tonicChord: Chord = { root: keyRoot, quality: 'major' }
  const notes = chordNotes(tonicChord)
  const s = getSynth()
  const now = Tone.now()
  notes.forEach((note, i) => {
    s.triggerAttackRelease(toToneNote(note, 4), '2n', now + i * 0.15)
  })
}

/**
 * Plays a chord as a block (all notes simultaneously), then after a short
 * pause plays a single melody note above.
 *
 * @param chord   The diatonic chord to play
 * @param note    The melody note to play over the chord
 * @param onDone  Called when the full sequence has finished
 */
export function playQuestion(
  chord: Chord,
  note: NoteName,
  onDone?: () => void,
): void {
  const s = getSynth()
  const notes = chordNotes(chord)
  const toneNotes = notes.map((n) => toToneNote(n, 4))
  const melodyNote = toToneNote(note, 5)

  const now = Tone.now()
  const chordDuration = 1.5
  const pause = 0.3
  const noteDuration = 1.5

  // Block chord
  s.triggerAttackRelease(toneNotes, chordDuration, now)

  // Melody note after pause
  const noteStart = now + chordDuration + pause
  s.triggerAttackRelease(melodyNote, noteDuration, noteStart)

  if (onDone) {
    const totalDuration = (chordDuration + pause + noteDuration) * 1000
    setTimeout(onDone, totalDuration)
  }
}

/**
 * Re-plays the chord + note without changing question state.
 */
export function replayQuestion(chord: Chord, note: NoteName): void {
  playQuestion(chord, note)
}
