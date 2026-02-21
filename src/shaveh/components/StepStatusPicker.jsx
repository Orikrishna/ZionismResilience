import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const STATUSES = [
  { value: null,          label: '—',          circle: 'border-2 border-dashed border-sh-text-light bg-transparent text-transparent' },
  { value: 'כן',          label: 'כן',          circle: 'bg-sh-green text-white' },
  { value: 'בתהליך',      label: 'בתהליך',      circle: 'bg-sh-yellow text-white' },
  { value: 'לא',          label: 'לא',          circle: 'bg-sh-pink text-white' },
  { value: 'לא רלוונטי',  label: 'לא רלוונטי',  circle: 'bg-sh-text-light text-white' },
]

const ICON = { 'כן': '✓', 'בתהליך': '◐', 'לא': '✕', 'לא רלוונטי': '○' }

function Circle({ value, size = 'sm' }) {
  const s = STATUSES.find(s => s.value === value) || STATUSES[0]
  const dim = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-5 h-5 text-[10px]'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${s.circle}`}>
      {value ? ICON[value] || '' : ''}
    </div>
  )
}

export default function StepStatusPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-0.5 group"
      >
        <Circle value={value} />
        <ChevronDown
          size={10}
          className="text-sh-text-light group-hover:text-sh-text transition-colors mt-px"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-white rounded-xl shadow-card-hover border border-sh-pink-light py-1 min-w-[110px]">
          {STATUSES.map(s => (
            <button
              key={String(s.value)}
              type="button"
              onMouseDown={e => {
                e.preventDefault()
                onChange(s.value)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-sh-bg transition-colors text-right ${
                value === s.value ? 'font-bold text-sh-text' : 'text-sh-text-muted'
              }`}
            >
              <Circle value={s.value} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
