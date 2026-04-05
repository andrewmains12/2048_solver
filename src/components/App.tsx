import { useSessionStore } from '@/store/sessionStore'

import { AudioGate } from './AudioGate'
import { SessionSetup } from './SessionSetup'
import { ExerciseScreen } from './ExerciseScreen'
import { StatsScreen } from './StatsScreen'

export function App() {
  const { audioReady, phase } = useSessionStore()

  if (!audioReady) return <AudioGate />
  if (phase === 'setup') return <SessionSetup />
  if (phase === 'playing') return <ExerciseScreen />
  if (phase === 'complete') return <StatsScreen />

  return null
}
