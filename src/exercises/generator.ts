import type { NoteName, Question, SessionConfig } from '@/types'
import { buildScale, diatonicChords } from '@/theory'

/**
 * Generates a single random Question for the given session config.
 * Both the chord and the note are drawn uniformly at random from the
 * diatonic set — no weighting or repetition suppression at this stage.
 */
export function generateQuestion(config: SessionConfig): Question {
  const scale = buildScale(config.key, 'major')
  const chords = diatonicChords(scale, config.tier)
  const notes: NoteName[] = [...scale.notes]

  const chord = chords[Math.floor(Math.random() * chords.length)]
  const note = notes[Math.floor(Math.random() * notes.length)]

  return { chord, note }
}
