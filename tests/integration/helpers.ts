import { type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Oscillator spy — shared by audio-validation and voice-mode tests
// ---------------------------------------------------------------------------

/**
 * Patches AudioContext.createOscillator before the page loads so every
 * oscillator creation and start is counted. Must be called before page.goto().
 */
export async function injectOscillatorSpy(page: Page): Promise<void> {
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

export async function getOscCounts(page: Page): Promise<{ created: number; started: number }> {
  return page.evaluate(() => ({
    created: (window as unknown as Record<string, number>).__oscCreateCount ?? 0,
    started: (window as unknown as Record<string, number>).__oscStartCount ?? 0,
  }))
}

/**
 * Passes the iOS audio gate by clicking it.
 * The audio module is mocked in integration tests so no real audio plays.
 */
export async function passAudioGate(page: Page): Promise<void> {
  await page.getByTestId('audio-gate').click()
  await page.getByTestId('session-setup').waitFor()
}

/**
 * Configures and starts a session from the setup screen.
 */
export async function startSession(
  page: Page,
  options: { key?: string; tier?: 1 | 2 } = {},
): Promise<void> {
  const { key = 'C', tier = 1 } = options
  if (key !== 'C') {
    await page.getByTestId(`key-btn-${key}`).click()
  }
  if (tier !== 1) {
    await page.getByTestId(`tier-btn-${tier}`).click()
  }
  await page.getByTestId('start-btn').click()
  await page.getByTestId('exercise-screen').waitFor()
}

/**
 * Reads all visible note button labels from the exercise screen.
 */
export async function getVisibleNoteLabels(page: Page): Promise<string[]> {
  const buttons = await page.getByTestId('note-selector').getByRole('button').all()
  return Promise.all(buttons.map((b) => b.textContent().then((t) => t?.trim() ?? '')))
}

/**
 * Reads all visible chord button labels from the exercise screen.
 */
export async function getVisibleChordLabels(page: Page): Promise<string[]> {
  const buttons = await page.getByTestId('chord-selector').getByRole('button').all()
  return Promise.all(buttons.map((b) => b.textContent().then((t) => t?.trim() ?? '')))
}

/**
 * Selects a note and chord answer then submits.
 */
export async function submitAnswer(
  page: Page,
  note: string,
  chord: string,
): Promise<void> {
  await page.getByTestId(`note-btn-${note}`).click()
  await page.getByTestId(`chord-btn-${chord}`).click()
  await page.getByTestId('submit-btn').click()
}
