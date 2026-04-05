import { create } from 'zustand'

import type { Question, Result, SessionConfig, SessionStats } from '@/types'
import { generateQuestion } from '@/exercises/generator'
import { applyResult, createSessionStats } from '@/exercises/stats'

type Phase = 'setup' | 'playing' | 'complete'

type SessionState = {
  phase: Phase
  config: SessionConfig | null
  currentQuestion: Question | null
  stats: SessionStats
  audioReady: boolean

  setAudioReady: () => void
  startSession: (config: SessionConfig) => void
  nextQuestion: () => void
  recordResult: (result: Result) => void
  endSession: () => void
  resetToSetup: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  phase: 'setup',
  config: null,
  currentQuestion: null,
  stats: createSessionStats(),
  audioReady: false,

  setAudioReady: () => set({ audioReady: true }),

  startSession: (config: SessionConfig) => {
    const question = generateQuestion(config)
    set({ phase: 'playing', config, currentQuestion: question, stats: createSessionStats() })
  },

  nextQuestion: () => {
    const { config } = get()
    if (!config) return
    set({ currentQuestion: generateQuestion(config) })
  },

  recordResult: (result: Result) => {
    set((s) => ({ stats: applyResult(s.stats, result) }))
  },

  endSession: () => set({ phase: 'complete' }),

  resetToSetup: () =>
    set({ phase: 'setup', config: null, currentQuestion: null, stats: createSessionStats() }),
}))
