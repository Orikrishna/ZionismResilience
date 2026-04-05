import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Phone, Mail, User, MessageSquare, Calendar, FileText, Send, Building2, Pencil, Save, X, ExternalLink } from 'lucide-react'
import { useTabTheme } from '../ThemeContext'
import { CompanyLogo } from '../App'
import RichTextEditor from './RichTextEditor'

const BASE = import.meta.env.BASE_URL

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

const INTERACTION_ICONS = {
  'מייל': Mail,
  'פגישה': Calendar,
  'שיחה': Phone,
  'הערה': MessageSquare,
  'מסמך': FileText,
}

const SAVE_SERVER = 'http://localhost:3457'

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function CRMCard({ company, onBack, onCompanyUpdate }) {
  const theme = useTabTheme()
  const [newNote, setNewNote] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)

  if (!company) return null

  const contacts = company.contacts || []
  const interactions = company.interactions || []

  const startEditing = () => {
    setEditDraft({
      notes: stripHtml(company.notes || ''),
      requirements: stripHtml(company.requirements || ''),
      nextAction: stripHtml(company.nextAction || ''),
      status: company.status || '',
      industry: company.industry || '',
      companySize: company.companySize || '',
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditDraft(null)
  }

  const saveEdits = useCallback(async () => {
    if (!editDraft || !onCompanyUpdate) return
    setSaveStatus('saving')
    const merged = { ...company, ...editDraft }
    onCompanyUpdate(merged)
    setIsEditing(false)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2000)
  }, [editDraft, company, onCompanyUpdate])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Back button + header */}
      <div className="bg-sh-card rounded-card-sh shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-sh-text-muted hover:text-sh-text transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לרשימה
          </button>
          {!isEditing ? (
            <button
              onClick={startEditing}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors hover:bg-sh-bg"
              style={{ borderColor: theme.lightAlpha60, color: theme.accent }}
            >
              <Pencil className="w-3 h-3" />
              עריכה
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-sh-text-muted hover:bg-gray-50"
              >
                <X className="w-3 h-3" />
                ביטול
              </button>
              <button
                onClick={saveEdits}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white"
                style={{ background: theme.accent }}
              >
                <Save className="w-3 h-3" />
                שמור
              </button>
              {saveStatus === 'saved' && <span className="text-[10px] text-sh-green">נשמר</span>}
            </div>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-xl" style={{ background: theme.lightAlpha40 }}>
            <CompanyLogo companyId={company.id} size={48} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-sh-text">{company.name}</h1>
              {isEditing ? (
                <select
                  value={editDraft.status}
                  onChange={e => setEditDraft(d => ({ ...d, status: e.target.value }))}
                  className="text-xs px-2 py-1 rounded-pill border font-medium"
                  style={{ borderColor: theme.accent }}
                >
                  <option value="כן">כן</option>
                  <option value="לא">לא</option>
                  <option value="טרם הוחלט">טרם הוחלט</option>
                </select>
              ) : (
                <span className={`text-xs px-2.5 py-1 rounded-pill font-medium ${STATUS_STYLES[company.status] || 'bg-gray-100 text-sh-text-muted'}`}>
                  {company.status}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {isEditing ? (
                <>
                  <input
                    value={editDraft.industry}
                    onChange={e => setEditDraft(d => ({ ...d, industry: e.target.value }))}
                    placeholder="ענף"
                    className="text-xs px-2 py-0.5 rounded border w-24"
                    style={{ borderColor: theme.lightAlpha60 }}
                  />
                  <select
                    value={editDraft.companySize}
                    onChange={e => setEditDraft(d => ({ ...d, companySize: e.target.value }))}
                    className="text-xs px-2 py-0.5 rounded border"
                    style={{ borderColor: theme.lightAlpha60 }}
                  >
                    <option value="">גודל</option>
                    <option value="קטנה">קטנה</option>
                    <option value="בינונית">בינונית</option>
                    <option value="גדולה">גדולה</option>
                    <option value="גלובלית">גלובלית</option>
                  </select>
                </>
              ) : (
                <>
                  {company.industry && (
                    <span className="text-xs px-2 py-0.5 rounded bg-sh-bg text-sh-text-muted">{company.industry}</span>
                  )}
                  {company.companySize && (
                    <span className="text-xs px-2 py-0.5 rounded bg-sh-bg text-sh-text-muted">{company.companySize}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline progress */}
        <div className="mt-5 flex gap-2">
          {PIPELINE_STEPS.map((step) => {
            const done = company[step.key]
            return (
              <div key={step.key} className="flex-1 text-center">
                <div className={`h-2 rounded-full mb-1 ${done ? 'bg-sh-green' : 'bg-gray-200'}`} />
                <span className={`text-[10px] ${done ? 'text-sh-green font-medium' : 'text-sh-text-light'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contacts */}
        <div className="bg-sh-card rounded-card-sh shadow-card p-5">
          <h2 className="text-lg font-bold text-sh-text mb-4 flex items-center gap-2">
            <User className="w-5 h-5" style={{ color: theme.accent }} />
            אנשי קשר
          </h2>
          {contacts.length === 0 ? (
            <div className="text-sm text-sh-text-light py-4 text-center">לא הוזנו אנשי קשר</div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, i) => (
                <div key={i} className="border rounded-xl p-3" style={{ borderColor: theme.lightAlpha50 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sh-text">{contact.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sh-bg text-sh-text-muted">{contact.role}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs text-sh-text-muted">
                    {contact.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{contact.phone}</span>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        <span dir="ltr">{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Org details */}
        <div className="bg-sh-card rounded-card-sh shadow-card p-5">
          <h2 className="text-lg font-bold text-sh-text mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: theme.accent }} />
            פרטי הארגון
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-sh-text-muted text-xs mb-1">הערות</div>
              {isEditing ? (
                <textarea
                  value={editDraft.notes}
                  onChange={e => setEditDraft(d => ({ ...d, notes: e.target.value }))}
                  rows={3}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-sh-text focus:outline-none focus:ring-1"
                  style={{ borderColor: theme.lightAlpha60, '--tw-ring-color': theme.accent }}
                />
              ) : (
                <div className="text-sh-text leading-relaxed">{stripHtml(company.notes) || '-'}</div>
              )}
            </div>
            <div>
              <div className="text-sh-text-muted text-xs mb-1">דרישות</div>
              {isEditing ? (
                <textarea
                  value={editDraft.requirements}
                  onChange={e => setEditDraft(d => ({ ...d, requirements: e.target.value }))}
                  rows={3}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-sh-text focus:outline-none focus:ring-1"
                  style={{ borderColor: theme.lightAlpha60, '--tw-ring-color': theme.accent }}
                />
              ) : (
                <div className="text-sh-text leading-relaxed">{stripHtml(company.requirements) || '-'}</div>
              )}
            </div>
            <div>
              <div className="text-sh-text-muted text-xs mb-1">פעולה הבאה</div>
              {isEditing ? (
                <textarea
                  value={editDraft.nextAction}
                  onChange={e => setEditDraft(d => ({ ...d, nextAction: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-lg px-2 py-1.5 text-sm text-sh-text focus:outline-none focus:ring-1"
                  style={{ borderColor: theme.lightAlpha60, '--tw-ring-color': theme.accent }}
                />
              ) : (
                <div className="text-sh-text leading-relaxed">{stripHtml(company.nextAction) || '-'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interaction log */}
      <div className="bg-sh-card rounded-card-sh shadow-card p-5">
        <h2 className="text-lg font-bold text-sh-text mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" style={{ color: theme.accent }} />
          יומן אינטראקציות
        </h2>

        {/* Add note - rich text */}
        <div className="mb-5">
          <RichTextEditor
            value={newNote}
            onChange={setNewNote}
            placeholder="הוסף הערה או תיעוד אינטראקציה..."
          />
          <div className="flex justify-start mt-2">
            <button
              className="px-4 py-1.5 rounded-xl text-white text-sm font-medium flex items-center gap-1.5"
              style={{ background: theme.accent }}
            >
              <Send className="w-3.5 h-3.5" />
              שמור
            </button>
          </div>
        </div>

        {/* Timeline */}
        {interactions.length === 0 ? (
          <div className="text-sm text-sh-text-light py-4 text-center">אין אינטראקציות מתועדות</div>
        ) : (
          <div className="relative pr-6">
            {/* Timeline line */}
            <div className="absolute right-2 top-2 bottom-2 w-px bg-gray-200" />

            <div className="space-y-4">
              {interactions.map((item, i) => {
                const Icon = INTERACTION_ICONS[item.type] || MessageSquare
                const isMeeting = item.type === 'פגישה'
                const titleParts = [item.type]
                if (isMeeting && item.time) titleParts.push(`${item.date}, ${item.time}`)

                return (
                  <div key={i} className="relative flex gap-3">
                    {/* Dot */}
                    <div
                      className="absolute right-[-16px] top-1 w-5 h-5 rounded-full flex items-center justify-center bg-white border-2"
                      style={{ borderColor: theme.accent }}
                    >
                      <Icon className="w-2.5 h-2.5" style={{ color: theme.accent }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-sh-bg rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-sh-text">
                          {isMeeting && item.time ? `${item.type} - ${item.date}, ${item.time}` : item.type}
                        </span>
                        <span className="text-[10px] text-sh-text-light">{item.date}</span>
                      </div>
                      <div
                        className="text-sm text-sh-text-muted leading-relaxed prose-sm [&_strong]:font-bold [&_em]:italic [&_ul]:pr-4 [&_ol]:pr-4 [&_li]:mb-1"
                        dangerouslySetInnerHTML={{ __html: item.text }}
                      />

                      {/* Document link */}
                      {item.docUrl && (
                        <a
                          href={`${BASE}${item.docUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                          style={{ background: theme.lightAlpha60, color: theme.accent }}
                        >
                          <FileText className="w-3 h-3" />
                          {item.docName || 'מסמך מצורף'}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}

                      {item.by && (
                        <span className="text-[10px] text-sh-text-light mt-1 block">{item.by}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
