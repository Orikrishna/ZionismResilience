import ReactApexChart from 'react-apexcharts'

const PIPELINE_STAGES = [
  { key: 'paid', label: 'שולם' },
  { key: 'agreementSigned', label: 'הסכם חתום' },
  { key: 'agreementSent', label: 'הסכם נשלח' },
  { key: 'meetingHeld', label: 'פגישה' },
  { key: 'emailSent', label: 'מייל' },
]

export default function PipelineBar({ companies }) {
  // Count companies at each HIGHEST stage
  const stageCounts = {
    paid: 0,
    agreementSigned: 0,
    agreementSent: 0,
    meetingHeld: 0,
    emailSent: 0,
    none: 0,
  }

  companies.forEach((c) => {
    if (c.paid) stageCounts.paid++
    else if (c.agreementSigned) stageCounts.agreementSigned++
    else if (c.agreementSent) stageCounts.agreementSent++
    else if (c.meetingHeld) stageCounts.meetingHeld++
    else if (c.emailSent) stageCounts.emailSent++
    else stageCounts.none++
  })

  const categories = PIPELINE_STAGES.map(s => s.label)
  // Negative values for RTL bar growth
  const values = PIPELINE_STAGES.map(s => -stageCounts[s.key])

  const COLORS = ['#a04049', '#b2555e', '#c46a74', '#d68089', '#e8969f']

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
        barHeight: '60%',
      },
    },
    colors: COLORS,
    dataLabels: {
      enabled: true,
      formatter: (val) => Math.abs(val),
      style: {
        fontFamily: 'Noto Sans Hebrew, sans-serif',
        fontSize: '13px',
        fontWeight: 600,
        colors: ['#fff'],
      },
    },
    xaxis: {
      categories,
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
          fontSize: '13px',
          fontWeight: 500,
          cssClass: 'apexcharts-yaxis-label-shaveh',
        },
      },
    },
    legend: { show: false },
    grid: {
      borderColor: '#f0e8e9',
      padding: { right: 30 },
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif' },
      y: { formatter: (val) => `${Math.abs(val)} חברות` },
    },
  }

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">שלב גבוה ביותר בתהליך</h2>
      <p className="text-sm text-sh-text-muted mb-2">כמה חברות נמצאות בכל שלב</p>
      <ReactApexChart type="bar" series={[{ data: values }]} options={options} height={260} />
    </div>
  )
}
