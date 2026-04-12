import { useState } from 'react'

import type { NoteName, Tier } from '@/types'
import { useSessionStore } from '@/store/sessionStore'
import { playTonicCadence } from '@/audio'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const MAJOR_KEY_ROOTS: NoteName[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'A#', 'D#', 'G#', 'C#']

const KEY_DISPLAY: Record<NoteName, string> = {
  C: 'C', 'C#': 'C#/Db', D: 'D', 'D#': 'D#/Eb', E: 'E', F: 'F',
  'F#': 'F#/Gb', G: 'G', 'G#': 'G#/Ab', A: 'A', 'A#': 'A#/Bb', B: 'B',
}

export function SessionSetup() {
  const [key, setKey] = useState<NoteName>('C')
  const [tier, setTier] = useState<Tier>(1)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const startSession = useSessionStore((s) => s.startSession)
  const startDemo = useSessionStore((s) => s.startDemo)
  const { canPrompt, isIOS, isInstalled, triggerInstall } = useInstallPrompt()

  const handleInstall = () => {
    if (isIOS) {
      setShowIOSInstructions(true)
    } else {
      triggerInstall()
    }
  }

  const showInstallButton = !isInstalled && (canPrompt || isIOS)

  const handleStart = () => {
    startSession({ key, tier })
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

      <button
        onClick={startDemo}
        className="w-full max-w-sm py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-sm text-white/70 transition-colors mt-2"
        data-testid="demo-btn"
      >
        ▶ Demo round
      </button>

      {showInstallButton && (
        <button
          onClick={handleInstall}
          className="w-full max-w-sm py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-sm text-white/70 transition-colors mt-2"
          data-testid="install-btn"
        >
          + Add to Home Screen
        </button>
      )}

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" onClick={() => setShowIOSInstructions(false)}>
          <div className="bg-brand-800 rounded-t-2xl p-6 w-full max-w-sm mb-0 pb-safe" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-3">Add to Home Screen</h2>
            <ol className="text-sm text-white/80 space-y-2 list-decimal list-inside">
              <li>Tap the <strong>Share</strong> button in Safari's toolbar</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> to confirm</li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-5 py-3 bg-brand-500 hover:bg-brand-600 rounded-xl font-medium text-sm transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
