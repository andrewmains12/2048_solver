// ---------------------------------------------------------------------------
// Note names — sharps only (no flats in internal representation; display layer
// converts e.g. F# → Gb when appropriate for the key)
// ---------------------------------------------------------------------------
export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F'
  | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B'

// ---------------------------------------------------------------------------
// Scale
// ---------------------------------------------------------------------------
export type ScaleType = 'major' // minor keys are a future tier

export type Scale = {
  root: NoteName
  type: ScaleType
  /** The 7 diatonic pitch classes in ascending order */
  notes: [NoteName, NoteName, NoteName, NoteName, NoteName, NoteName, NoteName]
}

// ---------------------------------------------------------------------------
// Chords
// ---------------------------------------------------------------------------
export type ChordQuality =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'major7'      // Δ7
  | 'dominant7'   // 7
  | 'minor7'      // m7
  | 'halfDiminished7' // ø7
  | 'diminished7' // °7

export type Chord = {
  root: NoteName
  quality: ChordQuality
}

/** Human-readable label for a chord, e.g. "G7", "Dm", "FΔ7" */
export type ChordLabel = string

// ---------------------------------------------------------------------------
// Exercise
// ---------------------------------------------------------------------------
export type Tier = 1 | 2 // 1 = triads only, 2 = seventh chords; 3 (chromatic) future

export interface SessionConfig {
  key: NoteName
  tier: Tier
}

export interface Question {
  chord: Chord
  note: NoteName
}

export interface Answer {
  noteName: NoteName
  chordLabel: ChordLabel
}

export interface Result {
  question: Question
  answer: Answer
  noteCorrect: boolean
  chordCorrect: boolean
  correct: boolean // true only if both note and chord are correct
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
export type NoteStats = {
  noteName: NoteName
  attempts: number
  correct: number
}

export type ChordStats = {
  chordLabel: ChordLabel
  attempts: number
  correct: number
}

export type SessionStats = {
  totalQuestions: number
  totalCorrect: number
  noteStats: Record<NoteName, NoteStats>
  chordStats: Record<ChordLabel, ChordStats>
}
