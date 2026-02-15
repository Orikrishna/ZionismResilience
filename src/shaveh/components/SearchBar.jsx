export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש חברה לפי שם, הערות או מה נדרש..."
        className="w-full bg-sh-card border border-sh-pink-light rounded-xl px-4 py-3 pr-10 text-sm text-sh-text placeholder:text-sh-text-light focus:outline-none focus:border-sh-pink focus:ring-1 focus:ring-sh-pink/30 transition-colors"
        dir="rtl"
      />
      <svg
        className="absolute top-1/2 right-3 -translate-y-1/2 w-4 h-4 text-sh-text-light pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  )
}
