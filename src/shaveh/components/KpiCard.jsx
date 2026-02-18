import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTabTheme } from '../ThemeContext'

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, target, duration])

  return { value, ref }
}

export default function KpiCard({ label, value, suffix, accent }) {
  const theme = useTabTheme()
  const isPercent = typeof value === 'string' && value.includes('%')
  const numeric = isPercent
    ? parseFloat(value)
    : typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, ''), 10)

  const { value: displayed, ref } = useCountUp(isPercent ? Math.round(numeric * 10) : numeric)

  const formatted = isPercent
    ? `${(displayed / 10).toFixed(1)}%`
    : displayed.toLocaleString('he-IL')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-sh-card rounded-card-sh shadow-card p-6 flex flex-col gap-1"
    >
      <div
        className={`text-4xl font-black ${accent ? '' : 'text-sh-text'}`}
        style={accent ? { color: theme.accent } : undefined}
      >
        {formatted}{suffix && <span className="text-xl font-bold mr-1">{suffix}</span>}
      </div>
      <div className="text-sm text-sh-text-muted">{label}</div>
    </motion.div>
  )
}
