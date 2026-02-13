import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import plantsData from './data/plants.json'
import KpiCard from './components/KpiCard'
import DepthChart from './components/DepthChart'
import GeoDonut from './components/GeoDonut'
import TimelineChart from './components/TimelineChart'
import SectorChart from './components/SectorChart'
import GeoMap from './components/GeoMap'

const GEO_COLORS = {
  'עוטף עזה': 'bg-geo-gaza-bg text-geo-gaza',
  'גליל עליון': 'bg-geo-north-bg text-geo-north',
  'חוף אשקלון': 'bg-geo-carmel-bg text-geo-carmel',
  'רמת הגולן': 'bg-geo-golan-bg text-geo-golan',
  'גליל מערבי': 'bg-geo-galil-west-bg text-geo-galil-west',
}

export default function App() {
  const { plants, timeline, summary } = plantsData
  const [selectedPlant, setSelectedPlant] = useState(null)

  // Filters
  const [filterStage, setFilterStage] = useState('הכל')
  const [filterGeo, setFilterGeo] = useState('הכל')
  const [filterSector, setFilterSector] = useState('הכל')

  const stages = ['הכל', ...new Set(plants.map((p) => p.stage))]
  const geos = ['הכל', ...new Set(plants.map((p) => p.geography))]
  const sectors = ['הכל', ...new Set(plants.map((p) => p.sector))]

  const filtered = plants.filter((p) => {
    if (filterStage !== 'הכל' && p.stage !== filterStage) return false
    if (filterGeo !== 'הכל' && p.geography !== filterGeo) return false
    if (filterSector !== 'הכל' && p.sector !== filterSector) return false
    return true
  })

  const filteredSummary = {
    totalPlants: filtered.length,
    totalParticipants: filtered.reduce((s, p) => s + p.totalParticipants, 0),
    totalSessions: filtered.reduce((s, p) => s + p.totalSessions, 0),
    totalCEOs: filtered.reduce((s, p) => s + p.ceoCount, 0),
    totalHRManagers: filtered.reduce((s, p) => s + p.hrManagerCount, 0),
  }

  const isFiltered = filterStage !== 'הכל' || filterGeo !== 'הכל' || filterSector !== 'הכל'

  return (
    <div className="min-h-screen bg-background font-heebo" dir="rtl">
      {/* Header */}
      <header className="bg-card shadow-card px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold text-text-main">דשבורד חוסן תעשייה קיבוצית</h1>
          <p className="text-sm text-text-muted">דצמבר 2023 – נובמבר 2025</p>
        </div>
        <img src={`${import.meta.env.BASE_URL}zionism2000-logo.jpg`} alt="ציונות 2000" className="h-12 object-contain" />
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <FilterSelect label="שלב" value={filterStage} options={stages} onChange={setFilterStage} />
          <FilterSelect label="אזור" value={filterGeo} options={geos} onChange={setFilterGeo} />
          <FilterSelect label="ענף" value={filterSector} options={sectors} onChange={setFilterSector} />
          {isFiltered && (
            <button
              onClick={() => { setFilterStage('הכל'); setFilterGeo('הכל'); setFilterSector('הכל') }}
              className="text-sm text-accent underline"
            >
              נקה פילטרים
            </button>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiCard label="מפעלים בתכנית" value={filteredSummary.totalPlants} accent />
          <KpiCard label="משתתפים" value={filteredSummary.totalParticipants} />
          <KpiCard label="סדנאות" value={filteredSummary.totalSessions} />
          <KpiCard label='מנכ"לים' value={filteredSummary.totalCEOs} />
          <KpiCard label='מנהלי מש"א' value={filteredSummary.totalHRManagers} />
        </div>

        {/* Timeline — full width */}
        <TimelineChart timeline={timeline} />

        {/* Two charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectorChart plants={filtered} />
          </div>
          <div>
            <GeoDonut plants={filtered} />
          </div>
        </div>

        {/* Depth chart — full width */}
        <DepthChart plants={filtered} />

        {/* Geographic map */}
        {/* <GeoMap plants={filtered} /> */}

        {/* Plants grid */}
        <div className="bg-card rounded-card shadow-card p-6">
          <h2 className="text-lg font-bold text-text-main mb-4">
            מפעלים ({filtered.length}{filtered.length !== plants.length ? ` מתוך ${plants.length}` : ''})
          </h2>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedPlant(p)}
                  className="border border-accent-pale rounded-xl p-4 hover:shadow-card-hover transition-shadow cursor-pointer"
                >
                  <div className="font-bold text-text-main">{p.name}</div>
                  <div className="text-sm text-text-muted mb-2">{p.kibbutz}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${p.stage === 'פיילוט' ? 'bg-accent-light text-accent' : 'bg-geo-north-bg text-geo-north'}`}>
                      {p.stage}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${GEO_COLORS[p.geography] || 'bg-gray-100 text-text-muted'}`}>
                      {p.geography}
                    </span>
                  </div>
                  <div className="text-sm mt-3 text-text-muted">
                    {p.totalParticipants} משתתפים · {p.totalSessions} סדנאות
                  </div>
                  {/* Mini layer bar */}
                  <MiniBar plant={p} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      {/* Drill-down drawer */}
      <AnimatePresence>
        {selectedPlant && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelectedPlant(null)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-2xl z-50 overflow-y-auto p-8"
              dir="rtl"
            >
              <button
                onClick={() => setSelectedPlant(null)}
                className="text-text-muted hover:text-text-main text-2xl leading-none mb-6 block"
              >
                ✕
              </button>
              <h2 className="text-2xl font-black text-text-main mb-1">{selectedPlant.name}</h2>
              <p className="text-sm text-text-muted mb-6">{selectedPlant.kibbutz}</p>

              <div className="flex gap-2 flex-wrap mb-6">
                <span className={`text-xs px-2 py-1 rounded-pill font-medium ${selectedPlant.stage === 'פיילוט' ? 'bg-accent-light text-accent' : 'bg-geo-north-bg text-geo-north'}`}>
                  {selectedPlant.stage}
                </span>
                <span className={`text-xs px-2 py-1 rounded-pill font-medium ${GEO_COLORS[selectedPlant.geography] || 'bg-gray-100 text-text-muted'}`}>
                  {selectedPlant.geography}
                </span>
                <span className="text-xs px-2 py-1 rounded-pill font-medium bg-gray-100 text-text-muted">
                  {selectedPlant.sector}
                </span>
              </div>

              {selectedPlant.description && (
                <p className="text-sm text-text-main mb-6 leading-relaxed bg-accent-light rounded-xl p-4">
                  {selectedPlant.description}
                </p>
              )}

              <div className="text-sm text-text-muted mb-6">
                תקופת פעילות: {selectedPlant.activityMonthsRaw}
              </div>

              {/* Layer breakdown */}
              <h3 className="font-bold text-text-main mb-3">פירוט לפי שכבה</h3>
              <div className="space-y-3">
                <LayerRow label="הנהלה" participants={selectedPlant.mgmtParticipants} sessions={selectedPlant.mgmtSessions} color="bg-dark-card" />
                <LayerRow label="מנהלים ביניים" participants={selectedPlant.midMgmtParticipants} sessions={selectedPlant.midMgmtSessions} color="bg-accent" />
                <LayerRow label="עובדים" participants={selectedPlant.workerParticipants} sessions={selectedPlant.workerSessions} color="bg-accent-mid" />
              </div>

              <div className="mt-6 pt-6 border-t border-accent-pale grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-black text-text-main">{selectedPlant.totalParticipants}</div>
                  <div className="text-sm text-text-muted">סה״כ משתתפים</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-text-main">{selectedPlant.totalSessions}</div>
                  <div className="text-sm text-text-muted">סה״כ סדנאות</div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-muted">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-card border border-accent-pale rounded-pill px-3 py-1.5 text-text-main focus:outline-none focus:border-accent"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function LayerRow({ label, participants, sessions, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-8 rounded-full ${color}`} />
      <div className="flex-1">
        <div className="text-sm font-semibold text-text-main">{label}</div>
        <div className="text-xs text-text-muted">{sessions} סדנאות · {participants} משתתפים</div>
      </div>
    </div>
  )
}

function MiniBar({ plant }) {
  const total = plant.totalParticipants || 1
  const mgmtPct = Math.round((plant.mgmtParticipants / total) * 100)
  const midPct = Math.round((plant.midMgmtParticipants / total) * 100)
  const workerPct = 100 - mgmtPct - midPct

  return (
    <div className="flex h-1.5 rounded-full overflow-hidden mt-3 gap-px">
      {mgmtPct > 0 && <div className="bg-dark-card" style={{ width: `${mgmtPct}%` }} />}
      {midPct > 0 && <div className="bg-accent" style={{ width: `${midPct}%` }} />}
      {workerPct > 0 && <div className="bg-accent-mid" style={{ width: `${workerPct}%` }} />}
    </div>
  )
}
