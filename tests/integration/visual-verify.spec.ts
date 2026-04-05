/**
 * AI-in-the-loop visual verification tests.
 *
 * These tests capture screenshots of key UI states and ask Claude to verify
 * that the layout matches a plain-English description. This catches visual
 * regressions (broken layout, wrong colours, missing elements) that DOM
 * assertions can't detect.
 *
 * Requirements:
 *   - ANTHROPIC_API_KEY env var must be set
 *   - Tests skip gracefully when the key is absent
 */

import { test, expect, type Page } from '@playwright/test'
import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import { passAudioGate, startSession } from './helpers'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
async function assertScreenLooksLike(
  page: Page,
  description: string,
  testName: string,
): Promise<void> {
  const screenshotPath = `playwright-report/screenshots/${testName.replace(/\s+/g, '-')}.png`
  fs.mkdirSync('playwright-report/screenshots', { recursive: true })

  await page.screenshot({ path: screenshotPath, fullPage: true })

  const client = new Anthropic() // reads ANTHROPIC_API_KEY from env
  const imageData = fs.readFileSync(screenshotPath).toString('base64')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/png', data: imageData },
          },
          {
            type: 'text',
            text: `Does this screenshot match the following description? "${description}"\n\nReply with JSON only: {"matches": true or false, "reason": "brief explanation"}`,
          },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  let result: { matches: boolean; reason: string }
  try {
    result = JSON.parse(text)
  } catch {
    result = { matches: false, reason: `Could not parse Claude response: ${text}` }
  }

  expect(result.matches, `Visual assertion failed: ${result.reason}`).toBe(true)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
const hasApiKey = !!process.env.ANTHROPIC_API_KEY

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('audio gate has a dark background with a tap prompt', async ({ page }) => {
  test.skip(!hasApiKey, 'ANTHROPIC_API_KEY not set — skipping visual test')
  await assertScreenLooksLike(
    page,
    'A full-screen dark indigo/purple background with a music note emoji, the title "Solfege Trainer", and a "Tap anywhere to begin" prompt in the centre.',
    'audio-gate',
  )
})

test('session setup screen shows key and difficulty options', async ({ page }) => {
  test.skip(!hasApiKey, 'ANTHROPIC_API_KEY not set — skipping visual test')
  await passAudioGate(page)
  await assertScreenLooksLike(
    page,
    'A dark screen titled "New Session" with a grid of key selector buttons (C, G, D, A etc.) and two difficulty tier buttons, followed by a prominent Start button.',
    'session-setup',
  )
})

test('exercise screen shows note and chord button grids', async ({ page }) => {
  test.skip(!hasApiKey, 'ANTHROPIC_API_KEY not set — skipping visual test')
  await passAudioGate(page)
  await startSession(page)
  await assertScreenLooksLike(
    page,
    'A dark exercise screen with a header showing key and score, a "Play Again" button, a row of 7 note buttons (C D E F G A B), a grid of chord buttons, and a disabled Submit button.',
    'exercise-screen',
  )
})

test('stats screen shows accuracy bars after ending session', async ({ page }) => {
  test.skip(!hasApiKey, 'ANTHROPIC_API_KEY not set — skipping visual test')
  await passAudioGate(page)
  await startSession(page)
  await page.getByTestId('end-session-btn').click()
  await assertScreenLooksLike(
    page,
    'A dark stats screen titled "Session Stats" showing a score (e.g. 0/0), and a "New Session" button at the bottom.',
    'stats-screen',
  )
})
