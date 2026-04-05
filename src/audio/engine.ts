import * as Tone from 'tone'

import type { Chord, NoteName } from '@/types'
import { chordNotes } from '@/theory'
import { semitoneOf } from '@/theory/notes'

// 150 ms — enough headroom for context to resume if it was briefly suspended
const LOOKAHEAD = 0.15

let synth: Tone.PolySynth | null = null
let initialised = false

function toToneNote(note: NoteName, baseOctave: number, rootNote?: NoteName): string {
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
 * Must be called from a user gesture (tap/click) before any audio plays.
 * Starts the Web Audio context — required by iOS Safari.
 */
export async function initAudio(): Promise<void> {
  if (initialised) return
  await Tone.start()
  if (Tone.context.state !== 'running') {
    await Tone.context.resume()
  }
  // Warm up: create the synth and pre-allocate a voice on the user gesture
  // so iOS doesn't block node creation on the first real play call.
  const s = getSynth()
  s.triggerAttackRelease('C4', 0.001, Tone.now() + LOOKAHEAD)
  initialised = true
  console.info('[audio] ready, context:', Tone.context.state)
}

export function isAudioInitialised(): boolean {
  return initialised
}

export function getContextState(): string {
  return Tone.context.state
}

/**
 * Plays the tonic chord arpeggiated to establish key context.
 * Must be called directly from a user gesture handler (button click/tap).
 */
export function playTonicCadence(keyRoot: NoteName): void {
  // If context was briefly suspended (e.g. tab backgrounded), kick it back.
  // fire-and-forget: notes are scheduled with LOOKAHEAD so they land after resume.
  if (Tone.context.state !== 'running') {
    void Tone.context.resume()
  }
  try {
    const tonicChord: Chord = { root: keyRoot, quality: 'major' }
    const notes = chordNotes(tonicChord)
    const s = getSynth()
    const start = Tone.now() + LOOKAHEAD
    notes.forEach((note, i) => {
      s.triggerAttackRelease(toToneNote(note, 3, keyRoot), '2n', start + i * 0.18)
    })
    console.info('[audio] playTonicCadence', keyRoot)
  } catch (err) {
    console.error('[audio] playTonicCadence failed:', err)
  }
}

/**
 * Plays a chord then a melody note over it.
 * Must be called directly from a user gesture handler (button click/tap).
 */
export function playQuestion(
  chord: Chord,
  note: NoteName,
  onDone?: () => void,
): void {
  if (Tone.context.state !== 'running') {
    void Tone.context.resume()
  }
  try {
    const s = getSynth()
    const toneNotes = chordNotes(chord).map((n) => toToneNote(n, 4, chord.root))
    const melodyNote = toToneNote(note, 5)

    const start = Tone.now() + LOOKAHEAD
    const chordDuration = 1.5
    const pause = 0.35
    const noteDuration = 1.5

    s.triggerAttackRelease(toneNotes, chordDuration, start)
    s.triggerAttackRelease(melodyNote, noteDuration, start + chordDuration + pause)
    console.info('[audio] playQuestion chord:', toneNotes, 'note:', melodyNote)

    if (onDone) {
      setTimeout(onDone, (chordDuration + pause + noteDuration) * 1000)
    }
  } catch (err) {
    console.error('[audio] playQuestion failed:', err)
  }
}

export function replayQuestion(chord: Chord, note: NoteName): void {
  playQuestion(chord, note)
}
