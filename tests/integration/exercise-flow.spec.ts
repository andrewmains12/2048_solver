import { test, expect } from '@playwright/test'
import { passAudioGate, startSession, getVisibleNoteLabels, getVisibleChordLabels } from './helpers'

// Collect console errors so tests can assert no audio engine failures occurred.
test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(err.message))
  ;(page as unknown as Record<string, unknown>).__consoleErrors = errors

  await page.goto('/')
})

/** Asserts no JS errors were thrown during the test (catches silent audio engine failures). */
async function assertNoErrors(page: Parameters<typeof passAudioGate>[0]) {
  const errors = (page as unknown as Record<string, unknown>).__consoleErrors as string[]
  expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0)
}

test('audio gate is shown on first load', async ({ page }) => {
  await expect(page.getByTestId('audio-gate')).toBeVisible()
  await expect(page.getByTestId('session-setup')).not.toBeVisible()
})

test('tapping audio gate shows session setup', async ({ page }) => {
  await passAudioGate(page)
  await expect(page.getByTestId('session-setup')).toBeVisible()
})

test('session setup shows key and tier options', async ({ page }) => {
  await passAudioGate(page)
  await expect(page.getByTestId('key-btn-C')).toBeVisible()
  await expect(page.getByTestId('key-btn-G')).toBeVisible()
  await expect(page.getByTestId('tier-btn-1')).toBeVisible()
  await expect(page.getByTestId('tier-btn-2')).toBeVisible()
  await expect(page.getByTestId('start-btn')).toBeVisible()
})

test('starting a C major tier 1 session shows exercise screen', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page, { key: 'C', tier: 1 })
  await expect(page.getByTestId('exercise-screen')).toBeVisible()
  await assertNoErrors(page)
})

test('C major tier 1 shows exactly 7 diatonic note buttons', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page, { key: 'C', tier: 1 })
  const notes = await getVisibleNoteLabels(page)
  expect(notes).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
})

test('C major tier 1 shows exactly 7 diatonic chord buttons', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page, { key: 'C', tier: 1 })
  const chords = await getVisibleChordLabels(page)
  expect(chords).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°'])
})

test('C major tier 2 shows seventh chord buttons', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page, { key: 'C', tier: 2 })
  const chords = await getVisibleChordLabels(page)
  expect(chords).toEqual(['CΔ7', 'Dm7', 'Em7', 'FΔ7', 'G7', 'Am7', 'Bø7'])
})

test('G major shows F# in note buttons', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page, { key: 'G', tier: 1 })
  const notes = await getVisibleNoteLabels(page)
  expect(notes).toContain('F#')
  expect(notes).not.toContain('F')
})

test('submit button is disabled until both note and chord are selected', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page)

  const submit = page.getByTestId('submit-btn')
  await expect(submit).toBeDisabled()

  await page.getByTestId('note-selector').getByRole('button').first().click()
  await expect(submit).toBeDisabled()

  await page.getByTestId('chord-selector').getByRole('button').first().click()
  await expect(submit).toBeEnabled()
})

test('submitting an answer shows feedback', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page)

  await page.getByTestId('note-selector').getByRole('button').first().click()
  await page.getByTestId('chord-selector').getByRole('button').first().click()
  await page.getByTestId('submit-btn').click()

  const correct = page.getByTestId('feedback-correct')
  const incorrect = page.getByTestId('feedback-incorrect')
  const feedbackVisible = await Promise.race([
    correct.waitFor({ timeout: 2000 }).then(() => true),
    incorrect.waitFor({ timeout: 2000 }).then(() => true),
  ])
  expect(feedbackVisible).toBe(true)
})

test('score counter increments after each answer', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page)

  await page.getByTestId('note-selector').getByRole('button').first().click()
  await page.getByTestId('chord-selector').getByRole('button').first().click()
  await page.getByTestId('submit-btn').click()

  // Wait for next question to load
  await page.waitForTimeout(2200)
  const score = await page.getByTestId('score-counter').textContent()
  expect(score).toMatch(/\d+\/1/)
})

test('play question and play tonic buttons are present on exercise screen', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page)
  await expect(page.getByTestId('replay-btn')).toBeVisible()
  await expect(page.getByTestId('play-tonic-btn')).toBeVisible()
})

test('end session button navigates to stats screen', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page)
  await page.getByTestId('end-session-btn').click()
  await expect(page.getByTestId('stats-screen')).toBeVisible()
})

test('new session button on stats screen returns to setup', async ({ page }) => {
  await passAudioGate(page)
  await startSession(page)
  await page.getByTestId('end-session-btn').click()
  await page.getByTestId('new-session-btn').click()
  await expect(page.getByTestId('session-setup')).toBeVisible()
})
