import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
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

export default function KpiCard({ label, value, icon, accent }) {
  const numeric = typeof value === 'number' ? value : parseInt(String(value).replace(/,/g, ''), 10)
  const { value: displayed, ref } = useCountUp(numeric)
  const formatted = displayed.toLocaleString('he-IL')

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-card shadow-card p-6 flex flex-col gap-1"
    >
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className={`text-4xl font-black ${accent ? 'text-accent' : 'text-text-main'}`}>
        {formatted}
      </div>
      <div className="text-sm text-text-muted">{label}</div>
    </motion.div>
  )
}
