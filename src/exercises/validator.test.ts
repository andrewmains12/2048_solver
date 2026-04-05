import { describe, it, expect } from 'vitest'

import type { Question } from '@/types'

import { validateAnswer } from './validator'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const question = (): Question => ({
  chord: { root: 'G', quality: 'dominant7' },
  note: 'B',
})

// ---------------------------------------------------------------------------
// validateAnswer
// ---------------------------------------------------------------------------
describe('validateAnswer', () => {
  it('returns fully correct result when both note and chord match', () => {
    expect(validateAnswer(question(), { noteName: 'B', chordLabel: 'G7' })).toEqual({
      question: question(),
      answer: { noteName: 'B', chordLabel: 'G7' },
      noteCorrect: true,
      chordCorrect: true,
      correct: true,
    })
  })

  it('returns noteCorrect=false when note is wrong', () => {
    expect(validateAnswer(question(), { noteName: 'C', chordLabel: 'G7' })).toEqual({
      question: question(),
      answer: { noteName: 'C', chordLabel: 'G7' },
      noteCorrect: false,
      chordCorrect: true,
      correct: false,
    })
  })

  it('returns chordCorrect=false when chord is wrong', () => {
    expect(validateAnswer(question(), { noteName: 'B', chordLabel: 'C' })).toEqual({
      question: question(),
      answer: { noteName: 'B', chordLabel: 'C' },
      noteCorrect: true,
      chordCorrect: false,
      correct: false,
    })
  })

  it('returns both wrong when both are incorrect', () => {
    expect(validateAnswer(question(), { noteName: 'D', chordLabel: 'Dm' })).toEqual({
      question: question(),
      answer: { noteName: 'D', chordLabel: 'Dm' },
      noteCorrect: false,
      chordCorrect: false,
      correct: false,
    })
  })
})
