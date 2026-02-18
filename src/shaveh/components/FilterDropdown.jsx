import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTabTheme } from '../ThemeContext'

export default function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const theme = useTabTheme()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  const isFiltered = value !== 'הכל'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 text-sm rounded-pill px-4 py-2 border transition-all ${
          isFiltered
            ? 'text-sh-text font-medium'
            : 'bg-sh-card text-sh-text-muted'
        }`}
        style={
          isFiltered
            ? { backgroundColor: theme.accent + '1a', borderColor: theme.accent }
            : { borderColor: theme.light }
        }
      >
        <span className="text-xs text-sh-text-light">{label}</span>
        <span className={isFiltered ? 'text-sh-text font-semibold' : ''}>{value}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: isFiltered ? theme.accent : '#948c89' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 z-30 min-w-[160px] bg-sh-card rounded-xl shadow-card-hover py-1 overflow-hidden"
            style={{ border: `1px solid ${theme.lightAlpha60}` }}
          >
            {options.map((opt) => {
              const selected = opt === value
              return (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false) }}
                  className={`w-full text-right px-4 py-2 text-sm flex items-center justify-between gap-3 transition-colors ${
                    selected
                      ? 'text-sh-text font-semibold'
                      : 'text-sh-text-muted hover:text-sh-text'
                  }`}
                  style={
                    selected
                      ? { backgroundColor: theme.lightAlpha40 }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = theme.bg
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.backgroundColor = ''
                  }}
                >
                  <span>{opt}</span>
                  {selected && <Check size={14} className="shrink-0" style={{ color: theme.accent }} />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
