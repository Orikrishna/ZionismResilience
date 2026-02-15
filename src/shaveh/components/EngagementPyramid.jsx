import { motion } from 'framer-motion'

const LEVELS = [
  { label: 'לקוחות משלמים', filter: (c) => c.paid, color: 'bg-sh-green', textColor: 'text-white' },
  { label: 'בדרך להצטרפות', filter: (c) => !c.paid && c.agreementSent, color: 'bg-sh-green/60', textColor: 'text-white' },
  { label: 'אחרי פגישה', filter: (c) => !c.agreementSent && c.meetingHeld, color: 'bg-sh-yellow', textColor: 'text-white' },
  { label: 'מייל בלבד', filter: (c) => !c.meetingHeld && c.emailSent, color: 'bg-sh-pink', textColor: 'text-white' },
  { label: 'טרם פנינו', filter: (c) => !c.emailSent, color: 'bg-sh-pink-light', textColor: 'text-sh-text' },
]

export default function EngagementPyramid({ companies }) {
  const data = LEVELS.map(level => ({
    ...level,
    count: companies.filter(level.filter).length,
  }))

  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">פירמידת מעורבות</h2>
      <p className="text-sm text-sh-text-muted mb-6">חלוקת כל החברות לפי עומק מעורבות</p>

      <div className="space-y-2">
        {data.map((level, i) => {
          const widthPct = Math.max((level.count / maxCount) * 100, 15)
          return (
            <motion.div
              key={level.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3"
            >
              <div className="w-28 text-xs text-sh-text-muted text-left flex-shrink-0">{level.label}</div>
              <div className="flex-1 h-10 bg-sh-bg rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                  className={`h-full ${level.color} rounded-lg flex items-center justify-center`}
                >
                  <span className={`text-sm font-bold ${level.textColor}`}>{level.count}</span>
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
