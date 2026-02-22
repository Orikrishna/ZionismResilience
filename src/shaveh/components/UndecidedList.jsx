import { motion } from 'framer-motion'
import { CompanyLogo } from '../App'

const HEAT_LEVELS = [
  {
    label: 'חם - פגישה + הסכם',
    filter: (c) => c.status === 'טרם הוחלט' && c.agreementSent,
    color: 'bg-red-100 border-red-300',
    badge: 'bg-red-200 text-red-700',
    icon: '🔥',
  },
  {
    label: 'חמים - עברו פגישה',
    filter: (c) => c.status === 'טרם הוחלט' && c.meetingHeld && !c.agreementSent,
    color: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-600',
    icon: '🌡️',
  },
  {
    label: 'קר - מייל בלבד',
    filter: (c) => c.status === 'טרם הוחלט' && c.emailSent && !c.meetingHeld,
    color: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-600',
    icon: '❄️',
  },
  {
    label: 'טרם פנינו',
    filter: (c) => c.status === 'טרם הוחלט' && !c.emailSent,
    color: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-500',
    icon: '📋',
  },
]

export default function UndecidedList({ companies, onCompanyClick }) {
  const groups = HEAT_LEVELS.map(level => ({
    ...level,
    companies: companies.filter(level.filter).sort((a, b) => a.name.localeCompare(b.name, 'he')),
  })).filter(g => g.companies.length > 0)

  const totalUndecided = companies.filter(c => c.status === 'טרם הוחלט').length

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-4 sm:p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">הם עוד לא אמרו לא</h2>
      <p className="text-sm text-sh-text-muted mb-6">
        {totalUndecided} חברות בסטטוס "טרם הוחלט" לפי רמת חום
      </p>

      <div className="space-y-5">
        {groups.map((group, gi) => (
          <motion.div
            key={group.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: gi * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span>{group.icon}</span>
              <h3 className="text-sm font-bold text-sh-text">{group.label}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-pill ${group.badge}`}>
                {group.companies.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.companies.map(c => (
                <span
                  key={c.id}
                  onClick={() => onCompanyClick?.(c)}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 h-8 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${group.color}`}
                  title={c.requirements || c.notes || ''}
                >
                  <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                    <CompanyLogo companyId={c.id} size={16} className="rounded-sm" />
                  </span>
                  {c.name}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
