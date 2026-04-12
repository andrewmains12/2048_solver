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
  toggle: () => void
}

export function useSpeechRecognition(
  onTranscript: (transcript: string) => void,
): UseSpeechRecognitionResult {
  const SpeechRecognitionClass = getSpeechRecognitionClass()
  const isSupported = SpeechRecognitionClass !== null

  const [state, setState] = useState<RecognitionState>(isSupported ? 'idle' : 'unsupported')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      setErrorMessage(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Concatenate every final segment received so far in this session so that
      // "C major" (segment 1) + "A" (segment 2) becomes "C major A".
      let accumulated = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulated += (accumulated ? ' ' : '') + event.results[i][0].transcript
        }
      }
      onTranscriptRef.current(accumulated.trim())
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

  return { state, errorMessage, toggle }
}
