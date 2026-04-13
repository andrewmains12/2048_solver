/**
 * Voice mode integration tests.
 *
 * The Web Speech API (window.webkitSpeechRecognition / window.SpeechRecognition)
 * is not available in Playwright's headless Chromium. We inject a mock via
 * page.addInitScript() before navigation — the same pattern used for the
 * oscillator spy in audio-validation.spec.ts.
 *
 * The mock exposes `window.__mockRecognition` while a recognition session is
 * active, allowing tests to fire synthetic results or errors via page.evaluate().
 */

import { test, expect, type Page } from '@playwright/test'
import { passAudioGate, startSession } from './helpers'

// ---------------------------------------------------------------------------
// Mock injection
// ---------------------------------------------------------------------------

async function injectMockSpeechRecognition(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      lang = ''
      continuous = false
      interimResults = false
      maxAlternatives = 1

      onstart: (() => void) | null = null
      onresult: ((e: SpeechRecognitionEvent) => void) | null = null
      onerror: ((e: SpeechRecognitionErrorEvent) => void) | null = null
      onend: (() => void) | null = null

      start() {
        ;(window as unknown as Record<string, unknown>).__mockRecognition = this
        this.onstart?.()
      }

      abort() {
        // Mirrors real API: abort fires onerror('aborted') then onend
        this.onerror?.({ error: 'aborted' } as SpeechRecognitionErrorEvent)
        this.onend?.()
        ;(window as unknown as Record<string, unknown>).__mockRecognition = null
      }
    }

    // Override both the unprefixed and webkit-prefixed APIs so the hook always
    // finds our mock regardless of which the browser natively exposes.
    ;(window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition
    ;(window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition
  })
}

/** Removes both Speech API globals so the hook sees an unsupported environment. */
async function removeSpeechRecognition(page: Page): Promise<void> {
  await page.addInitScript(() => {
    delete (window as unknown as Record<string, unknown>).SpeechRecognition
    delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  })
}

/** Fire a synthetic speech result from the currently-active mock recognition. */
async function triggerVoiceResult(page: Page, transcript: string): Promise<void> {
  await page.evaluate((t) => {
    const r = (window as unknown as Record<string, unknown>).__mockRecognition as {
      onresult: ((e: unknown) => void) | null
      onend: (() => void) | null
    } | null
    if (!r) throw new Error('No active mock recognition — did you click the mic button?')
    // Mimic the real SpeechRecognitionResultList shape: results[i].isFinal and results[i][0].transcript
    const alternative = { transcript: t, confidence: 1 }
    const result = Object.assign([alternative], { isFinal: true })
    r.onresult?.({ results: [result], resultIndex: 0 })
    r.onend?.()
  }, transcript)
}

/**
 * Fire a final segment without ending the recognition session.
 * Used to simulate multiple breath groups arriving within a single continuous session
 * (e.g. to test the per-segment parser fix — P0).
 */
