import type { NoteName, Result } from '@/types'
import { chordLabel } from '@/theory'
import { displayNote } from '@/theory/notes'

interface Props {
  result: Result
  keyRoot: NoteName
}

export function Feedback({ result, keyRoot }: Props) {
  if (result.correct) {
    return (
      <div
        className="text-center py-3 px-4 rounded-lg bg-green-500/20 text-green-300 font-medium"
        data-testid="feedback-correct"
      >
        ✓ Correct!
      </div>
    )
  }

  const correctNote = displayNote(result.question.note, keyRoot)
  const correctChord = chordLabel(result.question.chord)

  return (
    <div
      className="py-3 px-4 rounded-lg bg-red-500/20 text-red-300 font-medium space-y-1"
      data-testid="feedback-incorrect"
    >
      <div>✗ Not quite</div>
      <div className="text-sm text-white/70">
        {!result.noteCorrect && <span>Note: <strong className="text-white">{correctNote}</strong> </span>}
        {!result.chordCorrect && <span>Chord: <strong className="text-white">{correctChord}</strong></span>}
      </div>
    </div>
  )
}
