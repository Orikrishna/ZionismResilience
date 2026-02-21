import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import RichTextEditor from './RichTextEditor'

// ── Compute report data from companies array ──────────────────────────────────
function buildReportData(companies) {
  const total = companies.length
  const joined = companies.filter(c => c.paid).length
  const meetings = companies.filter(c => c.meetingHeld).length
  const agreementSent = companies.filter(c => c.agreementSent).length
  const agreementsSigned = companies.filter(c => c.agreementSigned).length
  const emailsSent = companies.filter(c => c.emailSent).length

  const conversionRate = emailsSent ? ((joined / emailsSent) * 100).toFixed(1) : '0.0'
  const emailToMeetingRate = emailsSent ? ((meetings / emailsSent) * 100).toFixed(1) : '0.0'

  const allSteps = companies.filter(c =>
    c.emailSent && c.meetingHeld && c.agreementSent && c.agreementSigned && c.paid
  ).length

  const yesCompanies = companies.filter(c => c.status === 'כן')
  const avgSteps = yesCompanies.length
    ? (yesCompanies.reduce((sum, c) =>
        sum + [c.emailSent, c.meetingHeld, c.agreementSent, c.agreementSigned, c.paid].filter(Boolean).length, 0
      ) / yesCompanies.length).toFixed(1)
    : '0.0'

  const undecided = companies.filter(c => c.status === 'טרם הוחלט').length
  const undecidedWithMeeting = companies.filter(c => c.status === 'טרם הוחלט' && c.meetingHeld).length

  const statusCounts = { 'כן': 0, 'לא': 0, 'טרם הוחלט': 0 }
  companies.forEach(c => { if (statusCounts[c.status] !== undefined) statusCounts[c.status]++ })

  const industryCounts = {}
  companies.forEach(c => { if (c.industry) industryCounts[c.industry] = (industryCounts[c.industry] || 0) + 1 })

  const sizeCounts = {}
  companies.forEach(c => { if (c.companySize) sizeCounts[c.companySize] = (sizeCounts[c.companySize] || 0) + 1 })

  const pipeline = { emailSent: emailsSent, meetings, agreementSent, agreementsSigned, paid: joined }

  const undecidedList = companies
    .filter(c => c.status === 'טרם הוחלט' && c.meetingHeld)
    .map(c => c.name)

  const date = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })

  return {
    total, joined, meetings, agreementsSigned, emailsSent,
    conversionRate, emailToMeetingRate, allSteps, avgSteps,
    undecided, undecidedWithMeeting,
    statusCounts, industryCounts, sizeCounts, pipeline, undecidedList, date,
  }
}

// ── Field component ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-sh-text-muted tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const INPUT_CLS = 'w-full text-sm border border-sh-yellow-light rounded-xl px-3 py-2.5 bg-white text-sh-text focus:outline-none focus:border-sh-yellow transition-colors placeholder:text-sh-text-light'

// ── SendReportModal ───────────────────────────────────────────────────────────
export default function SendReportModal({ companies, onClose }) {
  const today = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  const [to, setTo] = useState('')
  const [replyTo, setReplyTo] = useState('')
  const [subject, setSubject] = useState(`דו"ח מצב שווה פיתוח — ${today}`)
  const [bodyHtml, setBodyHtml] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const overlayRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSend = useCallback(async () => {
    if (!to.trim()) { setErrorMsg('נא להזין כתובת מייל של הנמען'); return }
    if (!subject.trim()) { setErrorMsg('נא להזין נושא'); return }
    setErrorMsg('')
    setStatus('sending')
    try {
      const reportData = buildReportData(companies)
      const res = await fetch('http://localhost:3457/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), replyTo: replyTo.trim() || undefined, subject, bodyHtml, reportData, companies }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'שגיאה בשליחה')
      setStatus('success')
    } catch (err) {
      setErrorMsg(err.message.includes('fetch') ? 'השרת המקומי לא פועל. הפעל: npm run companies-server' : err.message)
      setStatus('error')
    }
  }, [to, replyTo, subject, bodyHtml, companies])

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        ref={overlayRef}
        onClick={e => { if (e.target === overlayRef.current) onClose() }}
      >
        {/* Modal */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="bg-sh-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          dir="rtl"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-sh-yellow-light/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sh-yellow-light flex items-center justify-center">
                <Mail size={15} className="text-sh-yellow" />
              </div>
              <div>
                <div className="text-sm font-bold text-sh-text">שליחת דו"ח מצב</div>
                <div className="text-xs text-sh-text-muted">{companies.length} חברות</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-sh-text-muted hover:text-sh-text hover:bg-sh-bg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Success state */}
          {status === 'success' ? (
            <div className="px-6 py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-sh-green-light flex items-center justify-center">
                <CheckCircle size={28} className="text-sh-green" />
              </div>
              <div>
                <div className="text-base font-bold text-sh-text">המייל נשלח בהצלחה!</div>
                <div className="text-sm text-sh-text-muted mt-1">הדו"ח נשלח אל {to}</div>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl text-sm font-medium bg-sh-yellow-light text-sh-yellow hover:bg-sh-yellow hover:text-white transition-colors"
              >
                סגור
              </button>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">

              {/* To */}
              <Field label="אל (נמען)">
                <input
                  type="email"
                  className={INPUT_CLS}
                  placeholder="email@example.com"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  dir="ltr"
                />
              </Field>

              {/* Reply-To */}
              <Field label="השב אל (כתובת שולח)">
                <input
                  type="email"
                  className={INPUT_CLS}
                  placeholder="reply@zionut2000.org.il"
                  value={replyTo}
                  onChange={e => setReplyTo(e.target.value)}
                  dir="ltr"
                />
                <p className="text-[11px] text-sh-text-light mt-1">הנמען יוכל להשיב ישירות לכתובת זו</p>
              </Field>

              {/* Subject */}
              <Field label="נושא">
                <input
                  type="text"
                  className={INPUT_CLS}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  dir="rtl"
                />
              </Field>

              {/* Body */}
              <Field label="גוף המייל (אופציונלי — יופיע לפני הנתונים)">
                <RichTextEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  placeholder={'כתוב מסר אישי, הקשר, או הסבר לפני הדו"ח...'}
                />
              </Field>

              {/* What's included */}
              <div className="bg-sh-bg rounded-xl px-4 py-3">
                <div className="text-xs font-semibold text-sh-text-muted mb-2">הדו"ח כולל:</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {[
                    'מדדים עיקריים (10 KPIs)',
                    'התפלגות החלטות',
                    'משפך גיוס',
                    'פילוח לפי ענף',
                    'פילוח לפי גודל חברה',
                    'רשימת "טרם הוחלט + פגישה"',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-1.5 text-[11px] text-sh-text-muted">
                      <span className="text-sh-green">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {(status === 'error' || errorMsg) && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-sh-pink shrink-0 mt-0.5" />
                  <span className="text-xs text-sh-pink">{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm text-sh-text-muted hover:text-sh-text hover:bg-sh-bg transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSend}
                  disabled={status === 'sending'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                  style={{ backgroundColor: '#e9ab56' }}
                >
                  <Send size={14} />
                  {status === 'sending' ? 'שולח...' : 'שלח דו"ח'}
                </button>
              </div>

            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
