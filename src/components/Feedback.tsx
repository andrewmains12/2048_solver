import type { Result } from '@/types'
import { chordLabel } from '@/theory'

interface Props {
  result: Result
}

export function Feedback({ result }: Props) {
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

  const correctNote = result.question.note
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
