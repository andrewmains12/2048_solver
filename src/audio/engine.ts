import * as Tone from 'tone'

import type { Chord, NoteName } from '@/types'
import { chordNotes } from '@/theory'
import { semitoneOf } from '@/theory/notes'

/** Tone.js note string, e.g. "C4", "G#5" */
type ToneNote = string

const LOOKAHEAD = 0.05 // seconds — prevents notes scheduled at Tone.now() from being dropped

let synth: Tone.PolySynth | null = null
let initialised = false

/**
 * Converts a note + base octave to a Tone.js note string, bumping the octave
 * up by 1 if the note's semitone is lower than the root's semitone (so chord
 * tones always sit above the root within the same close-position voicing).
 */
function toToneNote(note: NoteName, baseOctave: number, rootNote?: NoteName): ToneNote {
  if (rootNote !== undefined && semitoneOf(note) < semitoneOf(rootNote)) {
    return `${note}${baseOctave + 1}`
  }
  return `${note}${baseOctave}`
}

function getSynth(): Tone.PolySynth {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.5 },
    }).toDestination()
    Tone.getDestination().volume.value = -8
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
  // Belt-and-suspenders: ensure context is in running state
  if (Tone.context.state !== 'running') {
    await Tone.context.resume()
  }
  initialised = true
}

export function isAudioInitialised(): boolean {
  return initialised
}

/**
 * Plays the tonic chord arpeggiated to establish key context.
 * Notes staggered 150 ms apart, root in octave 3 for a full sound.
 */
export function playTonicCadence(keyRoot: NoteName): void {
  const tonicChord: Chord = { root: keyRoot, quality: 'major' }
  const notes = chordNotes(tonicChord)
  const s = getSynth()
  const start = Tone.now() + LOOKAHEAD
  notes.forEach((note, i) => {
    s.triggerAttackRelease(toToneNote(note, 3, keyRoot), '2n', start + i * 0.18)
  })
}

/**
 * Plays a chord as a block (all notes simultaneously), then after a short
 * pause plays a single melody note above.
 */
export function playQuestion(
  chord: Chord,
  note: NoteName,
  onDone?: () => void,
): void {
  const s = getSynth()
  const notes = chordNotes(chord)
  const toneNotes = notes.map((n) => toToneNote(n, 4, chord.root))
  const melodyNote = toToneNote(note, 5)

  const start = Tone.now() + LOOKAHEAD
  const chordDuration = 1.5
  const pause = 0.35
  const noteDuration = 1.5

  s.triggerAttackRelease(toneNotes, chordDuration, start)
  s.triggerAttackRelease(melodyNote, noteDuration, start + chordDuration + pause)

  if (onDone) {
    setTimeout(onDone, (chordDuration + pause + noteDuration) * 1000)
  }
}

/**
 * Re-plays the chord + note without changing question state.
 */
export function replayQuestion(chord: Chord, note: NoteName): void {
  playQuestion(chord, note)
}
