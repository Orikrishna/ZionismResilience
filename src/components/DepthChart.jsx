import ReactApexChart from 'react-apexcharts'

export default function DepthChart({ plants }) {
  // Sort by total participants descending
  const sorted = [...plants].sort((a, b) => b.totalParticipants - a.totalParticipants)

  const categories = sorted.map((p) => p.name)

  const series = [
    {
      name: 'הנהלה',
      data: sorted.map((p) => p.mgmtParticipants),
    },
    {
      name: 'מנהלים ביניים',
      data: sorted.map((p) => p.midMgmtParticipants),
    },
    {
      name: 'עובדים',
      data: sorted.map((p) => p.workerParticipants),
    },
  ]

  const options = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'Heebo, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: { total: { enabled: false } },
      },
    },
    colors: ['#3D2B1F', '#C4714A', '#E8A87C'],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#8A7968', fontSize: '12px' },
      },
    },
    yaxis: {
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#1A1008', fontSize: '13px', fontWeight: 600 },
        align: 'right',
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontFamily: 'Heebo, sans-serif',
      fontSize: '13px',
      markers: { radius: 4 },
    },
    tooltip: {
      style: { fontFamily: 'Heebo, sans-serif' },
      y: { formatter: (val) => `${val} משתתפים` },
    },
    grid: {
      borderColor: '#F2D4B8',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
  }

  return (
    <div className="bg-card rounded-card shadow-card p-6">
      <h2 className="text-lg font-bold text-text-main mb-1">עומק ההתערבות לפי מפעל</h2>
      <p className="text-sm text-text-muted mb-4">פילוח משתתפים לפי שכבה ארגונית</p>
      <ReactApexChart
        type="bar"
        series={series}
        options={options}
        height={sorted.length * 36 + 60}
      />
    </div>
  )
}
