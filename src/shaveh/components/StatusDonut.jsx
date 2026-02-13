import ReactApexChart from 'react-apexcharts'

const STATUS_MAP = {
  'כן': { label: 'הצטרפו', color: '#70bdb3' },
  'לא': { label: 'לא הצטרפו', color: '#e8969f' },
  'טרם הוחלט': { label: 'טרם הוחלט', color: '#e9ab56' },
}

export default function StatusDonut({ companies }) {
  const counts = {}
  companies.forEach((c) => {
    const key = c.status || 'טרם הוחלט'
    if (STATUS_MAP[key]) {
      counts[key] = (counts[key] || 0) + 1
    }
  })

  const labels = Object.keys(counts).map(k => STATUS_MAP[k].label)
  const series = Object.values(counts)
  const colors = Object.keys(counts).map(k => STATUS_MAP[k].color)

  const options = {
    chart: {
      type: 'donut',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    labels,
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
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'סה״כ חברות',
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
      <h2 className="text-lg font-bold text-sh-text mb-1">סטטוס חברות</h2>
      <p className="text-sm text-sh-text-muted mb-2">חלוקה לפי סטטוס הצטרפות</p>
      <ReactApexChart type="donut" series={series} options={options} height={300} />
    </div>
  )
}
