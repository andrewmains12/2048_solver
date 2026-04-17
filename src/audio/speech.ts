import type { Chord, ChordQuality, NoteName } from '@/types'

const NOTE_SPEECH: Record<NoteName, string> = {
  C: 'C',
  'C#': 'C sharp',
  D: 'D',
  'D#': 'D sharp',
  E: 'E',
  F: 'F',
  'F#': 'F sharp',
  G: 'G',
  'G#': 'G sharp',
  A: 'A',
  'A#': 'A sharp',
  B: 'B',
}

const QUALITY_SPEECH: Record<ChordQuality, string> = {
  major: 'major',
  minor: 'minor',
  diminished: 'diminished',
  augmented: 'augmented',
  major7: 'major seven',
  dominant7: 'seven',
  minor7: 'minor seven',
  halfDiminished7: 'half diminished seven',
  diminished7: 'diminished seven',
}

/** Returns the spoken phrase for a chord (e.g. "D minor", "G seven"). */
export function chordToSpeech(chord: Chord): string {
  return `${NOTE_SPEECH[chord.root]} ${QUALITY_SPEECH[chord.quality]}`
}

/** Returns the spoken phrase for a note name (e.g. "F sharp"). */
export function noteToSpeech(note: NoteName): string {
  return NOTE_SPEECH[note]
}

/**
 * Speaks the correct answer aloud using the browser's SpeechSynthesis API.
 * Silently no-ops if the API is unavailable (Android WebView, some bots).
 */
export function speakCorrection(chord: Chord, note: NoteName): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const text = `${chordToSpeech(chord)}, ${noteToSpeech(note)}`
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}
