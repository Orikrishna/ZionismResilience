import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import data from './data/companies.json'

// Existing widgets
import KpiCard from './components/KpiCard'
import FunnelChart from './components/FunnelChart'
import StatusDonut from './components/StatusDonut'
import PipelineBar from './components/PipelineBar'

// New v2 widgets
import SearchBar from './components/SearchBar'
import IndustryChart from './components/IndustryChart'
import CompanySizeChart from './components/CompanySizeChart'
import BottleneckCard from './components/BottleneckCard'
import EngagementPyramid from './components/EngagementPyramid'
import StraussRow from './components/StraussRow'
import ProcessTracker from './components/ProcessTracker'
import ReferralChart from './components/ReferralChart'
import ExtraKpis from './components/ExtraKpis'
import UndecidedList from './components/UndecidedList'

const STATUS_STYLES = {
  'כן': 'bg-sh-green-light text-sh-green',
  'לא': 'bg-sh-pink-light text-sh-pink',
  'טרם הוחלט': 'bg-sh-yellow-light text-sh-yellow',
}

const PIPELINE_STEPS = [
  { key: 'emailSent', label: 'מייל נשלח' },
  { key: 'meetingHeld', label: 'פגישה' },
  { key: 'agreementSent', label: 'הסכם נשלח' },
  { key: 'agreementSigned', label: 'הסכם חתום' },
  { key: 'paid', label: 'שולם' },
]

const PROCESS_STEP_LABELS = {
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
  presentRecommendations: 'הצגת המלצות',
  productDecision: 'בחירת מוצר',
  ganttCreation: 'בניית גאנט',
  processCompletion: 'סיום תהליך',
  solutionValidation: 'תיקוף',
  productImplementation: 'הטמעה',
  influencerSharing: 'שיתוף משפיענים',
  digitalMarketing: 'שיווק דיגיטלי',
  pressReleaseDraft: 'ניסוח הודעה לעיתונות',
  pressReleaseApproval: 'אישור הודעה',
  websiteUpdate: 'עדכון אתר',
  exposureData: 'נתוני חשיפה',
}

function stepsCompleted(company) {
  return PIPELINE_STEPS.filter(s => company[s.key]).length
}

