import ReactApexChart from 'react-apexcharts'

const COHORT_LABELS = { 1: '2021', 2: '2022', 3: '2023', 4: '2024+' }

const PHASES = [
  {
    name: 'learning',
    label: 'למידה',
    color: '#4263aa',
    steps: [
      'industryReview', 'surveyDesign', 'participantRecruitment', 'barrierMapping',
      'surveyDistribution', 'responseCollection', 'expertRecruitment',
      'recommendationsReport', 'userTesting', 'socialPartnerRecruitment',
      'developmentRecommendations',
    ],
  },
  {
    name: 'development',
    label: 'פיתוח',
    color: '#70bdb3',
    steps: [
      'presentRecommendations', 'productDecision', 'ganttCreation',
      'processCompletion', 'solutionValidation', 'productImplementation',
    ],
  },
  {
    name: 'marketing',
    label: 'שיווק',
    color: '#e9ab56',
    steps: [
      'influencerSharing', 'digitalMarketing', 'pressReleaseDraft',
      'pressReleaseApproval', 'websiteUpdate', 'exposureData',
    ],
  },
]

export default function CohortAnalysis({ companies }) {
  const yesCompanies = companies.filter(c => c.status === 'כן' && c.cohort)

  // Group by cohort
  const cohorts = {}
  yesCompanies.forEach(c => {
    const key = c.cohort
    if (!cohorts[key]) cohorts[key] = []
    cohorts[key].push(c)
  })

  // Sorted cohort keys
  const cohortKeys = Object.keys(cohorts).map(Number).sort()
  const categories = cohortKeys.map(k => COHORT_LABELS[k] || `מחזור ${k}`)

  // For each phase, compute average completion % per cohort
  const series = PHASES.map(phase => ({
    name: phase.label,
    data: cohortKeys.map(cohortKey => {
      const group = cohorts[cohortKey]
      if (!group.length) return 0
      let totalSteps = 0
      let completedSteps = 0
      group.forEach(c => {
        const phaseData = c.process?.[phase.name]
        if (!phaseData) return
        phase.steps.forEach(stepKey => {
          const val = phaseData[stepKey]
          if (val !== null && val !== undefined) {
            totalSteps++
            if (val === 'כן') completedSteps++
          }
        })
      })
      return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0
    }),
  }))

  const options = {
    chart: {
      type: 'bar',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '70%',
        dataLabels: { position: 'center' },
      },
    },
    colors: PHASES.map(p => p.color),
    dataLabels: {
      enabled: true,
      formatter: (val) => val > 0 ? `${val}%` : '',
      style: {
        fontFamily: 'Noto Sans Hebrew, sans-serif',
        fontSize: '10px',
        fontWeight: 600,
        colors: ['#fff'],
      },
    },
    xaxis: {
      categories,
      max: 100,
      labels: {
        formatter: (val) => `${val}%`,
        style: {
          fontFamily: 'Noto Sans Hebrew, sans-serif',
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: {
          fontFamily: 'Noto Sans Hebrew, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
        },
      },
    },
    legend: {
      position: 'bottom',
      fontFamily: 'Noto Sans Hebrew, sans-serif',
      fontSize: '12px',
      markers: { radius: 2 },
    },
    grid: {
      borderColor: '#f0e8e9',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      style: { fontFamily: 'Noto Sans Hebrew, sans-serif' },
      y: { formatter: (val) => `${val}%` },
    },
  }

  return (
    <div className="bg-sh-card rounded-card-sh shadow-card p-6">
      <h2 className="text-lg font-bold text-sh-text mb-1">התקדמות לפי מחזור</h2>
      <p className="text-sm text-sh-text-muted mb-2">
        אחוז השלמת שלבים לפי שנת הצטרפות ({yesCompanies.length} חברות)
      </p>
      <ReactApexChart
        type="bar"
        series={series}
        options={options}
        height={220}
      />
    </div>
  )
}
