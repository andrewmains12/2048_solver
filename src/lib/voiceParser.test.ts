import { describe, expect, it } from 'vitest'

import { parseVoiceTranscript } from './voiceParser'

// Chord labels available in a C major Tier 1 session (triads)
const TIER1_LABELS = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']

// Chord labels available in a C major Tier 2 session (seventh chords)
const TIER2_LABELS = ['CΔ7', 'Dm7', 'Em7', 'FΔ7', 'G7', 'Am7', 'Bø7']

describe('parseVoiceTranscript', () => {
  // ---------------------------------------------------------------------------
  // Note + quality (note-first order)
  // ---------------------------------------------------------------------------

  it('parses note + major quality ("C major")', () => {
    expect(parseVoiceTranscript('C major', TIER1_LABELS)).toEqual({
      noteName: 'C',
      chordLabel: 'C',
    })
  })

  it('parses note + minor quality ("D minor")', () => {
    expect(parseVoiceTranscript('D minor', TIER1_LABELS)).toEqual({
      noteName: 'D',
      chordLabel: 'Dm',
    })
  })

  it('parses note + diminished quality ("B diminished")', () => {
    expect(parseVoiceTranscript('B diminished', TIER1_LABELS)).toEqual({
      noteName: 'B',
      chordLabel: 'B°',
    })
  })

  it('parses note + dominant seventh ("G seven")', () => {
    expect(parseVoiceTranscript('G seven', TIER2_LABELS)).toEqual({
      noteName: 'G',
      chordLabel: 'G7',
    })
  })

  it('parses note + major seventh ("C major seven")', () => {
    expect(parseVoiceTranscript('C major seven', TIER2_LABELS)).toEqual({
      noteName: 'C',
      chordLabel: 'CΔ7',
    })
  })

  it('parses note + minor seventh ("D minor seven")', () => {
    expect(parseVoiceTranscript('D minor seven', TIER2_LABELS)).toEqual({
      noteName: 'D',
      chordLabel: 'Dm7',
    })
  })

  it('parses note + half diminished ("B half diminished")', () => {
    expect(parseVoiceTranscript('B half diminished', TIER2_LABELS)).toEqual({
      noteName: 'B',
      chordLabel: 'Bø7',
    })
  })

  it('parses "dominant seventh" as dominant quality', () => {
    expect(parseVoiceTranscript('G dominant seventh', TIER2_LABELS)).toEqual({
      noteName: 'G',
      chordLabel: 'G7',
    })
  })

  // ---------------------------------------------------------------------------
  // Quality-first order ("minor C")
  // ---------------------------------------------------------------------------

  it('parses quality-first order ("minor D")', () => {
    expect(parseVoiceTranscript('minor D', TIER1_LABELS)).toEqual({
      noteName: 'D',
      chordLabel: 'Dm',
    })
  })

  it('parses quality-first order ("seven G")', () => {
    expect(parseVoiceTranscript('seven G', TIER2_LABELS)).toEqual({
      noteName: 'G',
      chordLabel: 'G7',
    })
  })

  // ---------------------------------------------------------------------------
  // Note only
  // ---------------------------------------------------------------------------

  it('returns only noteName when no quality is spoken ("D")', () => {
    expect(parseVoiceTranscript('D', TIER1_LABELS)).toEqual({ noteName: 'D' })
  })

  it('returns only noteName when quality is not recognised ("E blah")', () => {
    expect(parseVoiceTranscript('E blah', TIER1_LABELS)).toEqual({ noteName: 'E' })
  })

  // ---------------------------------------------------------------------------
  // Enharmonic flat spellings
  // ---------------------------------------------------------------------------

  it('maps "E flat" to D# (enharmonic)', () => {
    expect(parseVoiceTranscript('E flat', TIER1_LABELS)).toEqual({ noteName: 'D#' })
  })

  it('maps "B flat" to A#', () => {
    expect(parseVoiceTranscript('B flat', TIER1_LABELS)).toEqual({ noteName: 'A#' })
  })

  it('maps "G sharp" to G#', () => {
    expect(parseVoiceTranscript('G sharp', TIER1_LABELS)).toEqual({ noteName: 'G#' })
  })

  it('maps "C sharp" to C#', () => {
    expect(parseVoiceTranscript('C sharp', TIER1_LABELS)).toEqual({ noteName: 'C#' })
  })

  // ---------------------------------------------------------------------------
  // chordLabel gating — label must be in availableChordLabels
  // ---------------------------------------------------------------------------

  it('does not return chordLabel when the chord is not in the available set', () => {
    // G7 is only in Tier 2; Tier 1 just has "G" (major triad)
    const result = parseVoiceTranscript('G seven', TIER1_LABELS)
    expect(result.noteName).toBe('G')
    expect(result.chordLabel).toBeUndefined()
  })

  it('returns chordLabel when the chord is in the available set', () => {
    const result = parseVoiceTranscript('G seven', TIER2_LABELS)
    expect(result.chordLabel).toBe('G7')
  })

  // ---------------------------------------------------------------------------
  // Empty / unrecognised input
  // ---------------------------------------------------------------------------

  it('returns {} for an empty string', () => {
    expect(parseVoiceTranscript('', TIER1_LABELS)).toEqual({})
  })

  it('returns {} for whitespace-only input', () => {
    expect(parseVoiceTranscript('   ', TIER1_LABELS)).toEqual({})
  })

  it('returns {} for a completely unrecognised transcript', () => {
    expect(parseVoiceTranscript('hello world', TIER1_LABELS)).toEqual({})
  })

  it('returns {} when only a quality is heard with no note ("minor")', () => {
    expect(parseVoiceTranscript('minor', TIER1_LABELS)).toEqual({})
  })

  // ---------------------------------------------------------------------------
  // Case-insensitivity
  // ---------------------------------------------------------------------------

  it('is case-insensitive ("D MINOR")', () => {
    expect(parseVoiceTranscript('D MINOR', TIER1_LABELS)).toEqual({
      noteName: 'D',
      chordLabel: 'Dm',
    })
  })

  it('is case-insensitive ("g SEVEN")', () => {
    expect(parseVoiceTranscript('g SEVEN', TIER2_LABELS)).toEqual({
      noteName: 'G',
      chordLabel: 'G7',
    })
  })

  // ---------------------------------------------------------------------------
  // Half-diminished does not accidentally match plain 'diminished'
  // ---------------------------------------------------------------------------

  it('half diminished seven is not confused with plain diminished', () => {
    expect(parseVoiceTranscript('B half diminished seven', TIER2_LABELS)).toEqual({
      noteName: 'B',
      chordLabel: 'Bø7',
    })
  })

  it('plain diminished is correctly parsed when that is said', () => {
    expect(parseVoiceTranscript('B diminished', TIER1_LABELS)).toEqual({
      noteName: 'B',
      chordLabel: 'B°',
    })
  })
})
