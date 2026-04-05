import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { CompanyLogo } from '../App'

const STATUS_STYLES = {
  'כן': 'bg-sh-green-light text-sh-green',
  'לא': 'bg-sh-pink-light text-sh-pink',
  'טרם הוחלט': 'bg-sh-yellow-light text-sh-yellow',
}

const PIPELINE_STEPS = [
  { key: 'emailSent', label: 'מייל' },
  { key: 'meetingHeld', label: 'פגישה' },
  { key: 'agreementSent', label: 'הסכם נשלח' },
  { key: 'agreementSigned', label: 'הסכם חתום' },
  { key: 'paid', label: 'שולם' },
]

const COLUMNS = [
  { key: 'name', label: 'שם', sortable: true },
  { key: 'status', label: 'סטטוס', sortable: true },
  { key: 'industry', label: 'ענף', sortable: true },
  { key: 'companySize', label: 'גודל', sortable: true },
  { key: 'progress', label: 'התקדמות', sortable: true },
  { key: 'emailSent', label: 'מייל', sortable: false },
  { key: 'meetingHeld', label: 'פגישה', sortable: false },
  { key: 'agreementSigned', label: 'הסכם', sortable: false },
  { key: 'paid', label: 'שולם', sortable: false },
]

function stepsCompleted(c) {
  return PIPELINE_STEPS.filter(s => c[s.key]).length
}

export default function CRMTable({ companies, onCompanyClick }) {
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')

  const sorted = [...companies].sort((a, b) => {
    let va, vb
    if (sortKey === 'progress') {
      va = stepsCompleted(a)
      vb = stepsCompleted(b)
    } else {
      va = a[sortKey] || ''
      vb = b[sortKey] || ''
    }
    if (typeof va === 'string') {
      const cmp = va.localeCompare(vb, 'he')
      return sortDir === 'asc' ? cmp : -cmp
    }
    return sortDir === 'asc' ? va - vb : vb - va
  })

  function toggleSort(key) {
    if (!COLUMNS.find(c => c.key === key)?.sortable) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return null
    return sortDir === 'asc'
      ? <ChevronUp className="inline w-3 h-3" />
      : <ChevronDown className="inline w-3 h-3" />
  }

  const SIZE_MAP = {
    'קטנה': { letter: 'S', color: 'bg-sh-blue-light text-sh-blue' },
    'בינונית': { letter: 'M', color: 'bg-sh-yellow-light text-sh-yellow' },
    'גדולה': { letter: 'L', color: 'bg-sh-green-light text-sh-green' },
    'גלובלית': { letter: 'G', color: 'bg-sh-pink-light text-sh-pink' },
  }

  const SizeCircle = ({ size }) => {
    const info = SIZE_MAP[size]
    if (!info) return <span className="text-sh-text-light">-</span>
    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${info.color}`} title={size}>
        {info.letter}
      </span>
    )
  }

  const Check = ({ val }) => (
    <span className={`text-sm ${val ? 'text-sh-green' : 'text-gray-300'}`}>
      {val ? '●' : '○'}
    </span>
  )

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" dir="rtl">
          <thead>
            <tr className="bg-sh-bg border-b border-gray-200">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className={`px-3 py-3 text-right font-medium text-sh-text-muted whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-sh-text select-none' : ''}`}
                >
                  {col.label} <SortIcon colKey={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr
                key={c.id}
                onClick={() => onCompanyClick(c)}
                className="border-b border-gray-100 hover:bg-sh-bg/50 cursor-pointer transition-colors"
              >
                {/* Name */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <CompanyLogo companyId={c.id} size={24} />
                    <span className="font-medium text-sh-text">{c.name}</span>
                  </div>
                </td>
                {/* Status */}
                <td className="px-3 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${STATUS_STYLES[c.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                    {c.status || '-'}
                  </span>
                </td>
                {/* Industry */}
                <td className="px-3 py-2.5 text-sh-text-muted">{c.industry || '-'}</td>
                {/* Size */}
                <td className="px-3 py-2.5 text-center"><SizeCircle size={c.companySize} /></td>
                {/* Progress */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 w-16">
                      {PIPELINE_STEPS.map(step => (
                        <div
                          key={step.key}
                          className={`h-1.5 flex-1 rounded-full ${c[step.key] ? 'bg-sh-green' : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-sh-text-light">{stepsCompleted(c)}/5</span>
                  </div>
                </td>
                {/* Pipeline booleans */}
                <td className="px-3 py-2.5 text-center"><Check val={c.emailSent} /></td>
                <td className="px-3 py-2.5 text-center"><Check val={c.meetingHeld} /></td>
                <td className="px-3 py-2.5 text-center"><Check val={c.agreementSigned} /></td>
                <td className="px-3 py-2.5 text-center"><Check val={c.paid} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="text-center text-sm text-sh-text-light py-8">אין חברות</div>
      )}
    </div>
  )
}
