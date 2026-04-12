import { useCallback, useEffect, useRef, useState } from 'react'

export type RecognitionState = 'unsupported' | 'idle' | 'listening' | 'error'

// Detect Web Speech API — available on Chrome, Edge, and iOS Safari 14.5+ (as webkitSpeechRecognition)
function getSpeechRecognitionClass(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition ??
    null
  ) as (new () => SpeechRecognition) | null
}

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
  const recognitionRef = useRef<SpeechRecognition | null>(null)
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
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      setErrorMessage(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      onTranscriptRef.current(transcript)
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
