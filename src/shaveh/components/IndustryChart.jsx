import ReactApexChart from 'react-apexcharts'

const INDUSTRY_COLORS = {
  'מזון': '#70bdb3',
  'תעשייה': '#e8969f',
  'בריאות': '#4263aa',
  'טכנולוגיה': '#e9ab56',
  'קמעונאות': '#d68089',
  'פיננסים': '#8b6f9e',
  'שירותים': '#5ba3cf',
  'תעופה/תיירות': '#c4956a',
  'אחר': '#948c89',
}

export default function IndustryChart({ companies }) {
  const counts = {}
  companies.forEach((c) => {
    const ind = c.industry || 'לא מוגדר'
    counts[ind] = (counts[ind] || 0) + 1
  })

  // Sort by count descending
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const categories = sorted.map(([k]) => k)
  const values = sorted.map(([, v]) => -v)
  const colors = categories.map(c => INDUSTRY_COLORS[c] || '#948c89')

  // Also compute join rate per industry
  const joinCounts = {}
  companies.forEach((c) => {
    const ind = c.industry || 'לא מוגדר'
    if (c.status === 'כן') {
      joinCounts[ind] = (joinCounts[ind] || 0) + 1
    }
  })

  const options = {
    chart: {
      type: 'bar',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        borderRadius: 6,
        barHeight: '65%',
      },
    },
    colors,
    dataLabels: {
      enabled: true,
      formatter: (val) => Math.abs(val),
      style: {
        fontFamily: 'Noto Sans Hebrew, sans-serif',
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#fff'],
      },
    },
    xaxis: {
      categories,
      max: 0,
      labels: {
        formatter: (val) => Math.abs(val),
        style: { fontFamily: 'Noto Sans Hebrew, sans-serif', fontSize: '12px' },
      },
    },
    yaxis: {
      opposite: true,
      labels: {
        maxWidth: 200,
        style: {
          fontFamily: 'Noto Sans Hebrew, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          cssClass: 'apexcharts-yaxis-label-shaveh',
        },
      },
    },
    legend: { show: false },
    grid: { borderColor: '#f0e8e9', padding: { right: 20 }, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    tooltip: {
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif' },
      custom: ({ dataPointIndex }) => {
        const cat = categories[dataPointIndex]
        const total = Math.abs(values[dataPointIndex])
        const joined = joinCounts[cat] || 0
        const rate = total > 0 ? Math.round((joined / total) * 100) : 0
        return `<div style="padding:8px 12px;font-family:Noto Sans Hebrew;direction:rtl">
          <strong>${cat}</strong><br/>
          ${total} חברות | ${joined} הצטרפו (${rate}%)
        </div>`
      },
    },
  }

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">חלוקה לפי ענף</h2>
      <p className="text-sm text-sh-text-muted mb-2">כמה חברות בכל תעשייה</p>
      <ReactApexChart type="bar" series={[{ data: values }]} options={options} height={300} />
    </div>
  )
}