export default function App() {
  const { companies } = data
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [filterStatus, setFilterStatus] = useState('הכל')
  const [searchQuery, setSearchQuery] = useState('')

  const statusOptions = ['הכל', 'כן', 'לא', 'טרם הוחלט']

  const filtered = useMemo(() => {
    let result = companies
    if (filterStatus !== 'הכל') {
      result = result.filter(c => c.status === filterStatus)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        (c.requirements && c.requirements.toLowerCase().includes(q)) ||
        (c.industry && c.industry.toLowerCase().includes(q))
      )
    }
    return result
  }, [companies, filterStatus, searchQuery])

  const totalCompanies = companies.length
  const joined = companies.filter(c => c.paid).length
  const meetings = companies.filter(c => c.meetingHeld).length
  const agreementsSigned = companies.filter(c => c.agreementSigned).length
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

        {/* ── Section 1: KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="חברות בליווי" value={totalCompanies} accent />
          <KpiCard label="חברות שהצטרפו" value={joined} />
          <KpiCard label="פגישות שהתקיימו" value={meetings} />
          <KpiCard label="הסכמים שנחתמו" value={agreementsSigned} />
          <KpiCard label="אחוז המרה" value={`${conversionRate}%`} />
        </div>

        {/* ── Section 2: Funnel + Bottleneck ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FunnelChart companies={companies} />
          </div>
          <BottleneckCard companies={companies} />
        </div>

        {/* ── Section 3: Donut + Pipeline + Pyramid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusDonut companies={companies} />
          <PipelineBar companies={companies} />
          <EngagementPyramid companies={companies} />
        </div>

        {/* ── Section 4: Extra KPIs ── */}
        <ExtraKpis companies={companies} />

        {/* ── Section 5: Industry + Size + Referral ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <IndustryChart companies={companies} />
          <CompanySizeChart companies={companies} />
          <ReferralChart companies={companies} />
        </div>

        {/* ── Section 6: Strauss Case Study ── */}
        <StraussRow companies={companies} />

        {/* ── Section 7: Process Tracker (23 steps) ── */}
        <ProcessTracker companies={companies} />

        {/* ── Section 8: "They didn't say no" ── */}
        <UndecidedList companies={companies} />

        {/* ── Section 9: Company Grid with Search + Filter ── */}
        <div className="bg-sh-card rounded-card-sh shadow-card p-6">
          <h2 className="text-lg font-bold text-sh-text mb-4">
            חברות ({filtered.length}{filtered.length !== companies.length ? ` מתוך ${companies.length}` : ''})
          </h2>

          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-sh-text-muted">סטטוס:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm bg-sh-card border border-sh-pink-light rounded-pill px-3 py-1.5 text-sh-text focus:outline-none focus:border-sh-pink"
              >
                {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {(filterStatus !== 'הכל' || searchQuery) && (
                <button
                  onClick={() => { setFilterStatus('הכל'); setSearchQuery('') }}
                  className="text-sm text-sh-pink underline"
                >
                  נקה
                </button>
              )}
            </div>
          </div>

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
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-bold text-sh-text">{c.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-medium whitespace-nowrap ${STATUS_STYLES[c.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                      {c.status || '—'}
                    </span>
                  </div>
                  {/* Industry + Size badges */}
                  <div className="flex gap-1 flex-wrap mb-2">
                    {c.industry && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sh-bg text-sh-text-light">{c.industry}</span>
                    )}
                    {c.companySize && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sh-bg text-sh-text-light">{c.companySize}</span>
                    )}
                  </div>
                  {/* Progress indicator */}
                  <div className="flex gap-1">
                    {PIPELINE_STEPS.map((step) => (
                      <div
                        key={step.key}
                        className={`h-1.5 flex-1 rounded-full ${c[step.key] ? 'bg-sh-green' : 'bg-sh-pink-light/50'}`}
                        title={step.label}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-sh-text-light mt-1">
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
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-sh-card shadow-2xl z-50 overflow-y-auto p-8"
              dir="rtl"
            >
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-sh-text-muted hover:text-sh-text text-2xl leading-none mb-6 block"
              >
                ✕
              </button>
              <h2 className="text-2xl font-black text-sh-text mb-1">{selectedCompany.name}</h2>

              {/* Status + metadata badges */}
              <div className="flex gap-2 flex-wrap mb-6 mt-3">
                <span className={`text-xs px-2 py-1 rounded-pill font-medium ${STATUS_STYLES[selectedCompany.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                  {selectedCompany.status || 'לא ידוע'}
                </span>
                {selectedCompany.recruitmentStatus && (
                  <span className="text-xs px-2 py-1 rounded-pill font-medium bg-sh-pink-light/50 text-sh-text-muted">
                    {selectedCompany.recruitmentStatus}
                  </span>
                )}
                {selectedCompany.industry && (
                  <span className="text-xs px-2 py-1 rounded-pill font-medium bg-sh-bg text-sh-text-muted">
                    {selectedCompany.industry}
                  </span>
                )}
                {selectedCompany.companySize && (
                  <span className="text-xs px-2 py-1 rounded-pill font-medium bg-sh-bg text-sh-text-muted">
                    {selectedCompany.companySize}
                  </span>
                )}
                {selectedCompany.referralSource1 && (
                  <span className="text-xs px-2 py-1 rounded-pill font-medium bg-sh-bg text-sh-text-muted">
                    {selectedCompany.referralSource1}
                  </span>
                )}
              </div>

              {/* Pipeline steps */}
              <h3 className="font-bold text-sh-text mb-3">שלבי גיוס</h3>
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

              {/* Process steps (only for כן companies with process data) */}
              {selectedCompany.status === 'כן' && selectedCompany.process && (
                <>
                  <h3 className="font-bold text-sh-text mb-3">שלבי תהליך</h3>
                  {[
                    { name: 'learning', label: 'למידה', color: '#4263aa' },
                    { name: 'development', label: 'פיתוח', color: '#70bdb3' },
                    { name: 'marketing', label: 'שיווק', color: '#e9ab56' },
                  ].map(phase => {
                    const phaseData = selectedCompany.process[phase.name]
                    if (!phaseData) return null
                    const steps = Object.entries(phaseData)
                    const hasAny = steps.some(([, v]) => v !== null)
                    if (!hasAny) return null

                    return (
                      <div key={phase.name} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: phase.color }} />
                          <span className="text-sm font-bold text-sh-text">{phase.label}</span>
                        </div>
                        <div className="space-y-1">
                          {steps.map(([key, value]) => {
                            if (value === null) return null
                            return (
                              <div key={key} className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  value === 'כן' ? 'bg-sh-green text-white'
                                    : value === 'בתהליך' ? 'bg-sh-yellow text-white'
                                    : 'bg-sh-pink-light text-sh-text-light'
                                }`}>
                                  {value === 'כן' ? '✓' : value === 'בתהליך' ? '◐' : '—'}
                                </div>
                                <span className={`text-xs ${
                                  value === 'כן' ? 'text-sh-text' : value === 'בתהליך' ? 'text-sh-yellow' : 'text-sh-text-light'
                                }`}>
                                  {PROCESS_STEP_LABELS[key] || key}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Outcomes */}
              {selectedCompany.outcomes?.hasProduct !== null && (
                <>
                  <h3 className="font-bold text-sh-text mb-2 mt-4">תוצרים</h3>
                  <div className="bg-sh-green-light/30 rounded-xl p-4 mb-4 space-y-2">
                    {selectedCompany.outcomes.productDescription && (
                      <div>
                        <span className="text-xs text-sh-text-muted">מוצר/שירות: </span>
                        <span className="text-sm text-sh-text">{selectedCompany.outcomes.productDescription}</span>
                      </div>
                    )}
                    {selectedCompany.outcomes.satisfaction && (
                      <div>
                        <span className="text-xs text-sh-text-muted">שביעות רצון: </span>
                        <span className="text-sm text-sh-text">{selectedCompany.outcomes.satisfaction}</span>
                      </div>
                    )}
                    {selectedCompany.outcomes.mediaExposure && (
                      <div>
                        <span className="text-xs text-sh-text-muted">חשיפה: </span>
                        <span className="text-sm text-sh-text">{selectedCompany.outcomes.mediaExposure}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Notes */}
              {selectedCompany.notes && (
                <>
                  <h3 className="font-bold text-sh-text mb-2">הערות</h3>
                  <p className="text-sm text-sh-text leading-relaxed bg-sh-yellow-light rounded-xl p-4 mb-4">
                    {selectedCompany.notes}
                  </p>
                </>
              )}

              {/* Requirements */}
              {selectedCompany.requirements && (
                <>
                  <h3 className="font-bold text-sh-text mb-2">מה נדרש</h3>
                  <p className="text-sm text-sh-text leading-relaxed bg-sh-green-light rounded-xl p-4 mb-4">
                    {selectedCompany.requirements}
                  </p>
                </>
              )}

              {/* Summary */}
              <div className="mt-6 pt-6 border-t border-sh-pink-light">
                <div className="text-3xl font-black text-sh-text">{stepsCompleted(selectedCompany)}<span className="text-lg font-bold text-sh-text-muted"> / 5</span></div>
                <div className="text-sm text-sh-text-muted">שלבי גיוס שהושלמו</div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
