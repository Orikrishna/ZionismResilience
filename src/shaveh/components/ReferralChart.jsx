import ReactApexChart from 'react-apexcharts'

const REFERRAL_COLORS = [
  '#e8969f', '#70bdb3', '#4263aa', '#e9ab56', '#d68089',
  '#8b6f9e', '#5ba3cf', '#948c89',
]

export default function ReferralChart({ companies }) {
  const counts = {}
  companies.forEach((c) => {
    if (c.referralSource1) {
      counts[c.referralSource1] = (counts[c.referralSource1] || 0) + 1
    }
    if (c.referralSource2) {
      counts[c.referralSource2] = (counts[c.referralSource2] || 0) + 1
    }
  })

  // Sort by count descending
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const labels = sorted.map(([k]) => k)
  const values = sorted.map(([, v]) => v)

  const options = {
    chart: {
      type: 'donut',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      animations: { enabled: true, speed: 600 },
    },
    labels,
    colors: REFERRAL_COLORS.slice(0, labels.length),
    legend: {
      position: 'bottom',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      fontSize: '12px',
      markers: { radius: 4 },
    },
    dataLabels: {
      enabled: true,
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif', fontSize: '12px' },
      formatter: (val, opts) => `${opts.w.globals.series[opts.seriesIndex]}`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '55%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'ערוצי פנייה',
              fontSize: '12px',
              fontFamily: 'Noto Sans Hebrew, sans-serif',
              color: '#706e6d',
            },
            value: {
              fontFamily: 'Noto Sans Hebrew, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#454342',
            },
          },
        },
      },
    },
    tooltip: {
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif' },
      y: { formatter: (val) => `${val} פניות` },
    },
    stroke: { width: 2, colors: ['#f9f2f3'] },
  }

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">ערוצי פנייה</h2>
      <p className="text-sm text-sh-text-muted mb-2">כיצד הגיעו אלינו החברות</p>
      <ReactApexChart type="donut" series={values} options={options} height={300} />
    </div>
  )
}
