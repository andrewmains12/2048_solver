import type { NoteName } from '@/types'

interface Props {
  notes: NoteName[]
  selected: NoteName | null
  onSelect: (note: NoteName) => void
  disabled?: boolean
}

export function NoteSelector({ notes, selected, onSelect, disabled = false }: Props) {
  return (
    <div className="w-full" data-testid="note-selector">
      <p className="text-sm font-medium text-white/60 mb-2">What note?</p>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${notes.length}, 1fr)` }}>
        {notes.map((note) => (
          <button
            key={note}
            onClick={() => !disabled && onSelect(note)}
            disabled={disabled}
            className={`py-3 rounded-lg font-bold text-sm transition-colors min-h-[44px] ${
              selected === note
                ? 'bg-brand-500 text-white ring-2 ring-brand-300'
                : 'bg-white/10 text-white hover:bg-white/20 disabled:opacity-50'
            }`}
            data-testid={`note-btn-${note}`}
            aria-pressed={selected === note}
          >
            {note}
          </button>
        ))}
      </div>
    </div>
  )
}
