import { describe, it, expect } from 'vitest'

import type { Chord } from '@/types'

import { chordNotes, chordLabel, parseChordLabel, diatonicChords } from './chords'
import { buildScale } from './scales'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const chord = (root: Chord['root'], quality: Chord['quality']): Chord => ({ root, quality })
const cMajorScale = () => buildScale('C', 'major')
const gMajorScale = () => buildScale('G', 'major')

// ---------------------------------------------------------------------------
// chordNotes
// ---------------------------------------------------------------------------
describe('chordNotes', () => {
  it.each([
    [chord('C', 'major'),          ['C','E','G']],
    [chord('G', 'dominant7'),      ['G','B','D','F']],
    [chord('D', 'minor'),          ['D','F','A']],
    [chord('B', 'diminished'),     ['B','D','F']],
    [chord('F', 'major7'),         ['F','A','C','E']],
    [chord('A', 'minor7'),         ['A','C','E','G']],
    [chord('B', 'halfDiminished7'),['B','D','F','A']],
  ] as const)('%o → %j', (c, expected) => {
    expect(chordNotes(c)).toEqual(expected)
  })
})

// ---------------------------------------------------------------------------
// chordLabel
// ---------------------------------------------------------------------------
describe('chordLabel', () => {
  it.each([
    [chord('C', 'major'),          'C'],
    [chord('D', 'minor'),          'Dm'],
    [chord('B', 'diminished'),     'B°'],
    [chord('F', 'augmented'),      'F+'],
    [chord('F', 'major7'),         'FΔ7'],
    [chord('G', 'dominant7'),      'G7'],
    [chord('A', 'minor7'),         'Am7'],
    [chord('B', 'halfDiminished7'),'Bø7'],
    [chord('B', 'diminished7'),    'B°7'],
  ] as const)('%o → %s', (c, expected) => {
    expect(chordLabel(c)).toBe(expected)
  })
})

// ---------------------------------------------------------------------------
// parseChordLabel
// ---------------------------------------------------------------------------
const cMajorTier2Chords = () => diatonicChords(cMajorScale(), 2)

describe('parseChordLabel', () => {
  it('finds a chord by its label', () => {
    expect(parseChordLabel('G7', cMajorTier2Chords())).toEqual(chord('G', 'dominant7'))
  })

  it('returns null for an unknown label', () => {
    expect(parseChordLabel('X', cMajorTier2Chords())).toBeNull()
  })

  it('returns null for a chord not in the candidate list', () => {
    expect(parseChordLabel('FΔ7', diatonicChords(gMajorScale(), 2))).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// diatonicChords
// ---------------------------------------------------------------------------
describe('diatonicChords', () => {
  it('returns 7 triads for C major tier 1', () => {
    expect(diatonicChords(cMajorScale(), 1)).toEqual([
      chord('C', 'major'),
      chord('D', 'minor'),
      chord('E', 'minor'),
      chord('F', 'major'),
      chord('G', 'major'),
      chord('A', 'minor'),
      chord('B', 'diminished'),
    ])
  })

  it('returns 7 seventh chords for C major tier 2', () => {
    expect(diatonicChords(cMajorScale(), 2)).toEqual([
      chord('C', 'major7'),
      chord('D', 'minor7'),
      chord('E', 'minor7'),
      chord('F', 'major7'),
      chord('G', 'dominant7'),
      chord('A', 'minor7'),
      chord('B', 'halfDiminished7'),
    ])
  })

  it('returns correct roots for G major', () => {
    const roots = diatonicChords(gMajorScale(), 1).map((c) => c.root)
    expect(roots).toEqual(['G','A','B','C','D','E','F#'])
  })
})
