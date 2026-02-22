import { motion } from 'framer-motion'

export default function BottleneckCard({ companies }) {
  // Calculate drop-off between each pipeline stage
  const emailSent = companies.filter(c => c.emailSent).length
  const meetingHeld = companies.filter(c => c.meetingHeld).length
  const agreementSent = companies.filter(c => c.agreementSent).length
  const agreementSigned = companies.filter(c => c.agreementSigned).length
  const paid = companies.filter(c => c.paid).length

  const stages = [
    { from: 'מייל', to: 'פגישה', fromCount: emailSent, toCount: meetingHeld },
    { from: 'פגישה', to: 'הסכם נשלח', fromCount: meetingHeld, toCount: agreementSent },
    { from: 'הסכם נשלח', to: 'הסכם חתום', fromCount: agreementSent, toCount: agreementSigned },
    { from: 'הסכם חתום', to: 'שולם', fromCount: agreementSigned, toCount: paid },
  ]

  // Find biggest absolute drop
  let worstDrop = stages[0]
  let worstDropCount = 0
  stages.forEach(s => {
    const drop = s.fromCount - s.toCount
    if (drop > worstDropCount) {
      worstDropCount = drop
      worstDrop = s
    }
  })

  const conversionRate = worstDrop.fromCount > 0
    ? Math.round((worstDrop.toCount / worstDrop.fromCount) * 100)
    : 0

  const stuckCount = worstDrop.fromCount - worstDrop.toCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-sh-card rounded-card-sh shadow-card p-4 sm:p-6 border-2 border-sh-pink"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔍</span>
        <h2 className="text-lg font-bold text-sh-text">נקודת החנק</h2>
      </div>
      <p className="text-sm text-sh-text-muted mb-4">
        הנפילה הכי גדולה בתהליך הגיוס
      </p>
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-4xl font-black text-sh-pink">{stuckCount}</span>
        <span className="text-lg text-sh-text-muted">חברות נתקעו</span>
      </div>
      <p className="text-sm text-sh-text font-medium mb-3">
        בין <span className="font-bold">{worstDrop.from}</span> ל<span className="font-bold">{worstDrop.to}</span>
      </p>
      <div className="bg-sh-pink-light rounded-xl p-3">
        <div className="flex justify-between text-sm">
          <span className="text-sh-text-muted">אחוז המרה בשלב:</span>
          <span className="font-bold text-sh-pink">{conversionRate}%</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-sh-text-muted">נכנסו לשלב:</span>
          <span className="font-bold text-sh-text">{worstDrop.fromCount}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-sh-text-muted">עברו הלאה:</span>
          <span className="font-bold text-sh-text">{worstDrop.toCount}</span>
        </div>
      </div>
    </motion.div>
  )
}
