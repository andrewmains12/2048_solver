import type { NoteName, Scale, ScaleType } from '@/types'

import { transposeNote } from './notes'

/** Semitone intervals from root for each scale type */
const SCALE_INTERVALS: Record<ScaleType, readonly number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
}

/**
 * Builds a Scale from a root note and scale type.
 *
 * @example
 * buildScale('C', 'major')
 * // → { root: 'C', type: 'major', notes: ['C','D','E','F','G','A','B'] }
 */
export function buildScale(root: NoteName, type: ScaleType): Scale {
  const intervals = SCALE_INTERVALS[type]
  const notes = intervals.map((semitones) => transposeNote(root, semitones)) as Scale['notes']
  return { root, type, notes }
}

/**
 * Returns true if `note` is diatonic to the given scale.
 */
export function isDiatonic(note: NoteName, scale: Scale): boolean {
  return scale.notes.includes(note)
}

/**
 * Returns the scale degree (1-based) of `note` in `scale`, or null if not diatonic.
 */
export function scaleDegree(note: NoteName, scale: Scale): number | null {
  const idx = scale.notes.indexOf(note)
  return idx === -1 ? null : idx + 1
}
