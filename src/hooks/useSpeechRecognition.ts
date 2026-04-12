import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Local type declarations for the Web Speech API.
// TypeScript's lib.dom.d.ts only ships SpeechRecognitionAlternative and
// SpeechRecognitionResult — the recognition class itself, its event types,
// and the webkit-prefixed variant are absent. We declare exactly what we need.
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition

// ---------------------------------------------------------------------------
// API detection
// ---------------------------------------------------------------------------

// Detect Web Speech API — available on Chrome, Edge, and iOS Safari 14.5+
// (as webkitSpeechRecognition). Not in TypeScript's standard DOM lib, so we
// access it via window cast.
function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type RecognitionState = 'unsupported' | 'idle' | 'listening' | 'error'

export interface UseSpeechRecognitionResult {
  state: RecognitionState
  errorMessage: string | null
  /** Live transcript: interim text while listening, last final text when idle. */
  transcript: string
  toggle: () => void
}

export function useSpeechRecognition(
  onTranscript: (transcript: string) => void,
): UseSpeechRecognitionResult {
  const SpeechRecognitionClass = getSpeechRecognitionClass()
  const isSupported = SpeechRecognitionClass !== null

  const [state, setState] = useState<RecognitionState>(isSupported ? 'idle' : 'unsupported')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Persists after recognition ends so the user can see what was heard.
  // Cleared when a new session starts.
  const [transcript, setTranscript] = useState('')

  // Keep refs so we never capture stale values in recognition callbacks
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setState('idle')
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognitionClass) return

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'en-US'
    // continuous: true so a natural pause mid-answer ("C major … A") doesn't
    // end the session — all segments are accumulated into one transcript.
    recognition.continuous = true
    // interimResults: true gives live word-by-word updates for the debug display.
    // Final results still drive the parser; interim results only update the UI.
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      setErrorMessage(null)
      setTranscript('')  // clear previous session on fresh start
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''

      for (let i = 0; i < event.results.length; i++) {
        const segment = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += (finalText ? ' ' : '') + segment
        } else {
          interimText += segment
        }
      }

      // Live display: finals + current interim (interim shown trailing)
      setTranscript(interimText ? `${finalText} ${interimText}` : finalText)

      // Only pass final text to the parser — interim results are too unstable
      if (finalText) onTranscriptRef.current(finalText.trim())
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') {
        // User-initiated stop via abort() — not a real error
        setState('idle')
        return
      }
      setErrorMessage(event.error)
      setState('error')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      // onend fires after onresult; clean up and return to idle
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null
        setState('idle')
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [SpeechRecognitionClass])

  const toggle = useCallback(() => {
    if (state === 'listening') {
      stop()
    } else if (state === 'idle' || state === 'error') {
      start()
    }
  }, [state, start, stop])

  // Abort any active recognition on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return { state, errorMessage, transcript, toggle }
}
