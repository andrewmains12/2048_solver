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
  it.each([
    ['C', 'C'], ['C#', 'C#'], ['D', 'D'], ['D#', 'D#'],
    ['E', 'E'], ['F', 'F'], ['F#', 'F#'], ['G', 'G'],
    ['G#', 'G#'], ['A', 'A'], ['A#', 'A#'], ['B', 'B'],
  ] as const)('passes through canonical name %s unchanged', (note, expected) => {
    expect(normaliseNote(note)).toBe(expected)
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
    expect(displayNote('C#', 'G')).toBe('C#')
    expect(displayNote('G#', 'E')).toBe('G#')
  })

  it('returns flat display names for all five flat key roots', () => {
    // F major (1 flat): A# → Bb
    expect(displayNote('A#', 'F')).toBe('Bb')
    // Bb major (A# key, 2 flats): A# → Bb, D# → Eb
    expect(displayNote('A#', 'A#')).toBe('Bb')
    expect(displayNote('D#', 'A#')).toBe('Eb')
    // Eb major (D# key, 3 flats): D# → Eb, G# → Ab, A# → Bb
    expect(displayNote('D#', 'D#')).toBe('Eb')
    expect(displayNote('G#', 'D#')).toBe('Ab')
    expect(displayNote('A#', 'D#')).toBe('Bb')
    // Ab major (G# key, 4 flats): G# → Ab, C# → Db, D# → Eb, A# → Bb
    expect(displayNote('G#', 'G#')).toBe('Ab')
    expect(displayNote('C#', 'G#')).toBe('Db')
    expect(displayNote('D#', 'G#')).toBe('Eb')
    expect(displayNote('A#', 'G#')).toBe('Bb')
    // Db major (C# key, 5 flats): C# → Db, F# → Gb, G# → Ab, D# → Eb, A# → Bb
    expect(displayNote('C#', 'C#')).toBe('Db')
    expect(displayNote('F#', 'C#')).toBe('Gb')
    expect(displayNote('G#', 'C#')).toBe('Ab')
    expect(displayNote('D#', 'C#')).toBe('Eb')
    expect(displayNote('A#', 'C#')).toBe('Bb')
  })

  it('returns natural notes unchanged regardless of key', () => {
    expect(displayNote('G', 'F')).toBe('G')
    expect(displayNote('E', 'A#')).toBe('E')
    expect(displayNote('C', 'D#')).toBe('C')
  })
})
