import * as Tone from 'tone'

import type { Chord, NoteName } from '@/types'
import { chordNotes } from '@/theory'
import { semitoneOf } from '@/theory/notes'

const LOOKAHEAD = 0.05

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

/** Ensures the audio context is running. Safe to call before any playback. */
async function ensureRunning(): Promise<void> {
  if (Tone.context.state !== 'running') {
    console.warn('[audio] context state:', Tone.context.state, '— resuming')
    await Tone.context.resume()
  }
}

export async function initAudio(): Promise<void> {
  if (initialised) return
  await Tone.start()
  await ensureRunning()
  // Warm up the audio graph on the user gesture so iOS doesn't suspend it
  const s = getSynth()
  s.triggerAttackRelease('C4', 0.001, Tone.now())
  initialised = true
  console.info('[audio] initialised, context state:', Tone.context.state)
}

export function isAudioInitialised(): boolean {
  return initialised
}

export function getContextState(): string {
  return Tone.context.state
}

export function playTonicCadence(keyRoot: NoteName): void {
  void (async () => {
    try {
      await ensureRunning()
      const tonicChord: Chord = { root: keyRoot, quality: 'major' }
      const notes = chordNotes(tonicChord)
      const s = getSynth()
      const start = Tone.now() + LOOKAHEAD
      notes.forEach((note, i) => {
        s.triggerAttackRelease(toToneNote(note, 3, keyRoot), '2n', start + i * 0.18)
      })
      console.info('[audio] playTonicCadence', keyRoot, 'at', start)
    } catch (err) {
      console.error('[audio] playTonicCadence failed:', err)
    }
  })()
}

export function playQuestion(
  chord: Chord,
  note: NoteName,
  onDone?: () => void,
): void {
  void (async () => {
    try {
      await ensureRunning()
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
      console.info('[audio] playQuestion chord:', toneNotes, 'note:', melodyNote, 'at', start)

      if (onDone) {
        setTimeout(onDone, (chordDuration + pause + noteDuration) * 1000)
      }
    } catch (err) {
      console.error('[audio] playQuestion failed:', err)
    }
  })()
}

export function replayQuestion(chord: Chord, note: NoteName): void {
  playQuestion(chord, note)
}
