import type { Chord, ChordLabel } from '@/types'
import { chordLabel } from '@/theory'

interface Props {
  chords: Chord[]
  selected: ChordLabel | null
  onSelect: (label: ChordLabel) => void
  disabled?: boolean
}

export function ChordSelector({ chords, selected, onSelect, disabled = false }: Props) {
  return (
    <div className="w-full" data-testid="chord-selector">
      <p className="text-sm font-medium text-white/60 mb-2">What chord?</p>
      <div className="grid grid-cols-3 gap-2">
        {chords.map((chord) => {
          const label = chordLabel(chord)
          return (
            <button
              key={label}
              onClick={() => !disabled && onSelect(label)}
              disabled={disabled}
              className={`py-3 px-2 rounded-lg font-bold text-sm transition-colors min-h-[44px] ${
                selected === label
                  ? 'bg-brand-500 text-white ring-2 ring-brand-300'
                  : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'
              }`}
              data-testid={`chord-btn-${label}`}
              aria-pressed={selected === label}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
