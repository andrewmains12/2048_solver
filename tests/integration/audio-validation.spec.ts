/**
 * Audio validation tests.
 *
 * These tests spy on the browser's Web Audio API (OscillatorNode.start) to
 * verify that audio nodes are actually created and started — not just that our
 * code calls Tone.js, but that Tone.js follows through to real oscillators.
 *
 * Run against WebKit for the closest approximation of iOS Safari behaviour:
 *   npx playwright install webkit
 *   npm run test:integration -- --project=webkit --grep "audio"
 *
 * On Mac, WebKit uses the same engine as iOS Safari and enforces the same
 * user-gesture rules for Web Audio, making it a reliable proxy for phone testing.
 */

import { test, expect, type Page } from '@playwright/test'
import { passAudioGate, startSession } from './helpers'

// ---------------------------------------------------------------------------
// Spy injection
// ---------------------------------------------------------------------------

/**
 * Injects a counter into the page that increments every time an OscillatorNode
 * is started. Must be called before page.goto() so it runs before Tone.js loads.
 */
async function injectOscillatorSpy(page: Page): Promise<void> {
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).__oscStartCount = 0
    ;(window as unknown as Record<string, unknown>).__oscCreateCount = 0

    const AnyAC =
      window.AudioContext ?? (window as unknown as Record<string, unknown>).webkitAudioContext
    if (!AnyAC) return

    const origCreate = (AnyAC as typeof AudioContext).prototype.createOscillator
    ;(AnyAC as typeof AudioContext).prototype.createOscillator = function () {
      ;(window as unknown as Record<string, number>).__oscCreateCount++
      const osc = origCreate.call(this)
      const origStart = osc.start.bind(osc)
      osc.start = (...args: Parameters<typeof osc.start>) => {
        ;(window as unknown as Record<string, number>).__oscStartCount++
        return origStart(...args)
      }
      return osc
    }
  })
}

async function getOscCounts(page: Page): Promise<{ created: number; started: number }> {
  return page.evaluate(() => ({
    created: (window as unknown as Record<string, number>).__oscCreateCount ?? 0,
    started: (window as unknown as Record<string, number>).__oscStartCount ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('audio validation', () => {
  test.beforeEach(async ({ page }) => {
    // Collect page errors so failures surface clearly
    page.on('pageerror', (err) => console.error('[pageerror]', err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('[console error]', msg.text())
      if (msg.text().startsWith('[audio]')) console.log('[app audio]', msg.text())
    })
    await injectOscillatorSpy(page)
    await page.goto('/')
  })

  test('tapping AudioGate + initAudio creates at least one oscillator (warm-up)', async ({
    page,
  }) => {
    await passAudioGate(page)
    // initAudio plays a warm-up note synchronously on the gesture
    const counts = await getOscCounts(page)
    expect(counts.created, 'No oscillators created after AudioGate tap').toBeGreaterThan(0)
  })

  test('Play Question button starts oscillators for the chord and melody note', async ({
    page,
  }) => {
    await passAudioGate(page)
    await startSession(page)

    const before = await getOscCounts(page)
    await page.getByTestId('replay-btn').click()

    // Give Tone.js scheduler time to start the oscillators
    await page.waitForTimeout(400)

    const after = await getOscCounts(page)
    expect(
      after.started - before.started,
      'Expected oscillators to start after clicking Play Question',
    ).toBeGreaterThan(0)
    // A chord (3–4 notes) + melody note = at least 4 oscillators
    expect(
      after.created - before.created,
      'Expected at least 4 oscillators created for chord + note',
    ).toBeGreaterThanOrEqual(4)
  })

  test('Tonic button starts oscillators for the arpeggio', async ({ page }) => {
    await passAudioGate(page)
    await startSession(page)

    const before = await getOscCounts(page)
    await page.getByTestId('play-tonic-btn').click()

    await page.waitForTimeout(400)

    const after = await getOscCounts(page)
    expect(
      after.started - before.started,
      'Expected oscillators to start after clicking Tonic',
    ).toBeGreaterThan(0)
    // Tonic cadence = 3 arpeggiated notes
    expect(after.created - before.created).toBeGreaterThanOrEqual(3)
  })

  test('no console errors during full play flow', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))

    await passAudioGate(page)
    await startSession(page)
    await page.getByTestId('replay-btn').click()
    await page.waitForTimeout(400)

    expect(errors, `Console errors during play flow: ${errors.join('; ')}`).toHaveLength(0)
  })
})
