import { useEffect, useRef, useState } from 'react'

import type { Chord, NoteName } from '@/types'
import { buildScale, diatonicChords, chordLabel } from '@/theory'
import { playTonicCadence, playQuestion } from '@/audio'
import { generateQuestion } from '@/exercises'
import { useSessionStore } from '@/store/sessionStore'

type Step =
  | 'start'
  | 'playing-tonic'
  | 'playing-question'
  | 'awaiting-answer'
  | 'submitted'
  | 'done'

const KEY: NoteName = 'C'
const TIER = 1 as const

const STEP_LABELS: Record<Step, string> = {
  'start':            'Starting demo…',
  'playing-tonic':    '♩ Playing tonic to establish key…',
  'playing-question': '▶ Playing chord + note…',
  'awaiting-answer':  'Selecting answer…',
  'submitted':        'Submitting…',
  'done':             'Done!',
}

export function DemoMode() {
  const resetToSetup = useSessionStore((s) => s.resetToSetup)
  const [step, setStep] = useState<Step>('start')
  const [chord, setChord] = useState<Chord | null>(null)
  const [note, setNote] = useState<NoteName | null>(null)
  const [selectedNote, setSelectedNote] = useState<NoteName | null>(null)
  const [selectedChord, setSelectedChord] = useState<string | null>(null)
  const [correct, setCorrect] = useState<boolean | null>(null)
  const ran = useRef(false)

  const scale = buildScale(KEY, 'major')
  const chords = diatonicChords(scale, TIER)
  const notes: NoteName[] = [...scale.notes]

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const q = generateQuestion({ key: KEY, tier: TIER })
    setChord(q.chord)
    setNote(q.note)

    // Step 1 — tonic (user gesture already happened via Demo button)
    setStep('playing-tonic')
    playTonicCadence(KEY)

    // Step 2 — question after tonic finishes (~800 ms)
    setTimeout(() => {
      setStep('playing-question')
      playQuestion(q.chord, q.note)
    }, 900)

    // Step 3 — pretend to "think", then select the correct answer
    setTimeout(() => {
      setStep('awaiting-answer')
      setSelectedNote(q.note)
      setSelectedChord(chordLabel(q.chord))
    }, 3200)

    // Step 4 — submit
    setTimeout(() => {
      setStep('submitted')
      setCorrect(true)
    }, 4200)

    // Step 5 — done
    setTimeout(() => setStep('done'), 5400)
  }, [])

  return (
    <div
      className="min-h-screen bg-brand-900 text-white flex flex-col items-center justify-center p-6 gap-6"
      data-testid="demo-mode"
    >
      <h2 className="text-xl font-bold">Demo Round</h2>
      <p className="text-sm text-white/60">Key of {KEY} · Tier {TIER}</p>

      {/* Progress */}
      <div className="w-full max-w-sm bg-white/10 rounded-lg p-4 text-sm text-brand-100">
        {STEP_LABELS[step]}
      </div>

      {/* Note buttons */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-white/50 mb-2">Note</p>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${notes.length}, 1fr)` }}>
          {notes.map((n) => (
            <div
              key={n}
              className={`py-3 rounded-lg text-sm font-bold text-center transition-colors ${
                selectedNote === n ? 'bg-brand-500 ring-2 ring-brand-300' : 'bg-white/10'
              }`}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Chord buttons */}
      <div className="w-full max-w-sm">
        <p className="text-xs text-white/50 mb-2">Chord</p>
        <div className="grid grid-cols-3 gap-2">
          {chords.map((c) => {
            const label = chordLabel(c)
            return (
              <div
                key={label}
                className={`py-3 rounded-lg text-sm font-bold text-center transition-colors ${
                  selectedChord === label ? 'bg-brand-500 ring-2 ring-brand-300' : 'bg-white/10'
                }`}
              >
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Feedback */}
      {correct !== null && (
        <div className="w-full max-w-sm py-3 px-4 rounded-lg bg-green-500/20 text-green-300 font-medium text-center">
          ✓ Correct! Note: <strong>{note}</strong> · Chord: <strong>{chord ? chordLabel(chord) : ''}</strong>
        </div>
      )}

      <button
        onClick={resetToSetup}
        className="w-full max-w-sm py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
        data-testid="demo-exit-btn"
      >
        ← Back
      </button>
    </div>
  )
}
