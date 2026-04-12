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
    r.onresult?.({ results: [result] })
    r.onend?.()
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

  test('"D minor" transcript selects D note and Dm chord (tier 1)', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 1)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'D minor')

    await expect(page.getByTestId('note-btn-D')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('chord-btn-Dm')).toHaveAttribute('aria-pressed', 'true')
  })

  test('"G seven" transcript selects G note and G7 chord (tier 2)', async ({ page }) => {
    await injectMockSpeechRecognition(page)
    await setup(page, 2)

    await page.getByTestId('voice-btn').click()
    await triggerVoiceResult(page, 'G seven')

    await expect(page.getByTestId('note-btn-G')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('chord-btn-G7')).toHaveAttribute('aria-pressed', 'true')
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
})
