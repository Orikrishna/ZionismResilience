import { useState } from 'react'
import { motion } from 'framer-motion'

const BASE = import.meta.env.BASE_URL

function StraussLogo({ companyId }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <img
      src={`${BASE}logos/${companyId}.png`}
      alt=""
      width={32}
      height={32}
      className="object-contain rounded-lg shrink-0"
      onError={() => setHidden(true)}
      loading="lazy"
    />
  )
}

const STRAUSS_IDS = [
  'strauss_sweets',
  'strauss_salty',
  'strauss_food',
  'strauss_tami4',
  'strauss_coffee',
]

const PIPELINE_STEPS = [
  { key: 'emailSent', label: 'מייל' },
  { key: 'meetingHeld', label: 'פגישה' },
  { key: 'agreementSent', label: 'הסכם נשלח' },
  { key: 'agreementSigned', label: 'הסכם חתום' },
  { key: 'paid', label: 'שולם' },
]

export default function StraussRow({ companies }) {
  const straussCompanies = STRAUSS_IDS
    .map(id => companies.find(c => c.id === id))
    .filter(Boolean)

  const activeCount = straussCompanies.filter(c => c.status === 'כן').length
  const paidCount = straussCompanies.filter(c => c.paid).length

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-sh-text">שטראוס - Case Study</h2>
          <p className="text-sm text-sh-text-muted">
            {activeCount} חטיבות פעילות מתוך {straussCompanies.length} | {paidCount} משלמות
          </p>
        </div>
        <span className="text-3xl">⭐</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {straussCompanies.map((company, i) => {
          const stepsCompleted = PIPELINE_STEPS.filter(s => company[s.key]).length
          const isActive = company.status === 'כן'

          return (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className={`rounded-xl p-4 border-2 ${
                isActive
                  ? company.paid
                    ? 'border-sh-green bg-sh-green-light/30'
                    : 'border-sh-yellow bg-sh-yellow-light/30'
                  : 'border-sh-pink-light bg-sh-pink-light/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <StraussLogo companyId={company.id} />
                <div className="text-sm font-bold text-sh-text">
                  {company.name.replace('שטראוס ', '')}
                </div>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-pill inline-block mb-2 ${
                isActive
                  ? 'bg-sh-green-light text-sh-green'
                  : 'bg-sh-pink-light text-sh-pink'
              }`}>
                {company.status}
              </div>

              {/* Mini pipeline progress */}
              <div className="flex gap-0.5 mt-2">
                {PIPELINE_STEPS.map((step) => (
                  <div
                    key={step.key}
                    className={`h-1.5 flex-1 rounded-full ${company[step.key] ? 'bg-sh-green' : 'bg-sh-pink-light/50'}`}
                    title={step.label}
                  />
                ))}
              </div>
              <div className="text-xs text-sh-text-light mt-1">
                {stepsCompleted}/5 שלבים
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
