import { initAudio } from '@/audio'
import { useSessionStore } from '@/store/sessionStore'

export function AudioGate() {
  const setAudioReady = useSessionStore((s) => s.setAudioReady)

  const handleTap = async () => {
    await initAudio()
    setAudioReady()
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-brand-900 text-white cursor-pointer select-none"
      onClick={handleTap}
      role="button"
      aria-label="Tap to start"
      data-testid="audio-gate"
    >
      <div className="text-6xl mb-6">🎵</div>
      <h1 className="text-3xl font-bold mb-3">Solfege Trainer</h1>
      <p className="text-brand-100 text-lg">Tap anywhere to begin</p>
    </div>
  )
}
