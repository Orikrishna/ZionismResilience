import ReactApexChart from 'react-apexcharts'

const SIZE_ORDER = ['גלובלית', 'גדולה', 'בינונית', 'קטנה']
const SIZE_COLORS = ['#4263aa', '#70bdb3', '#e9ab56', '#e8969f']

export default function CompanySizeChart({ companies }) {
  const counts = {}
  companies.forEach((c) => {
    const size = c.companySize || 'לא מוגדר'
    counts[size] = (counts[size] || 0) + 1
  })

  const categories = SIZE_ORDER.filter(s => counts[s])
  const values = categories.map(s => counts[s])
  const colors = categories.map((_, i) => SIZE_COLORS[i])

  const options = {
    chart: {
      type: 'donut',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    labels: categories,
    colors,
    legend: {
      position: 'bottom',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      fontSize: '13px',
      markers: { radius: 4 },
    },
    dataLabels: {
      enabled: true,
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif', fontSize: '13px' },
      formatter: (val, opts) => `${opts.w.globals.series[opts.seriesIndex]}`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '60%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'סה״כ',
              fontSize: '13px',
              fontFamily: 'Noto Sans Hebrew, sans-serif',
              color: '#706e6d',
              formatter: () => companies.length,
            },
            value: {
              fontFamily: 'Noto Sans Hebrew, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#454342',
            },
          },
        },
      },
    },
    tooltip: {
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif' },
      y: { formatter: (val) => `${val} חברות` },
    },
    stroke: { width: 2, colors: ['#f9f2f3'] },
  }

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">גודל חברה</h2>
      <p className="text-sm text-sh-text-muted mb-2">חלוקה לפי גודל</p>
      <ReactApexChart type="donut" series={values} options={options} height={300} />
    </div>
  )
}
