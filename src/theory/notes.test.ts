import { describe, it, expect } from 'vitest'
import { semitoneOf, transposeNote, normaliseNote, displayNote } from './notes'

describe('semitoneOf', () => {
  it.each([
    ['C',  0], ['C#', 1], ['D',  2], ['D#', 3],
    ['E',  4], ['F',  5], ['F#', 6], ['G',  7],
    ['G#', 8], ['A',  9], ['A#', 10], ['B', 11],
  ] as const)('%s → %i', (note, expected) => {
    expect(semitoneOf(note)).toBe(expected)
  })
})

describe('transposeNote', () => {
  it.each([
    ['C',  7,  'G'],   // perfect fifth up
    ['G',  5,  'C'],   // perfect fourth up (= fifth down octave)
    ['B',  1,  'C'],   // semitone up wraps
    ['C',  -1, 'B'],   // semitone down wraps
    ['D',  12, 'D'],   // octave = identity
    ['A',  3,  'C'],   // minor third up
  ] as const)('%s + %i semitones = %s', (note, semitones, expected) => {
    expect(transposeNote(note, semitones)).toBe(expected)
  })
})

describe('normaliseNote', () => {
  it('passes through canonical sharp names unchanged', () => {
    expect(normaliseNote('C#')).toBe('C#')
    expect(normaliseNote('F#')).toBe('F#')
  })

  it.each([
    ['Db', 'C#'], ['Eb', 'D#'], ['Gb', 'F#'],
    ['Ab', 'G#'], ['Bb', 'A#'], ['Cb', 'B'], ['Fb', 'E'],
  ] as const)('flat %s → sharp %s', (flat, sharp) => {
    expect(normaliseNote(flat)).toBe(sharp)
  })

  it('throws for unrecognised input', () => {
    expect(() => normaliseNote('H')).toThrow()
    expect(() => normaliseNote('')).toThrow()
  })
})

describe('displayNote', () => {
  it('returns note unchanged for sharp keys', () => {
    expect(displayNote('A#', 'G')).toBe('A#')
    expect(displayNote('F#', 'D')).toBe('F#')
  })

  it('returns flat display names for flat keys', () => {
    expect(displayNote('A#', 'F')).toBe('Bb')
    expect(displayNote('D#', 'A#')).toBe('Eb')
  })

  it('returns natural notes unchanged regardless of key', () => {
    expect(displayNote('G', 'F')).toBe('G')
    expect(displayNote('E', 'A#')).toBe('E')
  })
})
