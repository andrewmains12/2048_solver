import type { Chord, ChordLabel, ChordQuality, NoteName, Scale, Tier } from '@/types'

import { transposeNote } from './notes'

/** Semitone intervals from root for each chord quality */
export const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = {
  major:            [0, 4, 7],
  minor:            [0, 3, 7],
  diminished:       [0, 3, 6],
  augmented:        [0, 4, 8],
  major7:           [0, 4, 7, 11],
  dominant7:        [0, 4, 7, 10],
  minor7:           [0, 3, 7, 10],
  halfDiminished7:  [0, 3, 6, 10],
  diminished7:      [0, 3, 6, 9],
}

/**
 * Diatonic chord qualities by scale degree (1–7) for a major scale.
 * Index 0 = scale degree 1 (tonic), etc.
 */
const MAJOR_SCALE_TRIADS: readonly ChordQuality[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished',
]

const MAJOR_SCALE_SEVENTH_CHORDS: readonly ChordQuality[] = [
  'major7', 'minor7', 'minor7', 'major7', 'dominant7', 'minor7', 'halfDiminished7',
]

/**
 * Returns the note names that make up a chord voicing.
 */
export function chordNotes(chord: Chord): NoteName[] {
  return CHORD_INTERVALS[chord.quality].map((semitones) =>
    transposeNote(chord.root, semitones),
  )
}

/**
 * Returns a human-readable label for a chord.
 * @example chordLabel({ root: 'G', quality: 'dominant7' }) → "G7"
 */
export function chordLabel(chord: Chord): ChordLabel {
  const suffixes: Record<ChordQuality, string> = {
    major:           '',
    minor:           'm',
    diminished:      '°',
    augmented:       '+',
    major7:          'Δ7',
    dominant7:       '7',
    minor7:          'm7',
    halfDiminished7: 'ø7',
    diminished7:     '°7',
  }
  return `${chord.root}${suffixes[chord.quality]}`
}

/**
 * Parses a chord label back into a Chord. Used in answer validation.
 * Returns null if the label is not recognised.
 */
export function parseChordLabel(label: ChordLabel, candidates: Chord[]): Chord | null {
  return candidates.find((c) => chordLabel(c) === label) ?? null
}

/**
 * Returns all diatonic chords for a given scale and tier.
 * Tier 1 → triads; Tier 2 → seventh chords.
 */
export function diatonicChords(scale: Scale, tier: Tier): Chord[] {
  const qualities = tier === 1 ? MAJOR_SCALE_TRIADS : MAJOR_SCALE_SEVENTH_CHORDS
  return scale.notes.map((root, i) => ({ root, quality: qualities[i] }))
}
