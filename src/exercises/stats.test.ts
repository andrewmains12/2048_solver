import { describe, it, expect } from 'vitest'

import type { Result } from '@/types'

import { createSessionStats, applyResult, accuracy } from './stats'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const correctResult = (): Result => ({
  question: { chord: { root: 'G', quality: 'dominant7' }, note: 'B' },
  answer: { noteName: 'B', chordLabel: 'G7' },
  noteCorrect: true,
  chordCorrect: true,
  correct: true,
})

const wrongNoteResult = (): Result => ({
  question: { chord: { root: 'G', quality: 'dominant7' }, note: 'B' },
  answer: { noteName: 'C', chordLabel: 'G7' },
  noteCorrect: false,
  chordCorrect: true,
  correct: false,
})

const wrongChordResult = (): Result => ({
  question: { chord: { root: 'C', quality: 'major' }, note: 'E' },
  answer: { noteName: 'E', chordLabel: 'G7' },
  noteCorrect: true,
  chordCorrect: false,
  correct: false,
})

// ---------------------------------------------------------------------------
// createSessionStats
// ---------------------------------------------------------------------------
describe('createSessionStats', () => {
  it('creates zeroed stats', () => {
    expect(createSessionStats()).toEqual({
      totalQuestions: 0,
      totalCorrect: 0,
      noteStats: {},
      chordStats: {},
    })
  })
})

// ---------------------------------------------------------------------------
// applyResult
// ---------------------------------------------------------------------------
describe('applyResult', () => {
  it('increments totals on a correct result', () => {
    expect(applyResult(createSessionStats(), correctResult())).toEqual({
      totalQuestions: 1,
      totalCorrect: 1,
      noteStats: { B: { noteName: 'B', attempts: 1, correct: 1 } },
      chordStats: { G7: { chordLabel: 'G7', attempts: 1, correct: 1 } },
    })
  })

  it('does not increment totalCorrect on a wrong result', () => {
    expect(applyResult(createSessionStats(), wrongNoteResult())).toEqual({
      totalQuestions: 1,
      totalCorrect: 0,
      noteStats: { B: { noteName: 'B', attempts: 1, correct: 0 } },
      chordStats: { G7: { chordLabel: 'G7', attempts: 1, correct: 1 } },
    })
  })

  it('tracks note stats correctly across multiple results', () => {
    let stats = createSessionStats()
    stats = applyResult(stats, correctResult())   // B correct
    stats = applyResult(stats, wrongNoteResult()) // B wrong

    expect(stats).toEqual({
      totalQuestions: 2,
      totalCorrect: 1,
      noteStats: { B: { noteName: 'B', attempts: 2, correct: 1 } },
      chordStats: { G7: { chordLabel: 'G7', attempts: 2, correct: 2 } },
    })
  })

  it('tracks chord stats for correct chord answers', () => {
    let stats = createSessionStats()
    stats = applyResult(stats, correctResult())    // G7 correct
    stats = applyResult(stats, wrongNoteResult())  // G7 correct (wrong note but right chord)

    expect(stats).toEqual({
      totalQuestions: 2,
      totalCorrect: 1,
      noteStats: { B: { noteName: 'B', attempts: 2, correct: 1 } },
      chordStats: { G7: { chordLabel: 'G7', attempts: 2, correct: 2 } },
    })
  })

  it('tracks chord stats for wrong chord answers', () => {
    expect(applyResult(createSessionStats(), wrongChordResult())).toEqual({
      totalQuestions: 1,
      totalCorrect: 0,
      noteStats: { E: { noteName: 'E', attempts: 1, correct: 1 } },
      chordStats: { C: { chordLabel: 'C', attempts: 1, correct: 0 } },
    })
  })

  it('is immutable — does not mutate the input stats object', () => {
    const original = createSessionStats()
    applyResult(original, correctResult())
    expect(original).toEqual(createSessionStats())
  })
})

// ---------------------------------------------------------------------------
// accuracy
// ---------------------------------------------------------------------------
describe('accuracy', () => {
  it('returns null when attempts is 0', () => {
    expect(accuracy(0, 0)).toBeNull()
  })

  it('returns 1 for all correct', () => {
    expect(accuracy(5, 5)).toBe(1)
  })

  it('returns 0 for all wrong', () => {
    expect(accuracy(5, 0)).toBe(0)
  })

  it('returns ratio for partial correct', () => {
    expect(accuracy(4, 3)).toBe(0.75)
  })
})
