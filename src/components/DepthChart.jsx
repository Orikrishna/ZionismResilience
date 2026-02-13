import ReactApexChart from 'react-apexcharts'

export default function DepthChart({ plants }) {
  // Sort by total participants descending
  const sorted = [...plants].sort((a, b) => b.totalParticipants - a.totalParticipants)

  const categories = sorted.map((p) => p.name)

  // Use negative values so bars grow right-to-left in RTL layout
  const series = [
    {
      name: 'הנהלה',
      data: sorted.map((p) => -p.mgmtParticipants),
    },
    {
      name: 'מנהלים ביניים',
      data: sorted.map((p) => -p.midMgmtParticipants),
    },
    {
      name: 'עובדים',
      data: sorted.map((p) => -p.workerParticipants),
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
        barHeight: '70%',
        dataLabels: { total: { enabled: false } },
      },
    },
    colors: ['#2A3547', '#5D87FF', '#49BEFF'],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#7C8FAC', fontSize: '12px' },
        formatter: (val) => Math.abs(Math.round(val)),
      },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: { fontFamily: 'Heebo, sans-serif', colors: '#2A3547', fontSize: '13px', fontWeight: 600 },
        maxWidth: 200,
        align: 'left',
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
      y: { formatter: (val) => `${Math.abs(val)} משתתפים` },
    },
    grid: {
      borderColor: '#D5E3F7',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
  }

  return (
    <div className="bg-card rounded-card shadow-card p-6">
      <h2 className="text-lg font-bold text-text-main mb-1">עומק ההתערבות לפי מפעל</h2>
      <p className="text-sm text-text-muted mb-4">פילוח משתתפים לפי שכבה ארגונית</p>
      <div className="depth-chart-rtl"><ReactApexChart
        type="bar"
        series={series}
        options={options}
        height={sorted.length * 36 + 60}
      /></div>
    </div>
  )
}
