import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import data from './data/companies.json'
import KpiCard from './components/KpiCard'
import FunnelChart from './components/FunnelChart'
import StatusDonut from './components/StatusDonut'
import PipelineBar from './components/PipelineBar'

const STATUS_STYLES = {
  'כן': 'bg-sh-green-light text-sh-green',
  'לא': 'bg-sh-pink-light text-sh-pink',
  'טרם הוחלט': 'bg-sh-yellow-light text-sh-yellow',
}

const PIPELINE_STEPS = [
  { key: 'emailSent', label: 'מייל נשלח' },
  { key: 'meetingHeld', label: 'פגישה' },
  { key: 'formSent', label: 'טופס נשלח' },
  { key: 'formSigned', label: 'טופס נחתם' },
  { key: 'paid', label: 'שולם' },
]

function stepsCompleted(company) {
  return PIPELINE_STEPS.filter(s => company[s.key]).length
}

export default function App() {
  const { companies } = data
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [filterStatus, setFilterStatus] = useState('הכל')

  const statusOptions = ['הכל', 'כן', 'לא', 'טרם הוחלט']

  const filtered = filterStatus === 'הכל'
    ? companies
    : companies.filter(c => c.status === filterStatus)

  const totalCompanies = companies.length
  const joined = companies.filter(c => c.paid).length
  const meetings = companies.filter(c => c.meetingHeld).length
  const formsSigned = companies.filter(c => c.formSigned).length
  const emailsSent = companies.filter(c => c.emailSent).length
  const conversionRate = emailsSent > 0 ? ((joined / emailsSent) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-sh-bg font-noto" dir="rtl">
      {/* Header */}
      <header className="bg-sh-card shadow-card px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-sh-text">דשבורד שווה פיתוח</h1>
          <p className="text-sm text-sh-text-muted">מיזם להתאמת מוצרים ושירותים לאנשים עם מוגבלות</p>
        </div>
        <img src={`${import.meta.env.BASE_URL}zionism2000-logo.jpg`} alt="ציונות 2000" className="h-12 object-contain" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Filter */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-sh-text-muted">סטטוס:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm bg-sh-card border border-sh-pink-light rounded-pill px-3 py-1.5 text-sh-text focus:outline-none focus:border-sh-pink"
            >
              {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {filterStatus !== 'הכל' && (
            <button
              onClick={() => setFilterStatus('הכל')}
              className="text-sm text-sh-pink underline"
            >
              נקה פילטר
            </button>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="חברות בליווי" value={totalCompanies} accent />
          <KpiCard label="חברות שהצטרפו" value={joined} />
          <KpiCard label="פגישות שהתקיימו" value={meetings} />
          <KpiCard label="טפסים שנחתמו" value={formsSigned} />
          <KpiCard label="אחוז המרה" value={`${conversionRate}%`} />
        </div>

        {/* Funnel — full width */}
        <FunnelChart companies={companies} />

        {/* Donut + Pipeline side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <StatusDonut companies={companies} />
          </div>
          <div className="lg:col-span-2">
            <PipelineBar companies={companies} />
          </div>
        </div>

        {/* Company grid */}
        <div className="bg-sh-card rounded-card-sh shadow-card p-6">
          <h2 className="text-lg font-bold text-sh-text mb-4">
            חברות ({filtered.length}{filtered.length !== companies.length ? ` מתוך ${companies.length}` : ''})
          </h2>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedCompany(c)}
                  className="border border-sh-pink-light rounded-xl p-4 hover:shadow-card-hover transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-bold text-sh-text">{c.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-medium whitespace-nowrap ${STATUS_STYLES[c.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                      {c.status || '—'}
                    </span>
                  </div>
                  {/* Progress indicator */}
                  <div className="flex gap-1 mt-3">
                    {PIPELINE_STEPS.map((step) => (
                      <div
                        key={step.key}
                        className={`h-1.5 flex-1 rounded-full ${c[step.key] ? 'bg-sh-green' : 'bg-sh-pink-light/50'}`}
                        title={step.label}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-sh-text-light mt-2">
                    {stepsCompleted(c)} מתוך 5 שלבים
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Drill-down drawer */}
      <AnimatePresence>
        {selectedCompany && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelectedCompany(null)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-sh-card shadow-2xl z-50 overflow-y-auto p-8"
              dir="rtl"
            >
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-sh-text-muted hover:text-sh-text text-2xl leading-none mb-6 block"
              >
                ✕
              </button>
              <h2 className="text-2xl font-black text-sh-text mb-1">{selectedCompany.name}</h2>

              <div className="flex gap-2 flex-wrap mb-6 mt-3">
                <span className={`text-xs px-2 py-1 rounded-pill font-medium ${STATUS_STYLES[selectedCompany.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                  {selectedCompany.status || 'לא ידוע'}
                </span>
                {selectedCompany.recruitmentStatus && (
                  <span className="text-xs px-2 py-1 rounded-pill font-medium bg-sh-pink-light/50 text-sh-text-muted">
                    {selectedCompany.recruitmentStatus}
                  </span>
                )}
              </div>

              {/* Pipeline steps */}
              <h3 className="font-bold text-sh-text mb-3">שלבי התהליך</h3>
              <div className="space-y-2 mb-6">
                {PIPELINE_STEPS.map((step) => (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedCompany[step.key]
                        ? 'bg-sh-green text-white'
                        : 'bg-sh-pink-light text-sh-text-light'
                    }`}>
                      {selectedCompany[step.key] ? '✓' : '—'}
                    </div>
                    <span className={`text-sm ${selectedCompany[step.key] ? 'text-sh-text font-medium' : 'text-sh-text-light'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selectedCompany.notes && (
                <>
                  <h3 className="font-bold text-sh-text mb-2">הערות</h3>
                  <p className="text-sm text-sh-text leading-relaxed bg-sh-yellow-light rounded-xl p-4 mb-6">
                    {selectedCompany.notes}
                  </p>
                </>
              )}

              {/* Requirements */}
              {selectedCompany.requirements && (
                <>
                  <h3 className="font-bold text-sh-text mb-2">מה נדרש</h3>
                  <p className="text-sm text-sh-text leading-relaxed bg-sh-green-light rounded-xl p-4 mb-6">
                    {selectedCompany.requirements}
                  </p>
                </>
              )}

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-sh-pink-light">
                <div className="text-3xl font-black text-sh-text">{stepsCompleted(selectedCompany)}<span className="text-lg font-bold text-sh-text-muted"> / 5</span></div>
                <div className="text-sm text-sh-text-muted">שלבים שהושלמו</div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
