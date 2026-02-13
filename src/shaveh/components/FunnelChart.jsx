import { motion } from 'framer-motion'

const STAGES = [
  { key: 'emailSent', label: 'מייל נשלח' },
  { key: 'meetingHeld', label: 'פגישה התקיימה' },
  { key: 'formSent', label: 'טופס נשלח' },
  { key: 'formSigned', label: 'טופס נחתם' },
  { key: 'paid', label: 'שולם' },
]

const COLORS = ['#e8969f', '#d68089', '#c46a74', '#b2555e', '#a04049']

export default function FunnelChart({ companies }) {
  const total = companies.length
  const counts = STAGES.map(s => companies.filter(c => c[s.key]).length)
  const maxCount = counts[0] || 1

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">משפך גיוס</h2>
      <p className="text-sm text-sh-text-muted mb-6">מ-{total} חברות בליווי</p>

      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const count = counts[i]
          const pct = (count / total) * 100
          const barWidth = (count / maxCount) * 100
          const conversionFromPrev = i > 0 && counts[i - 1] > 0
            ? Math.round((count / counts[i - 1]) * 100)
            : null

          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-sh-text">{stage.label}</span>
                <div className="flex items-center gap-2">
                  {conversionFromPrev !== null && (
                    <span className="text-xs text-sh-text-light">({conversionFromPrev}%)</span>
                  )}
                  <span className="text-sm font-bold text-sh-text">{count}</span>
                </div>
              </div>
              <div className="h-8 bg-sh-pink-light/40 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className="h-full rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: COLORS[i] }}
                >
                  <span className="text-xs font-bold text-white">
                    {Math.round(pct)}%
                  </span>
                </motion.div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
