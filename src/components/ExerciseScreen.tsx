import { useEffect, useState, useCallback } from 'react'

import type { ChordLabel, NoteName, Result } from '@/types'
import { buildScale, diatonicChords, chordLabel } from '@/theory'
import { playQuestion, playTonicCadence, getContextState } from '@/audio'
import { validateAnswer } from '@/exercises'
import { useSessionStore } from '@/store/sessionStore'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { parseVoiceTranscript } from '@/lib/voiceParser'

import { NoteSelector } from './NoteSelector'
import { ChordSelector } from './ChordSelector'
import { Feedback } from './Feedback'

export function ExerciseScreen() {
  const { config, currentQuestion, recordResult, nextQuestion, endSession, stats } = useSessionStore()

  const [selectedNote, setSelectedNote] = useState<NoteName | null>(null)
  const [selectedChord, setSelectedChord] = useState<ChordLabel | null>(null)
  const [lastResult, setLastResult] = useState<Result | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Reset selections when question changes (but do NOT auto-play — iOS requires user gesture)
  useEffect(() => {
    if (!currentQuestion) return
    setSelectedNote(null)
    setSelectedChord(null)
    setLastResult(null)
    setHasSubmitted(false)
  }, [currentQuestion])

  // Derived values — computed unconditionally so they can be used in hooks below.
  // These evaluate to empty/null when config is not yet set (before session starts).
  const scale = config ? buildScale(config.key, 'major') : null
  const chords = scale && config ? diatonicChords(scale, config.tier) : []
  const notes: NoteName[] = scale ? [...scale.notes] : []
  const availableChordLabels = chords.map((c) => chordLabel(c))

  // Voice input — hook must be called unconditionally (Rules of Hooks)
  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      const parsed = parseVoiceTranscript(transcript, availableChordLabels)
      if (parsed.noteName && notes.includes(parsed.noteName)) setSelectedNote(parsed.noteName)
      if (parsed.chordLabel) setSelectedChord(parsed.chordLabel)
    },
    // availableChordLabels and notes change each render when config changes, but
    // the callback identity only matters for the recognition event — it's stored
    // via ref inside the hook so stale-closure is not a concern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableChordLabels.join(','), notes.join(',')],
  )

  const { state: voiceState, errorMessage: voiceError, toggle: toggleVoice } =
    useSpeechRecognition(handleVoiceTranscript)

  const handlePlayQuestion = () => {
    if (!currentQuestion) return
    playQuestion(currentQuestion.chord, currentQuestion.note)
  }

  const handlePlayTonic = () => {
    if (!config) return
    playTonicCadence(config.key)
  }

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || !selectedNote || !selectedChord) return
    const result = validateAnswer(currentQuestion, { noteName: selectedNote, chordLabel: selectedChord })
    if (!hasSubmitted) {
      recordResult(result)
      setHasSubmitted(true)
    }
    setLastResult(result)
  }, [currentQuestion, selectedNote, selectedChord, hasSubmitted, recordResult])

  const handleNext = () => nextQuestion()

  if (!config || !currentQuestion || !scale) return null

  const canSubmit = selectedNote !== null && selectedChord !== null

  const voiceTitle =
    voiceState === 'unsupported'
      ? 'Voice input requires Safari 14.5+ or Chrome'
      : voiceState === 'error'
        ? (voiceError ?? 'Speech recognition error — tap to retry')
        : voiceState === 'listening'
          ? 'Stop listening'
          : 'Speak your answer (note + chord)'

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
        {/* Playback controls + voice toggle */}
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

          {/* Mic / voice toggle */}
          <button
            onClick={voiceState !== 'unsupported' ? toggleVoice : undefined}
            disabled={voiceState === 'unsupported'}
            title={voiceTitle}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Start voice input'}
            className={[
              'ml-auto flex items-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
              voiceState === 'unsupported'
                ? 'opacity-40 cursor-not-allowed bg-white/10'
                : voiceState === 'listening'
                  ? 'bg-brand-500 animate-pulse'
                  : voiceState === 'error'
                    ? 'bg-red-700/60 hover:bg-red-700/80'
                    : 'bg-white/10 hover:bg-white/20',
            ].join(' ')}
            data-testid="voice-btn"
          >
            🎤{voiceState === 'listening' ? ' Listening…' : ''}
          </button>
        </div>

        <ChordSelector
          chords={chords}
          selected={selectedChord}
          onSelect={setSelectedChord}
        />

        <NoteSelector
          notes={notes}
          selected={selectedNote}
          onSelect={setSelectedNote}
        />

        {lastResult && <Feedback result={lastResult} />}

        {hasSubmitted ? (
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-colors"
              data-testid="check-again-btn"
            >
              Check again
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold text-lg transition-colors"
              data-testid="next-btn"
            >
              Next →
            </button>
          </div>
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
