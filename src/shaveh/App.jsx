import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, RefreshCw, Building2 } from 'lucide-react'
import data from './data/companies.json'

// Existing widgets
import KpiCard from './components/KpiCard'
import FunnelChart from './components/FunnelChart'
import StatusDonut from './components/StatusDonut'
import PipelineBar from './components/PipelineBar'

// New v2 widgets
import SearchBar from './components/SearchBar'
import FilterDropdown from './components/FilterDropdown'
import IndustryChart from './components/IndustryChart'
import CompanySizeChart from './components/CompanySizeChart'
import BottleneckCard from './components/BottleneckCard'
import EngagementPyramid from './components/EngagementPyramid'
import StraussRow from './components/StraussRow'
import ProcessTracker from './components/ProcessTracker'
import ReferralChart from './components/ReferralChart'
import ExtraKpis from './components/ExtraKpis'
import UndecidedList from './components/UndecidedList'

const BASE = import.meta.env.BASE_URL

function CompanyLogo({ companyId, size = 32, className = '' }) {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    <img
      src={`${BASE}logos/${companyId}.png`}
      alt=""
      width={size}
      height={size}
      className={`object-contain rounded-lg shrink-0 ${className}`}
      onError={() => setHidden(true)}
      loading="lazy"
    />
  )
}

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
  const [activeTab, setActiveTab] = useState(0)

  // Independent per-tab filter state
  const [tab1Status, setTab1Status] = useState('הכל')
  const [tab1Industry, setTab1Industry] = useState('הכל')
  const [tab1Size, setTab1Size] = useState('הכל')

  const [tab2Status, setTab2Status] = useState('הכל')
  const [tab2Industry, setTab2Industry] = useState('הכל')
  const [tab2Size, setTab2Size] = useState('הכל')

  const [tab3Status, setTab3Status] = useState('הכל')
  const [tab3Industry, setTab3Industry] = useState('הכל')
  const [tab3Size, setTab3Size] = useState('הכל')
  const [searchQuery, setSearchQuery] = useState('')

  const TABS = [
    { label: 'ריכוז מידע', id: 'general', Icon: BarChart3 },
    { label: 'שלבי התהליך', id: 'phases', Icon: RefreshCw },
    { label: 'פירוט החברות', id: 'companies', Icon: Building2 },
  ]

  const statusOptions = ['הכל', 'כן', 'לא', 'טרם הוחלט']

  // Unique filter options from data
  const industryOptions = useMemo(() => {
    const set = new Set(companies.map(c => c.industry).filter(Boolean))
    return ['הכל', ...Array.from(set).sort()]
  }, [companies])

  const sizeOptions = useMemo(() => {
    const order = ['קטנה', 'בינונית', 'גדולה', 'גלובלית']
    const set = new Set(companies.map(c => c.companySize).filter(Boolean))
    return ['הכל', ...order.filter(s => set.has(s))]
  }, [companies])

  // Helper: apply status + industry + size filters
  function applyFilters(list, status, industry, size) {
    let result = list
    if (status !== 'הכל') result = result.filter(c => c.status === status)
    if (industry !== 'הכל') result = result.filter(c => c.industry === industry)
    if (size !== 'הכל') result = result.filter(c => c.companySize === size)
    return result
  }

  const filteredTab1 = useMemo(
    () => applyFilters(companies, tab1Status, tab1Industry, tab1Size),
    [companies, tab1Status, tab1Industry, tab1Size]
  )

  const filteredTab2 = useMemo(
    () => applyFilters(companies, tab2Status, tab2Industry, tab2Size),
    [companies, tab2Status, tab2Industry, tab2Size]
  )

  const filteredTab3 = useMemo(() => {
    let result = applyFilters(companies, tab3Status, tab3Industry, tab3Size)
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
  }, [companies, tab3Status, tab3Industry, tab3Size, searchQuery])

  // KPIs computed from Tab 1 filtered data
  const totalCompanies = filteredTab1.length
  const joined = filteredTab1.filter(c => c.paid).length
  const meetings = filteredTab1.filter(c => c.meetingHeld).length
  const agreementsSigned = filteredTab1.filter(c => c.agreementSigned).length
  const emailsSent = filteredTab1.filter(c => c.emailSent).length
  const conversionRate = emailsSent > 0 ? ((joined / emailsSent) * 100).toFixed(1) : '0'

  const tab1HasFilters = tab1Status !== 'הכל' || tab1Industry !== 'הכל' || tab1Size !== 'הכל'
  const tab2HasFilters = tab2Status !== 'הכל' || tab2Industry !== 'הכל' || tab2Size !== 'הכל'
  const tab3HasFilters = tab3Status !== 'הכל' || tab3Industry !== 'הכל' || tab3Size !== 'הכל' || searchQuery

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

      {/* Tab bar */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-2">
        <div className="flex gap-1 bg-sh-pink-light/40 rounded-2xl p-1.5 shadow-sm border border-sh-pink-light/50">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(i)}
              className={`flex-1 px-6 py-3 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2.5 ${
                activeTab === i
                  ? 'bg-sh-card shadow-card text-sh-text'
                  : 'text-sh-text-muted hover:text-sh-text hover:bg-sh-card/50'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activeTab === i ? 'bg-sh-pink-light/60' : 'bg-sh-pink-light/30'
              }`}>
                <tab.Icon size={16} strokeWidth={2.2} className={activeTab === i ? 'text-sh-pink' : 'text-sh-text-light'} />
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-8">

        {/* ══════ Tab 1: ריכוז מידע ══════ */}
        {activeTab === 0 && <>

        {/* Tab 1 filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown label="סטטוס" value={tab1Status} options={statusOptions} onChange={setTab1Status} />
          <FilterDropdown label="ענף" value={tab1Industry} options={industryOptions} onChange={setTab1Industry} />
          <FilterDropdown label="גודל" value={tab1Size} options={sizeOptions} onChange={setTab1Size} />
          {tab1HasFilters && (
            <button
              onClick={() => { setTab1Status('הכל'); setTab1Industry('הכל'); setTab1Size('הכל') }}
              className="text-sm text-sh-pink underline"
            >
              נקה הכל
            </button>
          )}
          {tab1HasFilters && (
            <span className="text-xs text-sh-text-light mr-auto">{filteredTab1.length} מתוך {companies.length} חברות</span>
          )}
        </div>

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
            <FunnelChart companies={filteredTab1} />
          </div>
          <BottleneckCard companies={filteredTab1} />
        </div>

        {/* ── Section 3: Donut + Pipeline + Pyramid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusDonut companies={filteredTab1} />
          <PipelineBar companies={filteredTab1} />
          <EngagementPyramid companies={filteredTab1} />
        </div>

        {/* ── Section 4: Extra KPIs ── */}
        <ExtraKpis companies={filteredTab1} />

        {/* ── Section 5: Industry + Size + Referral ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <IndustryChart companies={filteredTab1} />
          <CompanySizeChart companies={filteredTab1} />
          <ReferralChart companies={filteredTab1} />
        </div>

        {/* ── Section 6: Strauss Case Study ── */}
        <StraussRow companies={filteredTab1} />

        </>}

        {/* ══════ Tab 2: שלבי התהליך ══════ */}
        {activeTab === 1 && <>

        {/* Tab 2 filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown label="סטטוס" value={tab2Status} options={statusOptions} onChange={setTab2Status} />
          <FilterDropdown label="ענף" value={tab2Industry} options={industryOptions} onChange={setTab2Industry} />
          <FilterDropdown label="גודל" value={tab2Size} options={sizeOptions} onChange={setTab2Size} />
          {tab2HasFilters && (
            <button
              onClick={() => { setTab2Status('הכל'); setTab2Industry('הכל'); setTab2Size('הכל') }}
              className="text-sm text-sh-pink underline"
            >
              נקה הכל
            </button>
          )}
          {tab2HasFilters && (
            <span className="text-xs text-sh-text-light mr-auto">{filteredTab2.length} מתוך {companies.length} חברות</span>
          )}
        </div>

        {/* ── Section 7: Process Tracker (23 steps) ── */}
        <ProcessTracker companies={filteredTab2} />

        {/* ── Section 8: "They didn't say no" ── */}
        <UndecidedList companies={filteredTab2} />

        </>}

        {/* ══════ Tab 3: פירוט החברות ══════ */}
        {activeTab === 2 && <>

        {/* ── Section 9: Company Grid with Search + Filter ── */}
        <div className="bg-sh-card rounded-card-sh shadow-card p-6">
          <h2 className="text-lg font-bold text-sh-text mb-4">
            חברות ({filteredTab3.length}{filteredTab3.length !== companies.length ? ` מתוך ${companies.length}` : ''})
          </h2>

          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <FilterDropdown label="סטטוס" value={tab3Status} options={statusOptions} onChange={setTab3Status} />
              <FilterDropdown label="ענף" value={tab3Industry} options={industryOptions} onChange={setTab3Industry} />
              <FilterDropdown label="גודל" value={tab3Size} options={sizeOptions} onChange={setTab3Size} />
              {tab3HasFilters && (
                <button
                  onClick={() => { setSearchQuery(''); setTab3Status('הכל'); setTab3Industry('הכל'); setTab3Size('הכל') }}
                  className="text-sm text-sh-pink underline"
                >
                  נקה הכל
                </button>
              )}
            </div>
          </div>

          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredTab3.map((c) => (
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
                    <div className="flex items-center gap-2 min-w-0">
                      <CompanyLogo companyId={c.id} size={32} />
                      <div className="font-bold text-sh-text truncate">{c.name}</div>
                    </div>
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

        </>}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-sh-pink-light/50 bg-sh-card/60">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="text-sm text-sh-text-muted">
            דשבורד שווה פיתוח · ציונות 2000
          </div>
          <div className="text-xs text-sh-text-light">
            עודכן לאחרונה: פברואר 2026
          </div>
        </div>
      </footer>

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
              className="fixed top-0 left-0 h-full w-full max-w-lg bg-sh-card shadow-2xl z-50 overflow-y-auto p-8"
              dir="rtl"
            >
              <button
                onClick={() => setSelectedCompany(null)}
                className="text-sh-text-muted hover:text-sh-text text-2xl leading-none mb-6 block"
              >
                ✕
              </button>
              <div className="flex items-center gap-3 mb-1">
                <CompanyLogo companyId={selectedCompany.id} size={48} />
                <h2 className="text-2xl font-black text-sh-text">{selectedCompany.name}</h2>
              </div>

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
