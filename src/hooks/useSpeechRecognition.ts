import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Local type declarations for the Web Speech API.
// TypeScript's lib.dom.d.ts only ships SpeechRecognitionAlternative and
// SpeechRecognitionResult — the recognition class itself, its event types,
// and the webkit-prefixed variant are absent. We declare exactly what we need.
// ---------------------------------------------------------------------------

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
  /** Index of the first new result in this event (previous results are unchanged). */
  readonly resultIndex: number
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
  /** Live transcript: updates word-by-word while listening, persists after stop. */
  transcript: string
  toggle: () => void
  /** Clear the accumulated transcript and reset for the next question. */
  reset: () => void
}

export function useSpeechRecognition(
  onTranscript: (transcript: string) => void,
): UseSpeechRecognitionResult {
  const SpeechRecognitionClass = getSpeechRecognitionClass()
  const isSupported = SpeechRecognitionClass !== null

  const [state, setState] = useState<RecognitionState>(isSupported ? 'idle' : 'unsupported')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')

  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  useEffect(() => {
    onTranscriptRef.current = onTranscript
  }, [onTranscript])

  // Own accumulation buffer for the current question session.
  // We maintain this ourselves rather than re-reading all of event.results
  // from index 0, because with continuous: true the browser appends every
  // segment ever heard — including segments from previous questions.
  // event.resultIndex tells us the first *new* segment in each event; we
  // only append those to our buffer.
  const accumulatedRef = useRef('')

  const reset = useCallback(() => {
    accumulatedRef.current = ''
    setTranscript('')
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
    setState('idle')
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognitionClass) return

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      setErrorMessage(null)
      accumulatedRef.current = ''
      setTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Only process results from event.resultIndex onward — everything before
      // that index was already handled in a previous event.
      let newFinals = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const segment = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newFinals += (newFinals ? ' ' : '') + segment
        } else {
          interimText += segment
        }
      }

      if (newFinals) {
        accumulatedRef.current += (accumulatedRef.current ? ' ' : '') + newFinals
      }

      const display = interimText
        ? `${accumulatedRef.current} ${interimText}`
        : accumulatedRef.current
      setTranscript(display.trim())

      // Only drive the parser on confirmed finals
      if (newFinals) {
        onTranscriptRef.current(accumulatedRef.current.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted') {
        setState('idle')
        return
      }
      setErrorMessage(event.error)
      setState('error')
      recognitionRef.current = null
    }

    recognition.onend = () => {
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

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  return { state, errorMessage, transcript, toggle, reset }
}
