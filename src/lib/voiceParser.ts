import type { ChordLabel, NoteName } from '@/types'

// ---------------------------------------------------------------------------
// Note alias table — longest-match entries first within each enharmonic group
// so 'c sharp' is tried before 'c', preventing the bare-letter from eating
// the beginning of a two-word alias.
// ---------------------------------------------------------------------------
const NOTE_ALIASES: [string, NoteName][] = [
  // Sharps / flats
  ['c sharp', 'C#'],
  ['c#', 'C#'],
  ['d flat', 'C#'],
  ['db', 'C#'],
  ['d sharp', 'D#'],
  ['d#', 'D#'],
  ['e flat', 'D#'],
  ['eb', 'D#'],
  ['f flat', 'E'],
  ['f sharp', 'F#'],
  ['f#', 'F#'],
  ['g flat', 'F#'],
  ['gb', 'F#'],
  ['g sharp', 'G#'],
  ['g#', 'G#'],
  ['a flat', 'G#'],
  ['ab', 'G#'],
  ['a sharp', 'A#'],
  ['a#', 'A#'],
  ['b flat', 'A#'],
  ['bb', 'A#'],
  ['c flat', 'B'],
  // Natural letters — must come after all two-word / two-char variants
  ['c', 'C'],
  ['d', 'D'],
  ['e', 'E'],
  ['f', 'F'],
  ['g', 'G'],
  ['a', 'A'],
  ['b', 'B'],
]

// ---------------------------------------------------------------------------
// Quality alias table — maps spoken phrases to the suffix used in ChordLabel.
// More-specific / longer phrases come first so 'half diminished' beats 'diminished'.
// ---------------------------------------------------------------------------
const QUALITY_ALIASES: [string, string][] = [
  // Half-diminished seventh
  ['half diminished seventh', 'ø7'],
  ['half diminished seven', 'ø7'],
  ['half diminished 7', 'ø7'],
  ['half dim seventh', 'ø7'],
  ['half dim seven', 'ø7'],
  ['half dim 7', 'ø7'],
  ['half diminished', 'ø7'],
  ['half dim', 'ø7'],
  // Diminished seventh
  ['diminished seventh', '°7'],
  ['diminished seven', '°7'],
  ['diminished 7', '°7'],
  ['dim seventh', '°7'],
  ['dim seven', '°7'],
  ['dim 7', '°7'],
  ['dim7', '°7'],
  // Plain diminished (no 7)
  ['diminished', '°'],
  ['dim', '°'],
  // Major seventh
  ['major seventh', 'Δ7'],
  ['major seven', 'Δ7'],
  ['major 7', 'Δ7'],
  ['maj seventh', 'Δ7'],
  ['maj seven', 'Δ7'],
  ['maj 7', 'Δ7'],
  ['maj7', 'Δ7'],
  ['delta seventh', 'Δ7'],
  ['delta seven', 'Δ7'],
  ['delta 7', 'Δ7'],
  // Dominant seventh (plain "7" or "seven")
  ['dominant seventh', '7'],
  ['dominant seven', '7'],
  ['dominant 7', '7'],
  ['dom seventh', '7'],
  ['dom seven', '7'],
  ['dom 7', '7'],
  ['dom7', '7'],
  // Minor seventh
  ['minor seventh', 'm7'],
  ['minor seven', 'm7'],
  ['minor 7', 'm7'],
  ['min seventh', 'm7'],
  ['min seven', 'm7'],
  ['min 7', 'm7'],
  ['m7', 'm7'],
  // Plain minor (no 7)
  ['minor', 'm'],
  ['min', 'm'],
  // Augmented
  ['augmented', '+'],
  ['aug', '+'],
  // Plain major — must come after 'major seventh' variants
  ['major', ''],
  ['maj', ''],
  // Bare "seven/seventh" — dominant by convention
  ['seventh', '7'],
  ['seven', '7'],
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9# ]/g, ' ') // keep letters, digits, #, spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/** Try to match the start of `text` against the alias table. */
function matchPrefix<T>(
  text: string,
  aliases: [string, T][],
): { value: T; rest: string } | null {
  for (const [alias, value] of aliases) {
    if (text === alias || text.startsWith(alias + ' ')) {
      return { value, rest: text.slice(alias.length).trimStart() }
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Voice action parser — recognises hands-free command words
// ---------------------------------------------------------------------------

export type VoiceAction = 'submit' | 'next'

/**
 * Returns the action the user spoke, or null if no command word was recognised.
 * Checked after answer parsing so that a chord name never accidentally triggers
 * a command (none of the note/quality aliases match these words).
 */
export function parseVoiceAction(transcript: string): VoiceAction | null {
  const text = normalize(transcript)
  if (text === 'submit' || text === 'check' || text === 'done') return 'submit'
  if (text === 'next' || text === 'continue') return 'next'
  return null
}

export interface ParsedVoiceAnswer {
  noteName?: NoteName
  chordLabel?: ChordLabel
}

/**
 * Parses a raw speech transcript into a partial solfege answer.
 *
 * Accepts:
 *   "C minor"              → { noteName: 'C',  chordLabel: 'Cm' }
 *   "G seven"              → { noteName: 'G',  chordLabel: 'G7' }
 *   "E flat"               → { noteName: 'D#' }
 *   "minor C"              → { noteName: 'C',  chordLabel: 'Cm' }  (quality-first)
 *   "D"                    → { noteName: 'D' }
 *   ""                     → {}
 *
 * `availableChordLabels` is the set of labels legal in the current exercise.
 * A parsed chord label is only returned if it appears in this set.
 */
export function parseVoiceTranscript(
  transcript: string,
  availableChordLabels: ChordLabel[],
): ParsedVoiceAnswer {
  const text = normalize(transcript)
  if (!text) return {}

  // --- Strategy 1: note + quality [+ melody note] ---
  // Handles "C minor" (note = chord root), and "C minor A" / "G seven B"
  // where the user says the chord then the melody note after a pause.
  const noteFirst = matchPrefix(text, NOTE_ALIASES)
  if (noteFirst) {
    const chordRoot = noteFirst.value
    const qualityMatch = matchPrefix(noteFirst.rest, QUALITY_ALIASES)
    if (qualityMatch) {
      const label = `${chordRoot}${qualityMatch.value}`
      const parsedChordLabel = availableChordLabels.includes(label) ? label : undefined
      // Look for a trailing melody note: "C major A" → melody note is A, not C
      const melodyMatch = matchPrefix(qualityMatch.rest, NOTE_ALIASES)
      if (melodyMatch) {
        // "C major A" — explicit melody note after quality
        return { noteName: melodyMatch.value, chordLabel: parsedChordLabel }
      }
      // "C major" only — fill chord, leave note for the next segment
      return { chordLabel: parsedChordLabel }
    }
    // Note only — no quality heard
    return { noteName: chordRoot }
  }

  // --- Strategy 2: quality first, then note ("minor C") ---
  const qualityFirst = matchPrefix(text, QUALITY_ALIASES)
  if (qualityFirst) {
    const suffix = qualityFirst.value
    const noteMatch = matchPrefix(qualityFirst.rest, NOTE_ALIASES)
    if (noteMatch) {
      const noteName = noteMatch.value
      const label = `${noteName}${suffix}`
      return {
        noteName,
        chordLabel: availableChordLabels.includes(label) ? label : undefined,
      }
    }
    // Quality only — no note heard; not useful, return nothing
    return {}
  }

  return {}
}
