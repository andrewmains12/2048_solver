import type { NoteName } from '@/types'

/** All 12 chromatic pitch classes in sharp notation, index = semitone offset from C */
export const CHROMATIC_NOTES: readonly NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
]

/** Enharmonic flat spellings mapped to their sharp equivalent */
const FLAT_TO_SHARP: Record<string, NoteName> = {
  Db: 'C#', Eb: 'D#', Fb: 'E', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B',
}

/** Canonical sharp display names for each sharp note by key signature context.
 *  Keys with flats prefer flat spelling for relevant notes. */
const FLAT_KEY_ROOTS: readonly NoteName[] = ['F', 'A#', 'D#', 'G#', 'C#']

/** Returns the semitone index (0–11) of a note name. */
export function semitoneOf(note: NoteName): number {
  return CHROMATIC_NOTES.indexOf(note)
}

/**
 * Transposes a note by `semitones` half steps (wraps within octave).
 * Always returns sharp notation.
 */
export function transposeNote(note: NoteName, semitones: number): NoteName {
  const idx = (semitoneOf(note) + semitones + 12) % 12
  return CHROMATIC_NOTES[idx]
}

/**
 * Normalises an input note string to a canonical NoteName.
 * Accepts flat spellings (e.g. "Bb" → "A#").
 * Throws if unrecognised.
 */
export function normaliseNote(input: string): NoteName {
  if (CHROMATIC_NOTES.includes(input as NoteName)) return input as NoteName
  const sharp = FLAT_TO_SHARP[input]
  if (sharp) return sharp
  throw new Error(`Unrecognised note: ${input}`)
}

/**
 * Returns the preferred display name for a note in a given key context.
 * Keys with flats will display e.g. "Bb" instead of "A#".
 */
export function displayNote(note: NoteName, keyRoot: NoteName): string {
  if (!FLAT_KEY_ROOTS.includes(keyRoot)) return note
  const flatMap: Partial<Record<NoteName, string>> = {
    'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  }
  return flatMap[note] ?? note
}
