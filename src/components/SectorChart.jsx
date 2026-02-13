import ReactApexChart from 'react-apexcharts'

export default function SectorChart({ plants }) {
  const counts = {}
  plants.forEach((p) => {
    const sector = p.sector || 'אחר'
    counts[sector] = (counts[sector] || 0) + 1
  })

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const categories = sorted.map(([s]) => s)
  const data = sorted.map(([, c]) => c)

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'Heebo, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 6,
        columnWidth: '55%',
        distributed: true,
      },
    },
    colors: [
      '#5D87FF', '#49BEFF', '#13DEB9', '#FA896B',
      '#7A6E9E', '#FFAE1F', '#2A3547', '#A1B4CE',
    ],
    dataLabels: {
      enabled: true,
      style: { fontFamily: 'Heebo, sans-serif', fontSize: '13px', fontWeight: 700, colors: ['#fff'] },
      formatter: (val) => val,
    },
    xaxis: {
      categories,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#2A3547', fontSize: '12px' },
        rotate: -30,
        trim: true,
      },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#7C8FAC' },
        formatter: (v) => Math.round(v),
      },
      tickAmount: 4,
    },
    legend: { show: false },
    tooltip: {
      style: { fontFamily: 'Heebo, sans-serif' },
      y: { formatter: (val) => `${val} מפעלים` },
    },
    grid: { borderColor: '#D5E3F7', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
  }

  return (
    <div className="bg-card rounded-card shadow-card p-6">
      <h2 className="text-lg font-bold text-text-main mb-1">פילוח לפי ענף</h2>
      <p className="text-sm text-text-muted mb-4">מספר מפעלים לפי תחום תעשייה</p>
      <ReactApexChart type="bar" series={[{ name: 'מפעלים', data }]} options={options} height={260} />
    </div>
  )
}
