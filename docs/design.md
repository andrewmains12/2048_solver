# UX Design

## Screens

### 1. Audio Gate (first launch / session start)
iOS requires a user gesture before Web Audio can start. A full-screen tap prompt handles this cleanly.

```
┌─────────────────────────┐
│                         │
│      🎵 Solfege         │
│      Trainer            │
│                         │
│  Tap anywhere to begin  │
│                         │
└─────────────────────────┘
```

### 2. Session Setup
```
┌─────────────────────────┐
│  New Session            │
│                         │
│  Key:  [C ▼]            │
│                         │
│  Tier: ○ Triads         │
│        ● 7th Chords     │
│                         │
│  [  Start  ]            │
└─────────────────────────┘
```

### 3. Exercise Screen (main)
```
┌─────────────────────────┐
│  Key of C   Tier 2   ✕  │
├─────────────────────────┤
│                         │
│  [▶ Play Again]         │
│                         │
│  What note?             │
│  ┌─┬─┬─┬─┬─┬─┬─┐       │
│  │C│D│E│F│G│A│B│       │
│  └─┴─┴─┴─┴─┴─┴─┘       │
│                         │
│  What chord?            │
│  ┌────┬────┬────┐       │
│  │ C  │ Dm │ Em │       │
│  ├────┼────┼────┤       │
│  │ F  │ G7 │ Am │       │
│  ├────┼────┴────┤       │
│  │ Bø7│         │       │
│  └────┴─────────┘       │
│                         │
│  [  Submit  ]           │
└─────────────────────────┘
```

### 4. Feedback (inline, below submit)
```
  ✓ Correct!              (green)
  ✗ Note: B  Chord: G7   (red, shows correct answer)
```

Feedback clears after 1.5s and the next question auto-plays.

### 5. Stats Screen
```
┌─────────────────────────┐
│  ← Session Stats        │
│                         │
│  Score: 14 / 18  (78%)  │
│                         │
│  Notes                  │
│  C ████████░░  80%      │
│  D ████░░░░░░  40%      │
│  ...                    │
│                         │
│  Chords                 │
│  C  ██████████ 100%     │
│  G7 ████░░░░░░  40%     │
│  ...                    │
│                         │
│  [New Session]          │
└─────────────────────────┘
```

---

## Interaction Model

- **Two-step answer**: note first, then chord. Both must be selected to enable Submit.
- **Selection state**: selected button highlights in brand color.
- **Auto-advance**: after feedback delay, next question plays automatically.
- **Manual replay**: "Play Again" re-plays chord + note without changing question.
- **No keyboard navigation** initially (touch/mouse only, optimized for mobile).

---

## Mobile Considerations

- Minimum tap target: 44×44px (Apple HIG)
- Note buttons: 7 equal-width buttons in a single row
- Chord buttons: 2–3 per row grid, wrapping
- Safe area padding for iPhone notch / home indicator
- No hover states (touch-first)
- Portrait orientation primary
