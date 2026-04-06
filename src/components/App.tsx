import { useSessionStore } from '@/store/sessionStore'
import { DEBUG } from '@/debug'

import { AudioGate } from './AudioGate'
import { SessionSetup } from './SessionSetup'
import { ExerciseScreen } from './ExerciseScreen'
import { StatsScreen } from './StatsScreen'
import { DemoMode } from './DemoMode'
import { DebugOverlay } from './DebugOverlay'

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
    </>
  )
}
