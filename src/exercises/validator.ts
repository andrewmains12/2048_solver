import type { Answer, Question, Result } from '@/types'
import { chordLabel } from '@/theory'

/**
 * Validates a user's answer against the correct question.
 * Both the note and the chord must match for `correct` to be true.
 */
export function validateAnswer(question: Question, answer: Answer): Result {
  const noteCorrect = answer.noteName === question.note
  const chordCorrect = answer.chordLabel === chordLabel(question.chord)
  return {
    question,
    answer,
    noteCorrect,
    chordCorrect,
    correct: noteCorrect && chordCorrect,
  }
}
