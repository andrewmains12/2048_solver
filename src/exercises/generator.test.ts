import { describe, it, expect } from 'vitest'

import type { SessionConfig } from '@/types'
import { buildScale, diatonicChords, chordLabel } from '@/theory'

import { generateQuestion } from './generator'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const config = (overrides?: Partial<SessionConfig>): SessionConfig => ({
  key: 'C',
  tier: 1,
  ...overrides,
})

const cMajorNotes = () => buildScale('C', 'major').notes
const cMajorTier1Labels = () => diatonicChords(buildScale('C', 'major'), 1).map(chordLabel)
const cMajorTier2Labels = () => diatonicChords(buildScale('C', 'major'), 2).map(chordLabel)

// ---------------------------------------------------------------------------
// generateQuestion — structural invariants (run many times to stress-test)
// ---------------------------------------------------------------------------
describe('generateQuestion', () => {
  const RUNS = 200

  it('always returns a diatonic note for C major tier 1', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(config())
      expect(cMajorNotes()).toContain(q.note)
    }
  })

  it('always returns a diatonic chord label for C major tier 1', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(config())
      expect(cMajorTier1Labels()).toContain(chordLabel(q.chord))
    }
  })

  it('always returns a tier-2 chord for tier 2', () => {
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(config({ tier: 2 }))
      expect(cMajorTier2Labels()).toContain(chordLabel(q.chord))
    }
  })

  it('always returns diatonic notes for G major', () => {
    const gNotes = buildScale('G', 'major').notes
    for (let i = 0; i < RUNS; i++) {
      const q = generateQuestion(config({ key: 'G' }))
      expect(gNotes).toContain(q.note)
    }
  })

  it('produces varied output (not always the same chord)', () => {
    const labels = new Set<string>()
    for (let i = 0; i < RUNS; i++) {
      labels.add(chordLabel(generateQuestion(config()).chord))
    }
    // With 200 samples from 7 options, probability of missing any one is astronomically low
    expect(labels.size).toBeGreaterThan(1)
  })
})
