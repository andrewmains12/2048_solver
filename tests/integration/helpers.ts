import { type Page } from '@playwright/test'

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
