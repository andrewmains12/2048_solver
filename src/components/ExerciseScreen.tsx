import { useEffect, useState, useCallback } from 'react'

import type { ChordLabel, NoteName, Result } from '@/types'
import { buildScale, diatonicChords } from '@/theory'
import { playQuestion, playTonicCadence, getContextState } from '@/audio'
import { validateAnswer } from '@/exercises'
import { useSessionStore } from '@/store/sessionStore'

import { NoteSelector } from './NoteSelector'
import { ChordSelector } from './ChordSelector'
import { Feedback } from './Feedback'

const FEEDBACK_DURATION_MS = 1800

export function ExerciseScreen() {
  const { config, currentQuestion, recordResult, nextQuestion, endSession, stats } = useSessionStore()

  const [selectedNote, setSelectedNote] = useState<NoteName | null>(null)
  const [selectedChord, setSelectedChord] = useState<ChordLabel | null>(null)
  const [lastResult, setLastResult] = useState<Result | null>(null)
  const [awaitingNext, setAwaitingNext] = useState(false)

  // Reset selections when question changes (but do NOT auto-play — iOS requires user gesture)
  useEffect(() => {
    if (!currentQuestion) return
    setSelectedNote(null)
    setSelectedChord(null)
    setLastResult(null)
    setAwaitingNext(false)
  }, [currentQuestion])

  const handlePlayQuestion = () => {
    if (!currentQuestion) return
    playQuestion(currentQuestion.chord, currentQuestion.note)
  }

  const handlePlayTonic = () => {
    if (!config) return
    playTonicCadence(config.key)
  }

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !selectedNote || !selectedChord || awaitingNext) return
    const result = validateAnswer(currentQuestion, { noteName: selectedNote, chordLabel: selectedChord })
    recordResult(result)
    setLastResult(result)
    setAwaitingNext(true)
    setTimeout(() => { nextQuestion() }, FEEDBACK_DURATION_MS)
  }, [currentQuestion, selectedNote, selectedChord, awaitingNext, recordResult, nextQuestion])

  if (!config || !currentQuestion) return null

  const scale = buildScale(config.key, 'major')
  const chords = diatonicChords(scale, config.tier)
  const notes: NoteName[] = [...scale.notes]
  const canSubmit = selectedNote !== null && selectedChord !== null && !awaitingNext

  return (
    <div className="min-h-screen bg-brand-900 text-white flex flex-col" data-testid="exercise-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium text-white/60">
          Key of {config.key} · Tier {config.tier}
        </span>
        <span className="text-sm text-white/60" data-testid="score-counter">
          {stats.totalCorrect}/{stats.totalQuestions}
        </span>
        <span
          className="text-xs font-mono px-1 rounded"
          style={{ color: getContextState() === 'running' ? '#86efac' : '#fca5a5' }}
          data-testid="audio-state"
        >
          {getContextState()}
        </span>
        <button
          onClick={endSession}
          className="text-white/40 hover:text-white text-sm"
          data-testid="end-session-btn"
        >
          Done
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-5 p-4 pb-safe">
        {/* Playback controls */}
        <div className="flex gap-2">
          <button
            onClick={handlePlayTonic}
            className="flex items-center gap-2 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            data-testid="play-tonic-btn"
          >
            ♩ Tonic
          </button>
          <button
            onClick={handlePlayQuestion}
            className="flex items-center gap-2 py-2 px-4 bg-brand-500 hover:bg-brand-600 rounded-lg text-sm font-semibold transition-colors"
            data-testid="replay-btn"
          >
            ▶ Play Question
          </button>
        </div>

        <ChordSelector
          chords={chords}
          selected={selectedChord}
          onSelect={setSelectedChord}
          disabled={awaitingNext}
        />

        <NoteSelector
          notes={notes}
          selected={selectedNote}
          onSelect={setSelectedNote}
          disabled={awaitingNext}
        />

        {lastResult ? (
          <Feedback result={lastResult} />
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
            data-testid="submit-btn"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  )
}
