import ReactApexChart from 'react-apexcharts'

const GEO_COLORS = {
  'עוטף עזה': '#FA896B',
  'גליל עליון': '#4A7C6F',
  'חוף אשקלון': '#5D87FF',
  'רמת הגולן': '#7A6E9E',
  'גליל מערבי': '#13DEB9',
}

export default function GeoDonut({ plants }) {
  const counts = {}
  plants.forEach((p) => {
    counts[p.geography] = (counts[p.geography] || 0) + 1
  })

  const labels = Object.keys(counts)
  const series = labels.map((l) => counts[l])
  const colors = labels.map((l) => GEO_COLORS[l] || '#5D87FF')

  const options = {
    chart: {
      type: 'donut',
      fontFamily: 'Heebo, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    labels,
    colors,
    legend: {
      position: 'bottom',
      fontFamily: 'Heebo, sans-serif',
      fontSize: '13px',
      markers: { radius: 4 },
    },
    dataLabels: {
      enabled: true,
      style: { fontFamily: 'Heebo, sans-serif', fontSize: '13px' },
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
              label: 'סה״כ מפעלים',
              fontSize: '13px',
              fontFamily: 'Heebo, sans-serif',
              color: '#7C8FAC',
              formatter: () => plants.length,
            },
            value: {
              fontFamily: 'Heebo, sans-serif',
              fontSize: '28px',
              fontWeight: 700,
              color: '#2A3547',
            },
          },
        },
      },
    },
    tooltip: {
      style: { fontFamily: 'Heebo, sans-serif' },
      y: { formatter: (val) => `${val} מפעלים` },
    },
    stroke: { width: 2, colors: ['#ECF2F8'] },
  }

  return (
    <div className="bg-card rounded-card shadow-card p-6">
      <h2 className="text-lg font-bold text-text-main mb-1">פילוח גיאוגרפי</h2>
      <p className="text-sm text-text-muted mb-2">מפעלים לפי אזור</p>
      <ReactApexChart type="donut" series={series} options={options} height={300} />
    </div>
  )
}
