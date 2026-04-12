# Feature Registry

High-level status for every feature area. Each entry links to the relevant spec or
progress doc. For the full exercise specification see [`docs/features.md`](docs/features.md).

## Shipped

| Feature | Detail |
|---|---|
| Core exercise — note + chord identification | [`docs/features.md`](docs/features.md) |
| Tier 1 triads + Tier 2 seventh chords | [`docs/features.md`](docs/features.md#difficulty-tiers) |
| Key selection (all 12 major keys) | [`docs/features.md`](docs/features.md#session-configuration) |
| Pure-synthesis audio via Tone.js | [`docs/audio-engine.md`](docs/audio-engine.md) |
| Replay question button | [`docs/features.md`](docs/features.md) |
| Tonic cadence playback | [`docs/features.md`](docs/features.md) |
| Per-session score counter | [`docs/features.md`](docs/features.md#stats-and-progress) |
| PWA manifest + offline support | [`docs/architecture.md`](docs/architecture.md) |

## In Progress

| Feature | Progress doc |
|---|---|
| **Voice input mode** — speak note + chord instead of tapping | [`docs/voice-mode.md`](docs/voice-mode.md) |

## Roadmap — MVP blockers

These must ship before the app is considered ready for regular use.

| Feature | Notes |
|---|---|
| Phone install (PWA) | "Add to Home Screen" flow needs end-to-end verification on iOS + Android |
| Help / intro screen | No onboarding; new users have no explanation of the exercise |
| Demo bug: plays all at once | All audio fires simultaneously instead of sequencing; root cause TBD |

## Roadmap — Wishlist

Nice-to-have; no fixed milestone.

| Feature | Notes |
|---|---|
| All-time score tracking | Persist session history (date, key, tier, score) across sessions |
| Relative degree mode | Show scale degree (1–7 / do–ti) instead of absolute names |
| Minor keys | Natural, harmonic, melodic minor |
| Chord progressions | Hear a 2–4 chord sequence before the melody note |
| Intervals | Classic GNU Solfege-style interval recognition |
| Chord-only mode | Identify chord without a melody note (simpler warmup) |
| Note-only mode | Identify note in key context without a chord (simpler warmup) |
| Tier 3 — chromatic notes | All 12 pitch classes as note answers |
