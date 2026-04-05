import type { ChordLabel, ChordStats, NoteName, Result, SessionStats } from '@/types'
import { chordLabel } from '@/theory'

export function createSessionStats(): SessionStats {
  return {
    totalQuestions: 0,
    totalCorrect: 0,
    noteStats: {} as SessionStats['noteStats'],
    chordStats: {},
  }
}

/**
 * Returns a new SessionStats with the result applied (immutable update).
 */
export function applyResult(stats: SessionStats, result: Result): SessionStats {
  const note = result.question.note
  const label = chordLabel(result.question.chord)

  const prevNote = stats.noteStats[note] ?? { noteName: note, attempts: 0, correct: 0 }
  const prevChord: ChordStats =
    stats.chordStats[label] ?? { chordLabel: label, attempts: 0, correct: 0 }

  return {
    totalQuestions: stats.totalQuestions + 1,
    totalCorrect: stats.totalCorrect + (result.correct ? 1 : 0),
    noteStats: {
      ...stats.noteStats,
      [note]: {
        noteName: note,
        attempts: prevNote.attempts + 1,
        correct: prevNote.correct + (result.noteCorrect ? 1 : 0),
      } satisfies SessionStats['noteStats'][NoteName],
    },
    chordStats: {
      ...stats.chordStats,
      [label]: {
        chordLabel: label,
        attempts: prevChord.attempts + 1,
        correct: prevChord.correct + (result.chordCorrect ? 1 : 0),
      },
    },
  }
}

/** Accuracy 0–1, or null if no attempts yet. */
export function accuracy(attempts: number, correct: number): number | null {
  return attempts === 0 ? null : correct / attempts
}