async function triggerVoiceSegmentKeepAlive(page: Page, transcript: string): Promise<void> {
  await page.evaluate((t) => {
    const r = (window as unknown as Record<string, unknown>).__mockRecognition as {
      onresult: ((e: unknown) => void) | null
    } | null
    if (!r) throw new Error('No active mock recognition — did you click the mic button?')
    const alternative = { transcript: t, confidence: 1 }
    const result = Object.assign([alternative], { isFinal: true })
    r.onresult?.({ results: [result], resultIndex: 0 })
    // Intentionally NO onend — session stays active for the next segment
  }, transcript)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate, pass audio gate, and start a C major session at the given tier. */
async function setup(page: Page, tier: 1 | 2 = 1): Promise<void> {
  await page.goto('/')
  await passAudioGate(page)
  await startSession(page, { key: 'C', tier })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('voice mode', () => {
  test('mic button is visible on the exercise screen', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page)
    await expect(page.getByTestId('voice-btn')).toBeVisible()
  })

  test('clicking mic button enters listening state', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page)

    await page.getByTestId('voice-btn').click()

    // Button should show the "Listening…" label while active
    await expect(page.getByTestId('voice-btn')).toContainText('Listening')
  })

  test('"D minor" fills chord Dm but leaves note empty (waits for next segment)', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 1)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor')

    await expect(page.getByTestId('chord-btn-Dm')).toHaveAttribute('aria-pressed', 'true')
    // Note should NOT be auto-filled from chord root
    await expect(page.getByTestId('note-btn-D')).toHaveAttribute('aria-pressed', 'false')
  })

  test('"D minor E" fills both chord Dm and note E', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 1)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor E')

    await expect(page.getByTestId('chord-btn-Dm')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('note-btn-E')).toHaveAttribute('aria-pressed', 'true')
  })

  test('"G seven" fills chord G7 but leaves note empty (tier 2)', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 2)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'G seven')

    await expect(page.getByTestId('chord-btn-G7')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('note-btn-G')).toHaveAttribute('aria-pressed', 'false')
  })

  test('chord + separate melody note across two segments ("G seven" then "B")', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 2)

    await page.getByTestId('voice-btn').click()
    // Simulate the continuous-mode accumulation: two segments arriving as one event
    await triggerVoiceResult(page, 'G seven B')

    await expect(page.getByTestId('note-btn-B')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('chord-btn-G7')).toHaveAttribute('aria-pressed', 'true')
  })

  test('"F sharp" transcript selects F# note (enharmonic / sharp spelling)', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    // Use G major where F# is the 7th scale degree
    await page.goto('/')
    await passAudioGate(page)
    await startSession(page, { key: 'G', tier: 1 })

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'F sharp')

    // F# is the 7th scale degree in G major
    await expect(page.getByTestId('note-btn-F#')).toHaveAttribute('aria-pressed', 'true')
  })

  test('clicking mic again while listening stops recognition (returns to idle)', async ({
    page,
  }) => {
    await injectMockSpeechRecognition(page)
    await setup(page)

    // Start listening
    await page.getByTestId('voice-btn').click()
    await expect(page.getByTestId('voice-btn')).toContainText('Listening')

    // Toggle off
    await page.getByTestId('voice-btn').click()
    await expect(page.getByTestId('voice-btn')).not.toContainText('Listening')
  })

  test('voice result auto-stops recognition after result fires', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor')

    // After result + onend, button should return to idle (no "Listening…" text)
    await expect(page.getByTestId('voice-btn')).not.toContainText('Listening')
  })

  test('transcript display shows what was heard after recognition', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor')

    // Transcript line should show the recognised text in quotes
    await expect(page.getByTestId('voice-transcript')).toContainText('D minor')
  })

  test('mic button is disabled when Speech API is absent', async ({ page }) => {
    // Explicitly remove both Speech API globals before navigation
    await removeSpeechRecognition(page)
    await setup(page)
    const btn = page.getByTestId('voice-btn')
    await expect(btn).toBeDisabled()
  })

  test('no console errors during voice flow', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await injectMockSpeechRecognition(page)
    await setup(page)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'C minor')

    expect(errors, `Console errors during voice flow: ${errors.join('; ')}`).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // P0 — Per-segment parsing (answer stickiness fix)
  // -------------------------------------------------------------------------

  test('second voice segment overwrites first — no answer stickiness', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 1)

    await page.getByTestId('voice-btn').click()

    // First segment: G major triad (chord label "G" in C major tier 1)
    await triggerVoiceSegmentKeepAlive(page, 'G major')
    await expect(page.getByTestId('chord-btn-G')).toHaveAttribute('aria-pressed', 'true')

    // Second segment in the same continuous session: D minor
    // Without the P0 fix the parser would see "G major D minor", match G first,
    // and return { noteName: 'D', chordLabel: 'G' } — chord stays G, note D filled.
    // With the fix it sees only "D minor" and returns { chordLabel: 'Dm' }.
    await triggerVoiceResult(page, 'D minor')

    await expect(page.getByTestId('chord-btn-Dm')).toHaveAttribute('aria-pressed', 'true')
    // chord G should no longer be selected
    await expect(page.getByTestId('chord-btn-G')).toHaveAttribute('aria-pressed', 'false')
    // note D should NOT be filled (only the chord, no trailing melody note)
    await expect(page.getByTestId('note-btn-D')).toHaveAttribute('aria-pressed', 'false')
  })

  // -------------------------------------------------------------------------
  // P2 — Hands-free voice commands
  // -------------------------------------------------------------------------

  test('voice "submit" command submits the answer when both selections are filled', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 1)

    // Fill both selectors via a single voice utterance
    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor E')
    await expect(page.getByTestId('chord-btn-Dm')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('note-btn-E')).toHaveAttribute('aria-pressed', 'true')

    // Speak "submit" — should trigger handleSubmit
    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'submit')

    // After submit, "Check again" and "Next" buttons become visible
    await expect(page.getByTestId('check-again-btn')).toBeVisible()
    await expect(page.getByTestId('next-btn')).toBeVisible()
  })

  test('voice "next" command advances to the next question', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 1)

    // Fill and submit via button clicks so we can test voice "next" independently
    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor E')
    await page.getByTestId('submit-btn').click()

    await expect(page.getByTestId('check-again-btn')).toBeVisible()

    // Speak "next" — should advance question and reset state
    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'next')

    // After advancing, submit button is back (hasSubmitted reset)
    await expect(page.getByTestId('submit-btn')).toBeVisible()
    await expect(page.getByTestId('check-again-btn')).not.toBeVisible()
  })
})
