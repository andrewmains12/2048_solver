# Testing Strategy

## Philosophy

- **Logic is pure, so test it purely.** `src/theory/` and `src/exercises/` have no side effects. Every function takes inputs and returns outputs — test those outputs completely.
- **Keep tests DRY.** Factor shared construction into helper functions. Never repeat a setup block.
- **Strong assertions.** Assert on the full return value using `toEqual`, not on individual properties. If a function returns an object, assert the whole object.
- **No "does not throw" tests.** That's not an assertion. Test what the function returns.

## Test Layout

```
src/
  theory/
    notes.test.ts
    scales.test.ts
    chords.test.ts
  exercises/
    generator.test.ts
    validator.test.ts
    stats.test.ts
  lib/
    voiceParser.test.ts       Voice transcript parser
tests/
  integration/
    exercise-flow.spec.ts     Core exercise flow (Playwright)
    audio-validation.spec.ts  Web Audio API oscillator spy (Playwright)
    voice-mode.spec.ts        Voice input with mocked Speech API (Playwright)
    visual-verify.spec.ts     AI-in-the-loop visual verification (Playwright + Claude API)
```

## Unit Test Conventions (Vitest)

### Shared setup pattern

```typescript
// BAD — repeated setup in every test
it('returns C major scale', () => {
  const result = buildScale('C', 'major')
  expect(result.notes[0]).toBe('C')
})

// GOOD — factory function, assert full value
const cMajor = () => buildScale('C', 'major')

it('returns C major scale', () => {
  expect(cMajor()).toEqual({
    root: 'C',
    type: 'major',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  })
})
```

### Full-value assertions

```typescript
// BAD
expect(chord.root).toBe('G')
expect(chord.quality).toBe('dominant7')

// GOOD
expect(chord).toEqual({ root: 'G', quality: 'dominant7' })
```

### Parameterized tests for exhaustive coverage

```typescript
it.each([
  ['C', 'major', ['C','D','E','F','G','A','B']],
  ['G', 'major', ['G','A','B','C','D','E','F#']],
  ['F', 'major', ['F','G','A','Bb','C','D','E']],
])('buildScale(%s, %s) returns %j', (root, type, expected) => {
  expect(buildScale(root, type).notes).toEqual(expected)
})
```

## Integration Tests (Playwright)

### Core flow test (`exercise-flow.spec.ts`)

Tests the full exercise loop without audio (audio is mocked):
1. Launch app
2. Tap audio gate
3. Select key + tier, start session
4. Verify exercise screen renders correct note and chord buttons for the key
5. Select a note and chord, submit
6. Verify feedback appears
7. Verify next question loads

### AI Visual Verification (`visual-verify.spec.ts`)

Uses the Claude API to verify UI screenshots match expected descriptions. This catches visual regressions (layout broken, button missing, wrong color) that DOM assertions miss.

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { test, expect } from '@playwright/test'
import fs from 'fs'

const claude = new Anthropic() // uses ANTHROPIC_API_KEY env var

async function assertScreenLooksLike(
  screenshotPath: string,
  description: string,
): Promise<void> {
  const image = fs.readFileSync(screenshotPath).toString('base64')
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: image } },
        { type: 'text', text: `Does this screenshot match the description: "${description}"? Reply with JSON: {"matches": true/false, "reason": "..."}` },
      ],
    }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const result = JSON.parse(text) as { matches: boolean; reason: string }
  expect(result.matches, `Visual assertion failed: ${result.reason}`).toBe(true)
}
```

### Running AI tests

AI visual tests require `ANTHROPIC_API_KEY` and incur API cost. They are gated:

```bash
ANTHROPIC_API_KEY=sk-... npm run test:integration
```

Without the key set, the visual verification tests skip gracefully.

## Audio Testing

Tone.js / Web Audio is stubbed in unit tests (`src/test-setup.ts`). Integration tests mock the audio engine module so tests don't depend on speaker output. Audio correctness is validated by inspecting the note/chord values passed to the engine, not by listening.

## Feature Implementation Checklist

For every new user-facing feature, the following must exist before the work is considered done:

1. **Type check + unit tests**: run `npm run lint && npm test`. `npm run lint` runs `tsc --noEmit` and must pass — Vitest uses esbuild which skips type checking, so type errors only surface at build time unless you run `tsc` explicitly. Unit tests (Vitest, colocated with the source file) cover any pure logic introduced — parsers, validators, generators, helpers. Follow the full-value assertion and parameterised-test patterns above.

2. **Playwright E2E tests** (`tests/integration/<feature>.spec.ts`) covering:
   - Happy path: the feature works end-to-end as intended
   - Degraded path: the feature fails gracefully (API absent, permission denied, network error)
   - Regression check: no adjacent behaviour is broken

3. **Browser API mocking via `page.addInitScript()`** for any feature that depends on a browser API not available in headless Chromium (Web Speech, Notifications, Camera, Geolocation, etc.). Use the oscillator spy in `audio-validation.spec.ts` and the Speech API mock in `voice-mode.spec.ts` as reference patterns. "It's hard to mock" is not an acceptable reason to skip Playwright coverage — mock the API.

4. **Agent visual inspection** (Level 3 in AGENTS.md): take Playwright screenshots of every new UI state introduced by the feature and verify they look correct before marking work ready for human review. Logic tests do not catch layout breaks, missing elements, or wrong visual states.

Skipping any of the above levels requires an explicit, documented reason. The default is: all four levels must pass.
