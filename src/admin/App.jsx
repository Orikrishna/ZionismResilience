import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import companies from '../shaveh/data/companies.json'
import logoCandidatesData from './data/logo_candidates.json'

const BASE = import.meta.env.BASE_URL
// API runs on same Vite dev server (no separate save server needed)
const API = '/api/logo'

const STORAGE_KEY = 'admin-logo-selections'

function loadSelections() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function saveSelectionsLocal(sel) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sel))
}

export default function App() {
  const allCompanies = companies.companies
  const [selections, setSelections] = useState(loadSelections)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all') // all | saved | unsaved | selected
  const [savedLogos, setSavedLogos] = useState({}) // id -> true
  const [serverOnline, setServerOnline] = useState(false)
  const [savingIds, setSavingIds] = useState({}) // id -> true while saving
  const [saveAllRunning, setSaveAllRunning] = useState(false)
  const [manualUploads, setManualUploads] = useState({}) // id -> [{ url, name, dataUrl }]

  // Check server + load saved logos on mount
  useEffect(() => {
    fetch(`${API}/health`)
      .then(r => r.json())
      .then(() => {
        setServerOnline(true)
        return fetch(`${API}/saved-logos`).then(r => r.json())
      })
      .then(data => {
        const map = {}
        data.saved.forEach(id => { map[id] = true })
        setSavedLogos(map)
      })
      .catch(() => setServerOnline(false))
  }, [])

  const savedCount = Object.keys(savedLogos).length
  const selectedCount = Object.keys(selections).length

  const filtered = useMemo(() => {
    let result = allCompanies
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      )
    }
    if (filter === 'saved') {
      result = result.filter(c => savedLogos[c.id])
    } else if (filter === 'unsaved') {
      result = result.filter(c => !savedLogos[c.id])
    } else if (filter === 'selected') {
      result = result.filter(c => selections[c.id] && !savedLogos[c.id])
    }
    return result
  }, [allCompanies, searchQuery, filter, selections, savedLogos])

  const handleSelect = useCallback((companyId, candidate) => {
    setSelections(prev => {
      const next = { ...prev, [companyId]: candidate }
      saveSelectionsLocal(next)
      return next
    })
  }, [])

  const handleDeselect = useCallback((companyId) => {
    setSelections(prev => {
      const next = { ...prev }
      delete next[companyId]
      saveSelectionsLocal(next)
      return next
    })
  }, [])

  const handleManualUpload = useCallback((companyId, file, directUrl) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        const objectUrl = URL.createObjectURL(file)
        setManualUploads(prev => ({
          ...prev,
          [companyId]: [...(prev[companyId] || []), { url: objectUrl, name: file.name, dataUrl }],
        }))
      }
      reader.readAsDataURL(file)
    } else if (directUrl) {
      setManualUploads(prev => ({
        ...prev,
        [companyId]: [...(prev[companyId] || []), { url: directUrl, name: 'url_logo.png', dataUrl: null, directUrl }],
      }))
    }
  }, [])

  // Save a single company's selected logo
  const handleSave = useCallback(async (companyId) => {
    const sel = selections[companyId]
    if (!sel) return

    setSavingIds(prev => ({ ...prev, [companyId]: true }))
    try {
      let imageData
      if (sel.source === 'manual' && sel.dataUrl) {
        imageData = sel.dataUrl
      } else if (sel.source === 'manual' && sel.directUrl) {
        // Let the server fetch the URL (avoids CORS issues)
        imageData = { remoteUrl: sel.directUrl }
      } else {
        imageData = { candidateFile: sel.filename }
      }

      const resp = await fetch(`${API}/save-logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, imageData }),
      })
      const data = await resp.json()
      if (data.ok) {
        setSavedLogos(prev => ({ ...prev, [companyId]: true }))
      } else {
        alert(`Failed to save ${companyId}: ${data.error}`)
      }
    } catch (err) {
      alert(`Save error: ${err.message}`)
    }
    setSavingIds(prev => { const n = { ...prev }; delete n[companyId]; return n })
  }, [selections])

  // Save ALL selected (unsaved) logos
  const handleSaveAll = useCallback(async () => {
    const unsaved = Object.entries(selections).filter(([id]) => !savedLogos[id])
    if (unsaved.length === 0) {
      alert('Nothing to save. All selected logos are already saved.')
      return
    }
    setSaveAllRunning(true)
    let saved = 0
    let failed = 0
    for (const [companyId] of unsaved) {
      try {
        await handleSave(companyId)
        saved++
      } catch {
        failed++
      }
    }
    setSaveAllRunning(false)
    try {
      const resp = await fetch(`${API}/saved-logos`)
      const data = await resp.json()
      const map = {}
      data.saved.forEach(id => { map[id] = true })
      setSavedLogos(map)
    } catch {}
    alert(`Done: ${saved} saved${failed ? `, ${failed} failed` : ''}.`)
  }, [selections, savedLogos, handleSave])

  const unsavedSelectedCount = Object.keys(selections).filter(id => !savedLogos[id]).length

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Logo Picker</h1>
            <p className="text-sm text-gray-500">Select and save logos for Shaveh dashboard companies</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              serverOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              {serverOnline ? 'Server online' : 'Server offline'}
            </div>
            <div className="bg-white rounded-lg shadow px-4 py-2 text-center">
              <div className="text-2xl font-bold text-green-600">{savedCount}</div>
              <div className="text-xs text-gray-500">/ {allCompanies.length} saved</div>
            </div>
          </div>
        </div>

        {/* Server offline warning */}
        {!serverOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
            <strong>Save API not available.</strong> Make sure Vite dev server is running:
            <code className="ml-2 bg-amber-100 px-2 py-0.5 rounded font-mono text-xs">npm run dev</code>
          </div>
        )}

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(savedCount / allCompanies.length) * 100}%` }}
          />
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name or ID..."
            className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
          />
          <div className="flex gap-1">
            {[
              { key: 'all', label: `All (${allCompanies.length})` },
              { key: 'saved', label: `Saved (${savedCount})` },
              { key: 'unsaved', label: `Unsaved (${allCompanies.length - savedCount})` },
              { key: 'selected', label: `Ready (${unsavedSelectedCount})` },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === opt.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(company => (
            <CompanyLogoCard
              key={company.id}
              company={company}
              candidates={logoCandidatesData[company.id]}
              selection={selections[company.id]}
              isSaved={!!savedLogos[company.id]}
              isSaving={!!savingIds[company.id]}
              manualUploads={manualUploads[company.id] || []}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
              onManualUpload={handleManualUpload}
              onSave={handleSave}
              serverOnline={serverOnline}
            />
          ))}
        </div>

        {/* Sticky bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-green-600">{savedCount}</span> saved
              {unsavedSelectedCount > 0 && (
                <span className="ml-3">
                  <span className="font-semibold text-blue-600">{unsavedSelectedCount}</span> ready to save
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {unsavedSelectedCount > 0 && serverOnline && (
                <button
                  onClick={handleSaveAll}
                  disabled={saveAllRunning}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveAllRunning ? 'Saving...' : `Save All (${unsavedSelectedCount})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


function CompanyLogoCard({ company, candidates, selection, isSaved, isSaving, manualUploads, onSelect, onDeselect, onManualUpload, onSave, serverOnline }) {
  const fileRef = useRef(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)

  const candidateList = candidates?.candidates || []
  const googleUrl = candidates?.googleSearchUrl ||
    `https://www.google.com/search?q=${encodeURIComponent(company.name + ' logo לוגו')}&tbm=isch`

  const isSelected = !!selection

  // Build all displayable candidates
  const allCandidates = [
    ...candidateList.map(c => ({
      src: `${BASE}logos/candidates/${company.id}/${c.filename}`,
      filename: c.filename,
      source: c.source,
      key: `${c.source}_${c.filename}`,
    })),
    ...manualUploads.map((u, i) => ({
      src: u.url,
      filename: `manual_${i}.png`,
      source: 'manual',
      dataUrl: u.dataUrl,
      directUrl: u.directUrl,
      key: `manual_${i}`,
    })),
  ]

  const savedLogoSrc = isSaved ? `${BASE}logos/${company.id}.png?t=${Date.now()}` : null

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onManualUpload(company.id, file)
      e.target.value = ''
    }
  }

  const handleUrlAdd = async () => {
    if (!urlValue.trim()) return
    setUrlLoading(true)
    try {
      const resp = await fetch(urlValue.trim())
      if (!resp.ok) throw new Error('Failed to fetch')
      const blob = await resp.blob()
      const file = new File([blob], `url_logo.png`, { type: blob.type })
      onManualUpload(company.id, file)
      setUrlValue('')
      setShowUrlInput(false)
    } catch {
      onManualUpload(company.id, null, urlValue.trim())
      setUrlValue('')
      setShowUrlInput(false)
    }
    setUrlLoading(false)
  }

  let borderClass = 'border-gray-100 hover:border-gray-200'
  if (isSaved && !isSelected) {
    borderClass = 'border-green-400 shadow-md bg-green-50/30'
  } else if (isSaved && isSelected) {
    borderClass = 'border-green-400 shadow-md bg-green-50/30'
  } else if (isSelected) {
    borderClass = 'border-blue-400 shadow-sm'
  }

  return (
    <div className={`bg-white rounded-xl border-2 p-4 transition-all ${borderClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800 text-sm truncate">{company.name}</div>
          <div className="text-xs text-gray-400 font-mono">{company.id}</div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {isSaved && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Saved
            </span>
          )}
          {isSelected && !isSaved && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Selected
            </span>
          )}
        </div>
      </div>

      {/* Saved logo preview */}
      {isSaved && savedLogoSrc && (
        <div className="mb-3 flex items-center gap-2 bg-green-50 rounded-lg p-2">
          <img
            src={savedLogoSrc}
            alt=""
            className="w-10 h-10 object-contain rounded"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <span className="text-xs text-green-600">Current saved logo</span>
        </div>
      )}

      {/* Candidate thumbnails */}
      <div className="flex gap-2 flex-wrap mb-3">
        {allCandidates.map((cand) => {
          const isSel = selection?.filename === cand.filename && selection?.source === cand.source
          return (
            <button
              key={cand.key}
              onClick={() => {
                if (isSel) {
                  onDeselect(company.id)
                } else {
                  const selData = { filename: cand.filename, source: cand.source }
                  if (cand.dataUrl) selData.dataUrl = cand.dataUrl
                  if (cand.directUrl) selData.directUrl = cand.directUrl
                  onSelect(company.id, selData)
                }
              }}
              className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex items-center justify-center bg-white transition-all ${
                isSel
                  ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              title={`${cand.source} — click to ${isSel ? 'deselect' : 'select'}`}
            >
              <img
                src={cand.src}
                alt=""
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.innerHTML = '<span class="text-[10px] text-gray-300">err</span>'
                }}
              />
            </button>
          )
        })}

        {/* Upload file button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          title="Upload logo file"
        >
          <span className="text-xl text-gray-400">+</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* URL input toggle + Google search */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`text-xs px-2 py-1 rounded border transition-colors ${
            showUrlInput ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'
          }`}
        >
          Paste URL
        </button>
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
        >
          Search Google Images
        </a>
      </div>

      {/* URL input */}
      {showUrlInput && (
        <div className="flex gap-1 mb-3">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="Paste image URL..."
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
            onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
          />
          <button
            onClick={handleUrlAdd}
            disabled={urlLoading || !urlValue.trim()}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {urlLoading ? '...' : 'Add'}
          </button>
        </div>
      )}

      {/* No candidates */}
      {allCandidates.length === 0 && (
        <p className="text-xs text-gray-400 mb-2">No candidates yet. Upload, paste URL, or search Google.</p>
      )}

      {/* Save button */}
      {isSelected && serverOnline && (
        <button
          onClick={() => onSave(company.id)}
          disabled={isSaving}
          className={`w-full mt-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
            isSaved
              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving ? 'Saving...' : isSaved ? 'Re-save (update)' : 'Save'}
        </button>
      )}
    </div>
  )
}
