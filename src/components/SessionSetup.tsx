import { useState } from 'react'

import type { NoteName, SessionConfig, Tier } from '@/types'
import { useSessionStore } from '@/store/sessionStore'
import { playTonicCadence } from '@/audio'

const MAJOR_KEY_ROOTS: NoteName[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'A#', 'D#', 'G#', 'C#']

const KEY_DISPLAY: Record<NoteName, string> = {
  C: 'C', 'C#': 'C#/Db', D: 'D', 'D#': 'D#/Eb', E: 'E', F: 'F',
  'F#': 'F#/Gb', G: 'G', 'G#': 'G#/Ab', A: 'A', 'A#': 'A#/Bb', B: 'B',
}

export function SessionSetup() {
  const [key, setKey] = useState<NoteName>('C')
  const [tier, setTier] = useState<Tier>(1)
  const startSession = useSessionStore((s) => s.startSession)

  const handleStart = () => {
    const config: SessionConfig = { key, tier }
    playTonicCadence(key)
    startSession(config)
  }

  const handleKeyPreview = (k: NoteName) => {
    setKey(k)
    playTonicCadence(k)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-900 text-white p-6" data-testid="session-setup">
      <h1 className="text-2xl font-bold mb-8">New Session</h1>

      {/* Key selector */}
      <div className="w-full max-w-sm mb-6">
        <label className="block text-sm font-medium text-brand-100 mb-2">Key</label>
        <div className="grid grid-cols-4 gap-2">
          {MAJOR_KEY_ROOTS.map((k) => (
            <button
              key={k}
              onClick={() => handleKeyPreview(k)}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                key === k
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              data-testid={`key-btn-${k}`}
            >
              {KEY_DISPLAY[k]}
            </button>
          ))}
        </div>
      </div>

      {/* Tier selector */}
      <div className="w-full max-w-sm mb-8">
        <label className="block text-sm font-medium text-brand-100 mb-2">Difficulty</label>
        <div className="flex flex-col gap-2">
          {([1, 2] as Tier[]).map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`py-3 px-4 rounded-lg text-left transition-colors ${
                tier === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              data-testid={`tier-btn-${t}`}
            >
              <span className="font-medium">Tier {t}</span>
              <span className="text-sm text-white/70 ml-2">
                {t === 1 ? '— Triads only' : '— Seventh chords'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full max-w-sm py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold text-lg transition-colors"
        data-testid="start-btn"
      >
        Start
      </button>
    </div>
  )
}
