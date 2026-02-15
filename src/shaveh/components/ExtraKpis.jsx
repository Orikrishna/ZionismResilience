import KpiCard from './KpiCard'

export default function ExtraKpis({ companies }) {
  const emailSent = companies.filter(c => c.emailSent).length
  const meetingHeld = companies.filter(c => c.meetingHeld).length
  const emailToMeetingRate = emailSent > 0 ? ((meetingHeld / emailSent) * 100).toFixed(0) : '0'

  const allSteps = companies.filter(c =>
    c.emailSent && c.meetingHeld && c.agreementSent && c.agreementSigned && c.paid
  ).length

  const yesCompanies = companies.filter(c => c.status === 'כן')
  const avgSteps = yesCompanies.length > 0
    ? (yesCompanies.reduce((sum, c) => {
        let steps = 0
        if (c.emailSent) steps++
        if (c.meetingHeld) steps++
        if (c.agreementSent) steps++
        if (c.agreementSigned) steps++
        if (c.paid) steps++
        return sum + steps
      }, 0) / yesCompanies.length).toFixed(1)
    : '0'

  const undecided = companies.filter(c => c.status === 'טרם הוחלט').length
  const undecidedWithMeeting = companies.filter(c => c.status === 'טרם הוחלט' && c.meetingHeld).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <KpiCard label="מייל לפגישה" value={`${emailToMeetingRate}%`} />
      <KpiCard label="חברות עם כל 5 השלבים" value={allSteps} />
      <KpiCard label="ממוצע שלבים (חברה פעילה)" value={avgSteps} />
      <KpiCard label="טרם הוחלט" value={undecided} />
      <KpiCard label="טרם הוחלט + פגישה" value={undecidedWithMeeting} accent />
    </div>
  )
}
