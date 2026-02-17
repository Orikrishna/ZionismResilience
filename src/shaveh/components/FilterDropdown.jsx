import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

export default function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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
            ? 'bg-sh-pink/10 border-sh-pink text-sh-text font-medium'
            : 'bg-sh-card border-sh-pink-light text-sh-text-muted hover:border-sh-pink/50'
        }`}
      >
        <span className="text-xs text-sh-text-light">{label}</span>
        <span className={isFiltered ? 'text-sh-text font-semibold' : ''}>{value}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''} ${isFiltered ? 'text-sh-pink' : 'text-sh-text-light'}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 z-30 min-w-[160px] bg-sh-card rounded-xl shadow-card-hover border border-sh-pink-light/60 py-1 overflow-hidden"
          >
            {options.map((opt) => {
              const selected = opt === value
              return (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false) }}
                  className={`w-full text-right px-4 py-2 text-sm flex items-center justify-between gap-3 transition-colors ${
                    selected
                      ? 'bg-sh-pink-light/40 text-sh-text font-semibold'
                      : 'text-sh-text-muted hover:bg-sh-bg hover:text-sh-text'
                  }`}
                >
                  <span>{opt}</span>
                  {selected && <Check size={14} className="text-sh-pink shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
