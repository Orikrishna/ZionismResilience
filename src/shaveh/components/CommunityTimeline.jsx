import ReactApexChart from 'react-apexcharts'

const EVENTS = [
  { key: 'conference_08_22', label: '8.22' },
  { key: 'conference_01_23', label: '1.23' },
  { key: 'conference_04_23', label: '4.23' },
  { key: 'conference_10_23', label: '10.23' },
  { key: 'conference_03_24', label: '3.24' },
  { key: 'conference_09_24', label: '9.24' },
  { key: 'conference_12_24', label: '12.24' },
  { key: 'conference_09_25', label: '9.25' },
  { key: 'conference_05_25', label: '5.25' },
]

export default function CommunityTimeline({ companies }) {
  const yesCompanies = companies.filter(c => c.status === 'כן')

  const counts = EVENTS.map(e =>
    yesCompanies.filter(c => c.community?.[e.key] === true).length
  )

  const options = {
    chart: {
      type: 'bar',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '55%',
        distributed: true,
      },
    },
    colors: counts.map(() => '#70bdb3'),
    dataLabels: {
      enabled: true,
      style: {
        fontFamily: 'Noto Sans Hebrew, sans-serif',
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#454342'],
      },
      offsetY: -6,
    },
    xaxis: {
      categories: EVENTS.map(e => e.label),
      labels: {
        style: {
          fontFamily: 'Noto Sans Hebrew, sans-serif',
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      max: Math.max(...counts) + 2,
      labels: {
        style: {
          fontFamily: 'Noto Sans Hebrew, sans-serif',
          fontSize: '11px',
        },
      },
    },
    legend: { show: false },
    grid: {
      borderColor: '#f0e8e9',
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    tooltip: {
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif' },
      custom: ({ dataPointIndex }) => {
        const event = EVENTS[dataPointIndex]
        const count = counts[dataPointIndex]
        return `<div style="padding:8px 12px;font-family:Noto Sans Hebrew;direction:rtl">
          <strong>מפגש ${event.label}</strong><br/>
          ${count} חברות השתתפו מתוך ${yesCompanies.length}
        </div>`
      },
    },
  }

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">קהילת העסקים</h2>
      <p className="text-sm text-sh-text-muted mb-2">
        השתתפות {yesCompanies.length} חברות פעילות במפגשים לאורך זמן
      </p>
      <ReactApexChart
        type="bar"
        series={[{ name: 'חברות', data: counts }]}
        options={options}
        height={220}
      />
    </div>
  )
}
