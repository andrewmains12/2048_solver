import { useSessionStore } from '@/store/sessionStore'
import { accuracy } from '@/exercises'
import { displayNote } from '@/theory/notes'

function BarRow({ label, attempts, correct }: { label: string; attempts: number; correct: number }) {
  const pct = accuracy(attempts, correct)
  const display = pct === null ? '—' : `${Math.round(pct * 100)}%`
  const width = pct === null ? 0 : pct * 100

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-12 text-right font-mono text-white/80 shrink-0">{label}</span>
      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="w-10 text-right text-white/60 shrink-0">{display}</span>
    </div>
  )
}

export function StatsScreen() {
  const { stats, config, resetToSetup } = useSessionStore()
  const totalPct = accuracy(stats.totalQuestions, stats.totalCorrect)

  return (
    <div className="min-h-screen bg-brand-900 text-white flex flex-col p-6" data-testid="stats-screen">
      <h2 className="text-xl font-bold mb-1">Session Stats</h2>
      <p className="text-white/60 text-sm mb-6">
        Score: {stats.totalCorrect} / {stats.totalQuestions}
        {totalPct !== null && ` (${Math.round(totalPct * 100)}%)`}
      </p>

      {Object.keys(stats.noteStats).length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Notes</h3>
          <div className="space-y-2">
            {Object.values(stats.noteStats).map((ns) => (
              <BarRow key={ns.noteName} label={config ? displayNote(ns.noteName, config.key) : ns.noteName} attempts={ns.attempts} correct={ns.correct} />
            ))}
          </div>
        </section>
      )}

      {Object.keys(stats.chordStats).length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Chords</h3>
          <div className="space-y-2">
            {Object.values(stats.chordStats).map((cs) => (
              <BarRow key={cs.chordLabel} label={cs.chordLabel} attempts={cs.attempts} correct={cs.correct} />
            ))}
          </div>
        </section>
      )}

      <button
        onClick={resetToSetup}
        className="w-full py-4 bg-brand-500 hover:bg-brand-600 rounded-xl font-bold text-lg transition-colors"
        data-testid="new-session-btn"
      >
        New Session
      </button>
    </div>
  )
}
