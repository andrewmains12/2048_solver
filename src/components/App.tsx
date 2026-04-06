import { useSessionStore } from '@/store/sessionStore'
import { DEBUG } from '@/debug'

import { AudioGate } from './AudioGate'
import { SessionSetup } from './SessionSetup'
import { ExerciseScreen } from './ExerciseScreen'
import { StatsScreen } from './StatsScreen'
import { DemoMode } from './DemoMode'
import { DebugOverlay } from './DebugOverlay'

declare const __BUILD_TIME__: string
declare const __GIT_BRANCH__: string

export function App() {
  const { audioReady, phase } = useSessionStore()

  return (
    <>
      {!audioReady && <AudioGate />}
      {audioReady && phase === 'setup' && <SessionSetup />}
      {audioReady && phase === 'playing' && <ExerciseScreen />}
      {audioReady && phase === 'complete' && <StatsScreen />}
      {audioReady && phase === 'demo' && <DemoMode />}
      {DEBUG && <DebugOverlay />}
      <footer className="fixed bottom-0 left-0 right-0 text-center text-xs text-white/30 py-1 pointer-events-none select-none">
        {__GIT_BRANCH__} &middot; {new Date(__BUILD_TIME__).toLocaleString()}
      </footer>
    </>
  )
}
