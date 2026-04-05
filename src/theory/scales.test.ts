import { describe, it, expect } from 'vitest'
import { buildScale, isDiatonic, scaleDegree } from './scales'
import type { Scale } from '@/types'

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------
const cMajor = (): Scale => buildScale('C', 'major')
const gMajor = (): Scale => buildScale('G', 'major')
const fMajor = (): Scale => buildScale('F', 'major')

// ---------------------------------------------------------------------------
// buildScale
// ---------------------------------------------------------------------------
describe('buildScale', () => {
  it.each([
    ['C', ['C','D','E','F','G','A','B']],
    ['G', ['G','A','B','C','D','E','F#']],
    ['D', ['D','E','F#','G','A','B','C#']],
    ['A', ['A','B','C#','D','E','F#','G#']],
    ['E', ['E','F#','G#','A','B','C#','D#']],
    ['B', ['B','C#','D#','E','F#','G#','A#']],
    ['F#',['F#','G#','A#','B','C#','D#','F']],  // enharmonic: F = E#
    ['F', ['F','G','A','A#','C','D','E']],       // Bb stored as A#
  ] as const)('major scale from %s', (root, expectedNotes) => {
    expect(buildScale(root, 'major')).toEqual({
      root,
      type: 'major',
      notes: expectedNotes,
    })
  })
})

// ---------------------------------------------------------------------------
// isDiatonic
// ---------------------------------------------------------------------------
describe('isDiatonic', () => {
  it('returns true for all 7 diatonic notes', () => {
    const scale = cMajor()
    scale.notes.forEach((note) => {
      expect(isDiatonic(note, scale), `${note} should be diatonic to C major`).toBe(true)
    })
  })

  it('returns false for chromatic notes not in scale', () => {
    const scale = cMajor()
    const chromatic = ['C#', 'D#', 'F#', 'G#', 'A#'] as const
    chromatic.forEach((note) => {
      expect(isDiatonic(note, scale), `${note} should not be diatonic to C major`).toBe(false)
    })
  })

  it('handles accidentals correctly in G major', () => {
    const scale = gMajor()
    expect(isDiatonic('F#', scale)).toBe(true)
    expect(isDiatonic('F', scale)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// scaleDegree
// ---------------------------------------------------------------------------
describe('scaleDegree', () => {
  it('returns 1-based degree for diatonic notes in C major', () => {
    const scale = cMajor()
    const expected: Array<[string, number]> = [
      ['C', 1], ['D', 2], ['E', 3], ['F', 4], ['G', 5], ['A', 6], ['B', 7],
    ]
    expected.forEach(([note, degree]) => {
      expect(scaleDegree(note as Parameters<typeof scaleDegree>[0], scale)).toBe(degree)
    })
  })

  it('returns null for non-diatonic notes', () => {
    const scale = cMajor()
    expect(scaleDegree('F#', scale)).toBeNull()
    expect(scaleDegree('A#', scale)).toBeNull()
  })

  it('returns correct degrees in F major', () => {
    const scale = fMajor()
    // A# is Bb in F major
    expect(scaleDegree('A#', scale)).toBe(4)
  })
})
