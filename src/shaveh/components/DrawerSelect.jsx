import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTabTheme } from '../ThemeContext'

/**
 * Styled dropdown for the company drawer edit mode.
 * Props:
 *   label   — field label shown above the trigger
 *   value   — current value (string)
 *   options — array of strings
 *   onChange — (value: string) => void
 */
export default function DrawerSelect({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const theme = useTabTheme()

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {label && (
        <div className="text-xs text-sh-text-muted mb-1">{label}</div>
      )}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 text-sm rounded-xl px-3 py-2 border bg-white transition-all text-sh-text"
        style={{ borderColor: open ? theme.accent : '#f8dfe2' }}
      >
        <ChevronDown
          size={14}
          className="transition-transform flex-shrink-0"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            color: theme.accent,
          }}
        />
        <span className={value ? 'font-medium' : 'text-sh-text-light'}>
          {value || '—'}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 left-0 right-0 z-50 bg-sh-card rounded-xl shadow-card-hover py-1 overflow-hidden"
            style={{ border: `1px solid ${theme.lightAlpha60}` }}
          >
            {options.map((opt) => {
              const selected = opt === value
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    onChange(opt)
                    setOpen(false)
                  }}
                  className={`w-full text-right px-4 py-2 text-sm flex items-center justify-between gap-3 transition-colors ${
                    selected ? 'text-sh-text font-semibold' : 'text-sh-text-muted hover:text-sh-text'
                  }`}
                  style={selected ? { backgroundColor: theme.lightAlpha40 } : undefined}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = theme.bg }}
                  onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = '' }}
                >
                  <Check
                    size={13}
                    className="shrink-0"
                    style={{ color: theme.accent, opacity: selected ? 1 : 0 }}
                  />
                  <span>{opt}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
