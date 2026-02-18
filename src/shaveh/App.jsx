import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, RefreshCw, Building2 } from 'lucide-react'
import data from './data/companies.json'
import ThemeContext from './ThemeContext'

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
import CommunityTimeline from './components/CommunityTimeline'
import CohortAnalysis from './components/CohortAnalysis'

const BASE = import.meta.env.BASE_URL

export function CompanyLogo({ companyId, size = 32, className = '' }) {
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

  const TAB_THEMES = [
    {
      id: 'pink',
      accent: '#e8969f',
      light: '#f8dfe2',
      bg: '#f9f2f3',
      lightAlpha40: 'rgba(248,223,226,0.4)',
      lightAlpha50: 'rgba(248,223,226,0.5)',
      lightAlpha60: 'rgba(248,223,226,0.6)',
      lightAlpha30: 'rgba(248,223,226,0.3)',
    },
    {
      id: 'blue',
      accent: '#4263aa',
      light: '#d6dff2',
      bg: '#f2f4f9',
      lightAlpha40: 'rgba(214,223,242,0.4)',
      lightAlpha50: 'rgba(214,223,242,0.5)',
      lightAlpha60: 'rgba(214,223,242,0.6)',
      lightAlpha30: 'rgba(214,223,242,0.3)',
    },
    {
      id: 'green',
      accent: '#70bdb3',
      light: '#caece9',
      bg: '#f2f9f7',
      lightAlpha40: 'rgba(202,236,233,0.4)',
      lightAlpha50: 'rgba(202,236,233,0.5)',
      lightAlpha60: 'rgba(202,236,233,0.6)',
      lightAlpha30: 'rgba(202,236,233,0.3)',
    },
  ]

  const theme = TAB_THEMES[activeTab]

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
    return result.sort((a, b) => a.name.localeCompare(b.name, 'he'))
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
    <motion.div
      className="min-h-screen font-noto"
      dir="rtl"
      animate={{ backgroundColor: theme.bg }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{
        '--theme-accent': theme.accent,
        '--theme-light': theme.light,
        '--theme-light-40': theme.lightAlpha40,
        '--theme-light-50': theme.lightAlpha50,
        '--theme-light-60': theme.lightAlpha60,
        '--theme-accent-10': theme.accent + '1a',
      }}
    >
      {/* Header */}
      <header dir="rtl" className="bg-sh-card shadow-card px-10 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 bg-sh-pink rounded-xl flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 58 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-white">
              <path d="M12.4961 24.9688V16.7717L16.5302 17.0737V25.2708L12.4961 24.9688ZM20.1345 25.5394V14.566L12.4978 13.9954V10.2363L24.2207 11.1123V25.843L20.1345 25.5377V25.5394Z" fill="currentColor"/>
              <path d="M28.152 26.1381V15.1647L26.49 15.0413V11.2822L32.2381 11.711V26.4418L28.152 26.1365V26.1381Z" fill="currentColor"/>
              <path d="M36.0428 26.728V15.7546L34.3809 15.6311V11.8721L40.129 12.3009V27.0316L36.0428 26.7263V26.728Z" fill="currentColor"/>
              <path d="M53.5615 28.0374L43.0742 27.2532V12.5225L46.8078 12.8011V23.7745L53.6371 24.2851C53.7378 24.2917 53.8637 24.1766 53.8637 24.0748V13.33L57.5973 13.6086V24.3034C57.5956 26.2955 55.6029 28.1909 53.5615 28.0374ZM51.3439 21.8174L49.7306 22.9336L48.1424 21.3269L48.5453 20.0455V12.9329L52.1765 13.2049V20.2174C52.1765 20.9999 51.923 21.4353 51.3439 21.8208V21.8174Z" fill="currentColor"/>
              <path d="M7.98288 42.8912V32.1464C7.98288 32.0463 7.85865 31.9095 7.75792 31.9028L4.2795 31.6425V42.6159L0.193359 42.3106V27.5798L8.03492 28.1655C10.0259 28.314 12.0673 30.4596 12.0673 32.5034V43.1982L7.9812 42.8929L7.98288 42.8912Z" fill="currentColor"/>
              <path d="M15.9979 43.4907V32.5173L14.3359 32.3938V28.6348L20.0841 29.0636V43.7943L15.9979 43.489V43.4907Z" fill="currentColor"/>
              <path d="M31.5266 44.6516V33.6798L28.2513 33.4346V41.1779C28.2513 42.7662 26.6615 44.2879 25.023 44.1661L21.9727 43.9375V40.1785L23.9385 40.3253C24.0392 40.3336 24.1651 40.2168 24.1651 40.1151V33.1276L22.3504 32.9924V29.2334L35.611 30.2245V44.9552L31.5249 44.6499L31.5266 44.6516Z" fill="currentColor"/>
              <path d="M39.7456 37.6474V34.2922L37.8301 34.1487V30.3896L43.83 30.8385V37.9511L39.7456 37.6458V37.6474Z" fill="currentColor"/>
              <path d="M53.9356 46.3262L46.0957 45.7405V41.9815L53.6586 42.5471C53.7593 42.5538 53.8852 42.4387 53.8852 42.3369V35.5763C53.8852 35.4762 53.761 35.3394 53.6603 35.3327L50.0559 35.0641V36.9812L51.9211 37.1213V40.5767L46.0974 40.1412V31.0098L53.9389 31.5954C55.93 31.7439 57.9714 33.8895 57.9714 35.9334V42.5922C57.9714 44.5843 55.9787 46.4797 53.9373 46.3262H53.9356Z" fill="currentColor"/>
              <path d="M58 10.1626V0H0V6.1299L58 10.1626Z" fill="currentColor"/>
              <path d="M0 45.8379V56.0004H58V49.8689L0 45.8379Z" fill="currentColor"/>
            </svg>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold text-sh-text">פרויקט שווה פיתוח<span className="mx-2 text-sh-text-muted font-normal">|</span>תמונת מצב</h1>
            <p className="text-base text-sh-text-muted">מיזם להתאמת מוצרים ושירותים לאנשים עם מוגבלות</p>
          </div>
        </div>
        <img src={`${import.meta.env.BASE_URL}zionism2000-logo.jpg`} alt="ציונות 2000" className="h-16 object-contain" />
      </header>

      {/* Tab bar */}
      <div className="max-w-7xl mx-auto px-6 mt-6 mb-2">
        <motion.div
          className="flex gap-1 rounded-2xl p-1.5 shadow-sm"
          animate={{
            backgroundColor: theme.lightAlpha40,
            borderColor: theme.lightAlpha50,
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{ borderWidth: '1px', borderStyle: 'solid' }}
        >
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
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300"
                style={{ backgroundColor: activeTab === i ? theme.lightAlpha60 : theme.lightAlpha30 }}
              >
                <tab.Icon
                  size={16}
                  strokeWidth={2.2}
                  className="transition-colors duration-300"
                  style={{ color: activeTab === i ? theme.accent : '#948c89' }}
                />
              </span>
              {tab.label}
            </button>
          ))}
        </motion.div>
      </div>

      <ThemeContext.Provider value={theme}>
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
              className="text-sm underline"
              style={{ color: theme.accent }}
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

        {/* ── Section 2: Funnel + Referral ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FunnelChart companies={filteredTab1} />
          </div>
          <ReferralChart companies={filteredTab1} />
        </div>

        {/* ── Section 3: Donut + Pipeline + Pyramid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatusDonut companies={filteredTab1} />
          <PipelineBar companies={filteredTab1} />
          <EngagementPyramid companies={filteredTab1} />
        </div>

        {/* ── Section 4: Extra KPIs ── */}
        <ExtraKpis companies={filteredTab1} />

        {/* ── Section 5: Industry + Size + Bottleneck ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <IndustryChart companies={filteredTab1} />
          <CompanySizeChart companies={filteredTab1} />
          <BottleneckCard companies={filteredTab1} />
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
              className="text-sm underline"
              style={{ color: theme.accent }}
            >
              נקה הכל
            </button>
          )}
          {tab2HasFilters && (
            <span className="text-xs text-sh-text-light mr-auto">{filteredTab2.length} מתוך {companies.length} חברות</span>
          )}
        </div>

        {/* ── Section 6b: Community Timeline + Cohort Analysis ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CommunityTimeline companies={filteredTab2} />
          <CohortAnalysis companies={filteredTab2} />
        </div>

        {/* ── Section 7: Process Tracker (23 steps) ── */}
        <ProcessTracker companies={filteredTab2} />

        {/* ── Section 8: "They didn't say no" ── */}
        <UndecidedList companies={filteredTab2} onCompanyClick={setSelectedCompany} />

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
                  className="text-sm underline"
              style={{ color: theme.accent }}
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
                  className="border rounded-xl p-4 hover:shadow-card-hover transition-shadow cursor-pointer"
                  style={{ borderColor: theme.light }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                        <CompanyLogo companyId={c.id} size={32} />
                      </div>
                      <div className="font-bold text-sh-text truncate">{c.name}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-medium whitespace-nowrap ${STATUS_STYLES[c.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                      {c.status || '—'}
                    </span>
                  </div>
                  {/* Industry + Size badges */}
                  <div className="flex gap-1 flex-wrap mb-2 min-h-[22px]">
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
      </ThemeContext.Provider>

      {/* Footer */}
      <footer
        className="mt-12 bg-sh-card/60"
        style={{ borderTop: `1px solid ${theme.lightAlpha50}` }}
      >
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
                <CompanyLogo companyId={selectedCompany.id} size={80} />
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
    </motion.div>
  )
}
