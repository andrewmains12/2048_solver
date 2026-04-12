import { describe, expect, it } from 'vitest'

import { parseVoiceTranscript } from './voiceParser'

// Chord labels available in a C major Tier 1 session (triads)
const TIER1_LABELS = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']

// Chord labels available in a C major Tier 2 session (seventh chords)
const TIER2_LABELS = ['CΔ7', 'Dm7', 'Em7', 'FΔ7', 'G7', 'Am7', 'Bø7']

describe('parseVoiceTranscript', () => {
  // ---------------------------------------------------------------------------
  // Note + quality only (no trailing melody note) — fills chord, leaves note empty
  // ---------------------------------------------------------------------------

  it('"C major" fills chord only — note left for next segment', () => {
    expect(parseVoiceTranscript('C major', TIER1_LABELS)).toEqual({ chordLabel: 'C' })
  })

  it('"D minor" fills chord only', () => {
    expect(parseVoiceTranscript('D minor', TIER1_LABELS)).toEqual({ chordLabel: 'Dm' })
  })

  it('"B diminished" fills chord only', () => {
    expect(parseVoiceTranscript('B diminished', TIER1_LABELS)).toEqual({ chordLabel: 'B°' })
  })

  it('"G seven" fills chord only (tier 2)', () => {
    expect(parseVoiceTranscript('G seven', TIER2_LABELS)).toEqual({ chordLabel: 'G7' })
  })

  it('"C major seven" fills chord only (tier 2)', () => {
    expect(parseVoiceTranscript('C major seven', TIER2_LABELS)).toEqual({ chordLabel: 'CΔ7' })
  })

  it('"D minor seven" fills chord only (tier 2)', () => {
    expect(parseVoiceTranscript('D minor seven', TIER2_LABELS)).toEqual({ chordLabel: 'Dm7' })
  })

  it('"B half diminished" fills chord only (tier 2)', () => {
    expect(parseVoiceTranscript('B half diminished', TIER2_LABELS)).toEqual({ chordLabel: 'Bø7' })
  })

  it('"G dominant seventh" fills chord only (tier 2)', () => {
    expect(parseVoiceTranscript('G dominant seventh', TIER2_LABELS)).toEqual({ chordLabel: 'G7' })
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
  // Note + quality + trailing melody note ("C major A", "G seven B")
  // This is the natural speech pattern: name the chord then the melody note.
  // ---------------------------------------------------------------------------

  it('parses chord + trailing melody note ("D minor E")', () => {
    expect(parseVoiceTranscript('D minor E', TIER1_LABELS)).toEqual({
      noteName: 'E',
      chordLabel: 'Dm',
    })
  })

  it('parses chord + trailing melody note ("G seven B", tier 2)', () => {
    expect(parseVoiceTranscript('G seven B', TIER2_LABELS)).toEqual({
      noteName: 'B',
      chordLabel: 'G7',
    })
  })

  it('parses chord + trailing melody note where note differs from chord root ("C major A")', () => {
    expect(parseVoiceTranscript('C major A', TIER1_LABELS)).toEqual({
      noteName: 'A',
      chordLabel: 'C',
    })
  })

  it('chord only (no trailing note) does NOT fill noteName — leaves it for next segment', () => {
    expect(parseVoiceTranscript('C major', TIER1_LABELS)).toEqual({ chordLabel: 'C' })
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
    expect(result.noteName).toBeUndefined()
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
    // No trailing note → chord only
    expect(parseVoiceTranscript('D MINOR', TIER1_LABELS)).toEqual({ chordLabel: 'Dm' })
  })

  it('is case-insensitive with trailing note ("g SEVEN b")', () => {
    expect(parseVoiceTranscript('g SEVEN b', TIER2_LABELS)).toEqual({
      noteName: 'B',
      chordLabel: 'G7',
    })
  })

  // ---------------------------------------------------------------------------
  // Half-diminished does not accidentally match plain 'diminished'
  // ---------------------------------------------------------------------------

  it('half diminished seven is not confused with plain diminished', () => {
    expect(parseVoiceTranscript('B half diminished seven', TIER2_LABELS)).toEqual({ chordLabel: 'Bø7' })
  })

  it('plain diminished is correctly parsed when that is said', () => {
    expect(parseVoiceTranscript('B diminished', TIER1_LABELS)).toEqual({ chordLabel: 'B°' })
  })
})
