import { useEffect, useRef, useState } from 'react'

type LogEntry = { level: 'log' | 'warn' | 'error'; text: string; ts: string }

const COLOURS = { log: 'text-green-300', warn: 'text-yellow-300', error: 'text-red-400' }

/** Intercepts console methods and displays matching logs on-screen. */
export function DebugOverlay() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [open, setOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const push = (level: LogEntry['level'], args: unknown[]) => {
      const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')
      const ts = new Date().toISOString().slice(11, 23)
      setEntries((prev) => [...prev.slice(-199), { level, text, ts }])
    }

    const origLog = console.log.bind(console)
    const origWarn = console.warn.bind(console)
    const origErr = console.error.bind(console)

    console.log = (...args) => { origLog(...args); push('log', args) }
    console.warn = (...args) => { origWarn(...args); push('warn', args) }
    console.error = (...args) => { origErr(...args); push('error', args) }

    return () => {
      console.log = origLog
      console.warn = origWarn
      console.error = origErr
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 font-mono text-xs" data-testid="debug-overlay">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-black/80 text-white/60 py-1 text-center border-t border-white/10"
      >
        {open ? '▼ debug log' : '▲ debug log'} ({entries.length})
      </button>
      {open && (
        <div className="bg-black/90 h-40 overflow-y-auto p-2 space-y-0.5 border-t border-white/10">
          {entries.length === 0 && (
            <p className="text-white/30">No logs yet — tap Play Question or Tonic</p>
          )}
          {entries.map((e, i) => (
            <div key={i} className={`leading-tight ${COLOURS[e.level]}`}>
              <span className="text-white/30 mr-1">{e.ts}</span>
              {e.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
