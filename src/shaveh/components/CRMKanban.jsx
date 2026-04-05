import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTabTheme } from '../ThemeContext'
import { CompanyLogo } from '../App'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PIPELINE_STEPS = [
  { key: 'emailSent', label: 'מייל נשלח' },
  { key: 'meetingHeld', label: 'פגישה' },
  { key: 'agreementSent', label: 'הסכם נשלח' },
  { key: 'agreementSigned', label: 'הסכם חתום' },
  { key: 'paid', label: 'שולם' },
]

const COLUMNS = [
  { status: 'כן', label: 'כן', color: 'bg-sh-green', lightColor: 'bg-sh-green-light', textColor: 'text-sh-green', border: 'border-sh-green/30' },
  { status: 'טרם הוחלט', label: 'טרם הוחלט', color: 'bg-sh-yellow', lightColor: 'bg-sh-yellow-light', textColor: 'text-sh-yellow', border: 'border-sh-yellow/30' },
  { status: 'לא', label: 'לא', color: 'bg-sh-pink', lightColor: 'bg-sh-pink-light', textColor: 'text-sh-pink', border: 'border-sh-pink/30' },
]

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

function CompanyCard({ company, onClick, isDragging }) {
  const completed = PIPELINE_STEPS.filter(s => company[s.key]).length
  const notesPreview = stripHtml(company.notes)

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-3 border border-gray-100 cursor-pointer transition-shadow ${isDragging ? 'shadow-lg opacity-90' : 'hover:shadow-card-hover'}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <CompanyLogo companyId={company.id} size={28} />
        <span className="font-bold text-sm text-sh-text truncate">{company.name}</span>
      </div>
      <div className="flex gap-1 flex-wrap mb-2 min-h-[20px]">
        {company.industry && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sh-bg text-sh-text-light">{company.industry}</span>
        )}
        {company.companySize && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sh-bg text-sh-text-light">{company.companySize}</span>
        )}
      </div>
      <div className="flex gap-0.5 mb-1">
        {PIPELINE_STEPS.map(step => (
          <div
            key={step.key}
            className={`h-1.5 flex-1 rounded-full ${company[step.key] ? 'bg-sh-green' : 'bg-gray-200'}`}
            title={step.label}
          />
        ))}
      </div>
      <div className="text-[10px] text-sh-text-light mb-1">{completed} מתוך 5</div>
      {notesPreview && (
        <p className="text-[11px] text-sh-text-muted leading-tight line-clamp-2 mt-1">
          {notesPreview.slice(0, 60)}{notesPreview.length > 60 ? '...' : ''}
        </p>
      )}
    </div>
  )
}

function SortableCard({ company, onCompanyClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id, data: { company } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CompanyCard
        company={company}
        onClick={() => onCompanyClick(company)}
        isDragging={isDragging}
      />
    </div>
  )
}

export default function CRMKanban({ companies, onCompanyClick, onStatusChange }) {
  const theme = useTabTheme()
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeCompany = activeId ? companies.find(c => c.id === activeId) : null

  function findColumn(id) {
    // Is it a column id?
    const col = COLUMNS.find(c => c.status === id)
    if (col) return col.status
    // Is it a company id?
    const company = companies.find(c => c.id === id)
    return company?.status || null
  }

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  function handleDragOver(event) {
    // No-op - we handle everything in dragEnd
  }

  function handleDragEnd(event) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const activeCompanyObj = companies.find(c => c.id === active.id)
    if (!activeCompanyObj) return

    // Determine target column
    let targetStatus = null

    // Check if dropped on a column directly
    const col = COLUMNS.find(c => c.status === over.id)
    if (col) {
      targetStatus = col.status
    } else {
      // Dropped on another card - get that card's column
      const overCompany = companies.find(c => c.id === over.id)
      if (overCompany) {
        targetStatus = overCompany.status
      }
    }

    if (targetStatus && targetStatus !== activeCompanyObj.status && onStatusChange) {
      onStatusChange(activeCompanyObj.id, targetStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const items = companies.filter(c => c.status === col.status)
          const ids = items.map(c => c.id)

          return (
            <SortableContext
              key={col.status}
              id={col.status}
              items={ids}
              strategy={verticalListSortingStrategy}
            >
              <div className={`rounded-card-sh border-2 ${col.border} bg-sh-card/50 min-h-[300px]`}>
                {/* Column header */}
                <div className={`${col.lightColor} rounded-t-[18px] px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.color}`} />
                    <span className="font-bold text-sh-text">{col.label}</span>
                  </div>
                  <span className={`text-sm font-medium ${col.textColor} ${col.lightColor} px-2 py-0.5 rounded-pill`}>
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-2 min-h-[100px]" data-column={col.status}>
                  {items.map(c => (
                    <SortableCard
                      key={c.id}
                      company={c}
                      onCompanyClick={onCompanyClick}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-center text-sm text-sh-text-light py-8">
                      אין חברות
                    </div>
                  )}
                </div>
              </div>
            </SortableContext>
          )
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeCompany ? (
          <div className="w-72">
            <CompanyCard company={activeCompany} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
