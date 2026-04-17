import { useEffect, useRef, useState, useCallback } from 'react'

import type { ChordLabel, NoteName, Result } from '@/types'
import { buildScale, diatonicChords, chordLabel } from '@/theory'
import { displayNote } from '@/theory/notes'
import { playQuestion, playTonicCadence, getContextState, playFeedbackTone, speakCorrection } from '@/audio'
import { validateAnswer } from '@/exercises'
import { useSessionStore } from '@/store/sessionStore'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { parseVoiceTranscript, parseVoiceAction } from '@/lib/voiceParser'

import { NoteSelector } from './NoteSelector'
import { ChordSelector } from './ChordSelector'
import { Feedback } from './Feedback'

export function ExerciseScreen() {
  const { config, currentQuestion, recordResult, nextQuestion, endSession, stats } = useSessionStore()

  const [selectedNote, setSelectedNote] = useState<NoteName | null>(null)
  const [selectedChord, setSelectedChord] = useState<ChordLabel | null>(null)
  const [lastResult, setLastResult] = useState<Result | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Refs kept in sync during render so memoized callbacks can read current values
  // without being added to their dependency arrays (stale-closure prevention).
  const selectedNoteRef = useRef<NoteName | null>(null)
  const selectedChordRef = useRef<ChordLabel | null>(null)
  const hasSubmittedRef = useRef(false)
  selectedNoteRef.current = selectedNote
  selectedChordRef.current = selectedChord
  hasSubmittedRef.current = hasSubmitted

  // Set to true when voice triggers a submission; cleared by the auto-advance effect.
  const voiceAutoAdvancePendingRef = useRef(false)

  // Derived values — computed unconditionally so they can be used in hooks below.
  // These evaluate to empty/null when config is not yet set (before session starts).
  const scale = config ? buildScale(config.key, 'major') : null
  const chords = scale && config ? diatonicChords(scale, config.tier) : []
  const notes: NoteName[] = scale ? [...scale.notes] : []
  const availableChordLabels = chords.map((c) => chordLabel(c))

  const handleSubmit = useCallback((noteOverride?: NoteName | null, chordOverride?: ChordLabel | null) => {
    const note = noteOverride ?? selectedNote
    const chord = chordOverride ?? selectedChord
    if (!currentQuestion || !note || !chord) return
    const result = validateAnswer(currentQuestion, { noteName: note, chordLabel: chord })
    if (!hasSubmitted) {
      recordResult(result)
      setHasSubmitted(true)
    }
    setLastResult(result)
    playFeedbackTone(result.correct ? 'correct' : 'wrong')
  }, [currentQuestion, selectedNote, selectedChord, hasSubmitted, recordResult])

  // When true, the currentQuestion effect will auto-play the incoming question.
  const autoPlayRef = useRef(false)

  const handleNext = useCallback(() => {
    autoPlayRef.current = true
    nextQuestion()
  }, [nextQuestion])

  // Voice input — hook must be called unconditionally (Rules of Hooks)
  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      const parsed = parseVoiceTranscript(transcript, availableChordLabels)
      if (parsed.noteName && notes.includes(parsed.noteName)) setSelectedNote(parsed.noteName)
      if (parsed.chordLabel) setSelectedChord(parsed.chordLabel)

      const action = parseVoiceAction(transcript)
      if (action === 'submit') {
        playFeedbackTone('command')
        voiceAutoAdvancePendingRef.current = true
        handleSubmit()
      } else if (action === 'next') {
        playFeedbackTone('command')
        handleNext()
      } else if (action === 'play') {
        if (currentQuestion) playQuestion(currentQuestion.chord, currentQuestion.note)
      } else if (!hasSubmittedRef.current) {
        // Auto-submit when voice fills the last missing field
        const nextNote = (parsed.noteName && notes.includes(parsed.noteName))
          ? parsed.noteName
          : selectedNoteRef.current
        const nextChord = parsed.chordLabel ?? selectedChordRef.current
        if (nextNote && nextChord) {
          voiceAutoAdvancePendingRef.current = true
          handleSubmit(nextNote, nextChord)
        }
      }
    },
    // availableChordLabels and notes change each render when config changes, but
    // the callback identity only matters for the recognition event — it's stored
    // via ref inside the hook so stale-closure is not a concern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availableChordLabels.join(','), notes.join(','), handleSubmit, handleNext],
  )

  const { state: voiceState, errorMessage: voiceError, transcript: voiceTranscript, toggle: toggleVoice, reset: resetVoice } =
    useSpeechRecognition(handleVoiceTranscript)

  // Reset selections when question changes; auto-play if the user tapped Next.
  // Auto-play is safe here because the AudioGate ensures the context is running
  // before the session starts — no additional user gesture is required.
  useEffect(() => {
    if (!currentQuestion) return
    setSelectedNote(null)
    setSelectedChord(null)
    setLastResult(null)
    setHasSubmitted(false)
    resetVoice()
    if (autoPlayRef.current) {
      autoPlayRef.current = false
      playQuestion(currentQuestion.chord, currentQuestion.note)
    }
  }, [currentQuestion, resetVoice])

  // Auto-advance after a voice-triggered submission: speak correction if wrong,
  // then move to the next question after the feedback window.
  useEffect(() => {
    if (!voiceAutoAdvancePendingRef.current || !lastResult) return
    voiceAutoAdvancePendingRef.current = false
    const delay = lastResult.correct ? 1500 : 2500
    if (!lastResult.correct) {
      speakCorrection(lastResult.question.chord, lastResult.question.note)
    }
    const timer = setTimeout(handleNext, delay)
    return () => clearTimeout(timer)
  }, [lastResult, handleNext])

  const handlePlayQuestion = () => {
    if (!currentQuestion) return
    playQuestion(currentQuestion.chord, currentQuestion.note)
  }

  const handlePlayTonic = () => {
    if (!config) return
    playTonicCadence(config.key)
  }

  if (!config || !currentQuestion || !scale) return null

  const canSubmit = selectedNote !== null && selectedChord !== null

  const voiceTitle =
    voiceState === 'unsupported'
      ? 'Voice input requires Safari 14.5+ or Chrome'
      : voiceState === 'listening'
        ? 'Stop listening'
        : 'Speak your answer (note + chord)'

  // Human-readable inline error — title tooltip is invisible on touch devices
  const voiceInlineError =
    voiceState === 'error'
      ? voiceError === 'not-allowed' || voiceError === 'service-not-allowed'
        ? 'Mic access denied — allow it in Settings › Safari'
        : voiceError === 'audio-capture'
          ? 'No microphone found'
          : voiceError === 'network'
            ? 'Network error — speech recognition needs Wi-Fi or cellular'
            : voiceError === 'no-speech'
              ? 'No speech detected — tap to try again'
              : `Mic error — tap to retry`
      : null

  return (
    <div className="min-h-screen bg-brand-900 text-white flex flex-col" data-testid="exercise-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium text-white/60">
          Key of {displayNote(config.key, config.key)} · Tier {config.tier}
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

        {/* Live transcript + inline error — both invisible via title tooltip on touch */}
        {(voiceTranscript || voiceInlineError) && (
          <p
            className={`text-xs font-mono -mt-3 text-right ${voiceInlineError ? 'text-red-400' : 'text-white/40'}`}
            data-testid="voice-transcript"
          >
            {voiceInlineError ?? `"${voiceTranscript}"`}
          </p>
        )}

        <ChordSelector
          chords={chords}
          selected={selectedChord}
          onSelect={setSelectedChord}
        />

        <NoteSelector
          notes={notes}
          selected={selectedNote}
          onSelect={setSelectedNote}
          keyRoot={config.key}
        />

        {lastResult && <Feedback result={lastResult} keyRoot={config.key} />}

        {hasSubmitted ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit()}
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
            onClick={() => handleSubmit()}
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
