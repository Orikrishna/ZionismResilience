import ReactApexChart from 'react-apexcharts'

const MONTH_LABELS = {
  '01': 'ינו', '02': 'פבר', '03': 'מרץ', '04': 'אפר',
  '05': 'מאי', '06': 'יוני', '07': 'יולי', '08': 'אוג',
  '09': 'ספט', '10': 'אוק', '11': 'נוב', '12': 'דצמ',
}

const MILESTONES = {
  '2023-12': 'תחילת פיילוט',
  '2025-01': 'תחילת תכנית רחבה',
}

export default function TimelineChart({ timeline }) {
  // Build sorted list of all months Dec 2023 → Nov 2025
  const allMonths = []
  for (let y = 2023; y <= 2025; y++) {
    const startM = y === 2023 ? 12 : 1
    const endM = y === 2025 ? 11 : 12
    for (let m = startM; m <= endM; m++) {
      allMonths.push(`${y}-${String(m).padStart(2, '0')}`)
    }
  }

  const getVal = (key, field) => {
    const entry = timeline[key]
    return entry ? Math.round(entry[field]) : 0
  }

  const categories = allMonths.map((k) => {
    const [y, m] = k.split('-')
    return `${MONTH_LABELS[m]} ${y.slice(2)}`
  })

  const series = [
    { name: 'הנהלה', data: allMonths.map((k) => getVal(k, 'mgmt')).reverse() },
    { name: 'מנהלים ביניים', data: allMonths.map((k) => getVal(k, 'midMgmt')).reverse() },
    { name: 'עובדים', data: allMonths.map((k) => getVal(k, 'workers')).reverse() },
  ]

  // Milestone annotations
  const reversedCategories = categories.slice().reverse()
  const milestoneAnnotations = Object.entries(MILESTONES).map(([key, label]) => {
    const idx = allMonths.indexOf(key)
    if (idx === -1) return null
    const reversedIdx = allMonths.length - 1 - idx
    return {
      x: reversedCategories[reversedIdx],
      borderColor: '#5D87FF',
      label: {
        style: {
          background: '#5D87FF',
          color: '#fff',
          fontFamily: 'Heebo, sans-serif',
          fontSize: '11px',
          padding: { left: 6, right: 6, top: 3, bottom: 3 },
        },
        text: label,
        orientation: 'horizontal',
      },
    }
  }).filter(Boolean)

  const options = {
    chart: {
      type: 'area',
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'Heebo, sans-serif',
      animations: { enabled: true, speed: 800, easing: 'easeinout' },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { opacityFrom: 0.6, opacityTo: 0.1, shadeIntensity: 1 },
    },
    colors: ['#2A3547', '#5D87FF', '#49BEFF'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: reversedCategories,
      tickAmount: 8,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#7C8FAC', fontSize: '12px' },
        rotate: -30,
      },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#7C8FAC', fontSize: '12px' },
        formatter: (v) => Math.round(v),
      },
      title: {
        text: 'סדנאות חודשיות',
        style: { fontFamily: 'Heebo, sans-serif', color: '#7C8FAC', fontSize: '12px' },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'Heebo, sans-serif',
      fontSize: '13px',
    },
    annotations: { xaxis: milestoneAnnotations },
    tooltip: {
      style: { fontFamily: 'Heebo, sans-serif' },
      y: { formatter: (val) => `${val} סדנאות` },
    },
    grid: { borderColor: '#D5E3F7' },
  }

  return (
    <div className="bg-card rounded-card shadow-card p-6">
      <h2 className="text-lg font-bold text-text-main mb-1">ציר הזמן — התפתחות הפעילות</h2>
      <p className="text-sm text-text-muted mb-4">דצמבר 2023 – נובמבר 2025</p>
      <ReactApexChart type="area" series={series} options={options} height={280} />
    </div>
  )
}
