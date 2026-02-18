import { motion } from 'framer-motion'
import { useTabTheme } from '../ThemeContext'

const STEP_LABELS = {
  // Learning (11)
  industryReview: 'סקירת הענף',
  surveyDesign: 'ניסוח שאלון',
  participantRecruitment: 'גיוס משתתפים',
  barrierMapping: 'מיפוי חסמים',
  surveyDistribution: 'הפצת שאלון',
  responseCollection: 'ריכוז מענים',
  expertRecruitment: 'גיוס גורם מקצועי',
  recommendationsReport: 'דוח המלצות',
  userTesting: 'התנסות',
  socialPartnerRecruitment: 'גיוס שותף חברתי',
  developmentRecommendations: 'המלצות לפיתוח',
  // Development (6)
  presentRecommendations: 'הצגת המלצות',
  productDecision: 'בחירת מוצר',
  ganttCreation: 'בניית גאנט',
  processCompletion: 'סיום תהליך',
  solutionValidation: 'תיקוף',
  productImplementation: 'הטמעה',
  // Marketing (6)
  influencerSharing: 'שיתוף משפיענים',
  digitalMarketing: 'שיווק דיגיטלי',
  pressReleaseDraft: 'ניסוח הודעה לעיתונות',
  pressReleaseApproval: 'אישור הודעה',
  websiteUpdate: 'עדכון אתר',
  exposureData: 'נתוני חשיפה',
}

const STATUS_COLORS = {
  'כן': 'bg-sh-green text-white',
  'בתהליך': 'bg-sh-yellow text-white',
  'לא': 'bg-sh-pink-light/60 text-sh-text-light',
}

const PHASES = [
  { name: 'learning', label: 'למידה', color: '#4263aa' },
  { name: 'development', label: 'פיתוח', color: '#70bdb3' },
  { name: 'marketing', label: 'שיווק', color: '#e9ab56' },
]

export default function ProcessTracker({ companies }) {
  const theme = useTabTheme()
  const yesCompanies = companies.filter(c => c.status === 'כן')

  // Aggregate: for each step, count כן / בתהליך / לא across all "כן" companies
  const phaseData = PHASES.map(phase => {
    const steps = Object.keys(yesCompanies[0]?.process?.[phase.name] || {})
    return {
      ...phase,
      steps: steps.map(stepKey => {
        let yesCount = 0, inProgressCount = 0, noCount = 0
        yesCompanies.forEach(c => {
          const val = c.process?.[phase.name]?.[stepKey]
          if (val === 'כן') yesCount++
          else if (val === 'בתהליך') inProgressCount++
          else noCount++
        })
        return {
          key: stepKey,
          label: STEP_LABELS[stepKey] || stepKey,
          yes: yesCount,
          inProgress: inProgressCount,
          no: noCount,
          total: yesCompanies.length,
        }
      }),
    }
  })

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">מעקב שלבי תהליך</h2>
      <p className="text-sm text-sh-text-muted mb-6">
        התקדמות {yesCompanies.length} חברות פעילות ב-23 שלבי התהליך
      </p>

      <div className="space-y-6">
        {phaseData.map((phase, pi) => (
          <div key={phase.name}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: phase.color }} />
              <h3 className="font-bold text-sh-text">{phase.label}</h3>
              <span className="text-xs text-sh-text-muted">({phase.steps.length} שלבים)</span>
            </div>
            <div className="space-y-1.5">
              {phase.steps.map((step, si) => {
                const completedPct = (step.yes / step.total) * 100
                const inProgressPct = (step.inProgress / step.total) * 100
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: (pi * 0.1) + (si * 0.03) }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-32 text-xs text-sh-text-muted text-left flex-shrink-0 truncate" title={step.label}>
                      {step.label}
                    </div>
                    <div className="flex-1 h-5 bg-sh-bg rounded-md overflow-hidden flex">
                      {step.yes > 0 && (
                        <div
                          className="h-full bg-sh-green transition-all"
                          style={{ width: `${completedPct}%` }}
                        />
                      )}
                      {step.inProgress > 0 && (
                        <div
                          className="h-full bg-sh-yellow transition-all"
                          style={{ width: `${inProgressPct}%` }}
                        />
                      )}
                    </div>
                    <div className="w-16 text-xs text-sh-text-muted text-left flex-shrink-0">
                      {step.yes}/{step.total}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.light}` }}>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-sh-green" />
          <span className="text-xs text-sh-text-muted">הושלם</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-sh-yellow" />
          <span className="text-xs text-sh-text-muted">בתהליך</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-sh-bg" />
          <span className="text-xs text-sh-text-muted">טרם התחיל</span>
        </div>
      </div>
    </div>
  )
}
