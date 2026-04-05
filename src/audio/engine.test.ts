import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { Chord, NoteName } from '@/types'

/**
 * Mock Tone.js entirely so the audio engine can be tested without Web Audio.
 * We capture all triggerAttackRelease calls and assert on their arguments.
 */

const mockTriggerAttackRelease = vi.fn()
const mockToDestination = vi.fn()
const mockSynthInstance = {
  triggerAttackRelease: mockTriggerAttackRelease,
  toDestination: mockToDestination,
}
mockToDestination.mockReturnValue(mockSynthInstance)

const mockContextResume = vi.fn().mockResolvedValue(undefined)

vi.mock('tone', () => ({
  PolySynth: vi.fn().mockReturnValue(mockSynthInstance),
  Synth: class MockSynth {},
  start: vi.fn().mockResolvedValue(undefined),
  now: vi.fn().mockReturnValue(1.0),
  context: { state: 'running', resume: mockContextResume },
  getDestination: vi.fn().mockReturnValue({ volume: { value: 0 } }),
}))

// Import engine AFTER mocks are set up
const { initAudio, playTonicCadence, playQuestion, getContextState } = await import('./engine')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type TARCall = { notes: string | string[]; duration: number | string; time: number }

function getTARCalls(): TARCall[] {
  return mockTriggerAttackRelease.mock.calls.map(([notes, duration, time]) => ({
    notes,
    duration,
    time,
  }))
}

const LOOKAHEAD = 0.15
const NOW = 1.0 // matches Tone.now() mock

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockTriggerAttackRelease.mockClear()
  mockContextResume.mockClear()
})

// ---------------------------------------------------------------------------
// initAudio
// ---------------------------------------------------------------------------
describe('initAudio', () => {
  it('plays a warm-up note on the synth', async () => {
    await initAudio()
    const calls = getTARCalls()
    expect(calls.length).toBeGreaterThanOrEqual(1)
    expect(calls[0].notes).toBe('C4')
  })

  it('is idempotent — warm-up plays only once on repeated calls', async () => {
    mockTriggerAttackRelease.mockClear()
    await initAudio()
    await initAudio()
    await initAudio()
    // All subsequent calls are no-ops; triggerAttackRelease not called again
    expect(mockTriggerAttackRelease).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// playTonicCadence
// ---------------------------------------------------------------------------
describe('playTonicCadence', () => {
  it('plays 3 arpeggiated notes for a major tonic', () => {
    playTonicCadence('C')
    const calls = getTARCalls()
    expect(calls).toHaveLength(3)
  })

  it('staggers the arpeggio notes 180 ms apart starting at NOW + LOOKAHEAD', () => {
    playTonicCadence('C')
    const calls = getTARCalls()
    const start = NOW + LOOKAHEAD
    expect(calls[0].time).toBeCloseTo(start, 5)
    expect(calls[1].time).toBeCloseTo(start + 0.18, 5)
    expect(calls[2].time).toBeCloseTo(start + 0.36, 5)
  })

  it('voices C major tonic in octave 3', () => {
    playTonicCadence('C')
    const calls = getTARCalls()
    expect(calls.map((c) => c.notes)).toEqual(['C3', 'E3', 'G3'])
  })

  it('bumps notes below root into the next octave for G major tonic', () => {
    playTonicCadence('G')
    const calls = getTARCalls()
    // G3 B3 D4 — D has semitone 2 < G semitone 7, bumps to octave 4
    expect(calls.map((c) => c.notes)).toEqual(['G3', 'B3', 'D4'])
  })
})

// ---------------------------------------------------------------------------
// playQuestion
// ---------------------------------------------------------------------------

const gDom7: Chord = { root: 'G', quality: 'dominant7' }
const noteB: NoteName = 'B'

describe('playQuestion', () => {
  it('makes exactly 2 triggerAttackRelease calls (chord + melody note)', () => {
    playQuestion(gDom7, noteB)
    expect(getTARCalls()).toHaveLength(2)
  })

  it('plays the chord first, at NOW + LOOKAHEAD', () => {
    playQuestion(gDom7, noteB)
    const [chordCall] = getTARCalls()
    expect(chordCall.time).toBeCloseTo(NOW + LOOKAHEAD, 5)
  })

  it('voices G7 chord correctly — notes below root bumped up an octave', () => {
    playQuestion(gDom7, noteB)
    const [chordCall] = getTARCalls()
    // G4, B4 stay at octave 4; D and F have lower semitones than G → octave 5
    expect(chordCall.notes).toEqual(['G4', 'B4', 'D5', 'F5'])
  })

  it('plays melody note at octave 5 after chord + pause', () => {
    playQuestion(gDom7, noteB)
    const [, noteCall] = getTARCalls()
    const expectedTime = NOW + LOOKAHEAD + 1.5 + 0.35
    expect(noteCall.notes).toBe('B5')
    expect(noteCall.time).toBeCloseTo(expectedTime, 5)
  })

  it('uses chord duration of 1.5 s and note duration of 1.5 s', () => {
    playQuestion(gDom7, noteB)
    const [chordCall, noteCall] = getTARCalls()
    expect(chordCall.duration).toBe(1.5)
    expect(noteCall.duration).toBe(1.5)
  })

  it('calls onDone callback after total playback duration', () => {
    vi.useFakeTimers()
    const onDone = vi.fn()
    playQuestion(gDom7, noteB, onDone)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime((1.5 + 0.35 + 1.5) * 1000)
    expect(onDone).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('voices C major chord correctly — all notes stay in octave 4', () => {
    playQuestion({ root: 'C', quality: 'major' }, 'E')
    const [chordCall] = getTARCalls()
    expect(chordCall.notes).toEqual(['C4', 'E4', 'G4'])
  })

  it('voices B diminished chord correctly', () => {
    playQuestion({ root: 'B', quality: 'diminished' }, 'D')
    const [chordCall] = getTARCalls()
    // B4, D5 (semitone 2 < 11), F5 (semitone 5 < 11)
    expect(chordCall.notes).toEqual(['B4', 'D5', 'F5'])
  })

  it('resumes context if suspended before playing', async () => {
    const Tone = vi.mocked(await import('tone'))
    // Temporarily simulate suspended context
    Object.defineProperty(Tone.context, 'state', { value: 'suspended', configurable: true })
    playQuestion(gDom7, noteB)
    expect(mockContextResume).toHaveBeenCalledOnce()
    Object.defineProperty(Tone.context, 'state', { value: 'running', configurable: true })
  })
})

// ---------------------------------------------------------------------------
// getContextState
// ---------------------------------------------------------------------------
describe('getContextState', () => {
  it('reflects Tone.context.state', () => {
    expect(getContextState()).toBe('running')
  })
})
