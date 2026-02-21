// Shared PDF generation helpers for Vercel API functions.
// Underscore prefix means Vercel won't expose this as an API route.

import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

export const CHROMIUM_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'

const STATIC_BASE = 'https://orikrishna.github.io/ZionismResilience'
const LOGO_Z2000     = `${STATIC_BASE}/zionism2000-logo.jpg`
const LOGO_QBT_WHITE = `${STATIC_BASE}/Q_Logo_White@2x.png`
export { STATIC_BASE }

export const C = {
  pink:    '#e8969f', pinkDark:'#d4687a', blue:    '#4263aa',
  green:   '#70bdb3', yellow:  '#e9ab56', bg:      '#f9f2f3',
  card:    '#fff9fa', stripe:  '#f3ecee', border:  '#f0dde0',
  text:    '#2d1f22', muted:   '#9c7a82', white:   '#ffffff',
}

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans Hebrew', Arial, sans-serif; direction: rtl; background: ${C.white}; color: ${C.text}; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 11px; }
  .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm 0; background: ${C.white}; page-break-after: always; overflow: hidden; display: flex; flex-direction: column; }
  .page:last-child { page-break-after: auto; }
  .site-header { display: flex; align-items: center; justify-content: space-between; background: #fff9fa; padding: 10px 14px; border-bottom: 3px solid ${C.pink}; margin: -12mm -14mm 10px -14mm; }
  .site-header-left { display: flex; align-items: center; gap: 10px; }
  .site-header-icon { width: 44px; height: 44px; background: ${C.pink}; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .site-header-icon svg { width: 32px; height: 32px; }
  .site-header-title { font-size: 15px; font-weight: 900; color: ${C.text}; }
  .site-header-sub { font-size: 9px; color: ${C.muted}; margin-top: 1px; }
  .site-header-logo { height: 48px; object-fit: contain; }
  .page-title-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid ${C.border}; }
  .page-title { font-size: 13px; font-weight: 700; color: ${C.text}; }
  .kpi-strip { display: flex; gap: 6px; margin-bottom: 8px; }
  .kpi-box { flex: 1; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 8px 6px; text-align: center; }
  .kpi-val { font-size: 22px; font-weight: 900; line-height: 1.1; }
  .kpi-lbl { font-size: 9px; color: ${C.muted}; margin-top: 2px; }
  .sec { font-size: 11px; font-weight: 700; color: ${C.blue}; margin: 8px 0 5px; padding-right: 7px; border-right: 3px solid ${C.blue}; }
  .card { background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 8px; padding: 8px 10px; }
  .page-content { flex: 1; padding-bottom: 8px; }
  .page-footer { margin: 0 -14mm; padding: 5px 14mm; background: ${C.pink}; display: flex; align-items: center; justify-content: flex-end; gap: 6px; direction: rtl; }
  .page-footer-text { font-size: 8px; color: rgba(255,255,255,0.9); font-weight: 500; letter-spacing: 0.3px; }
  @media print { body { background: ${C.white}; } @page { size: A4 portrait; margin: 0; } }
`

const PROCESS_STEP_LABELS = {
  industryReview: 'סקירת ענף', surveyDesign: 'עיצוב סקר', participantRecruitment: 'גיוס משתתפים',
  barrierMapping: 'מיפוי חסמים', surveyDistribution: 'הפצת סקר', responseCollection: 'איסוף תגובות',
  expertRecruitment: 'גיוס מומחים', recommendationsReport: 'דוח המלצות', userTesting: 'בדיקת משתמשים',
  socialPartnerRecruitment: 'גיוס שותפים חברתיים', developmentRecommendations: 'המלצות פיתוח',
  presentRecommendations: 'הצגת המלצות', productDecision: 'החלטת מוצר', ganttCreation: 'בניית גאנט',
  processCompletion: 'השלמת תהליך', solutionValidation: 'ולידציית פתרון', productImplementation: 'יישום מוצר',
  influencerSharing: 'שיתוף משפיענים', digitalMarketing: 'שיווק דיגיטלי', pressReleaseDraft: 'טיוטת הודעה לעיתונות',
  pressReleaseApproval: 'אישור הודעה לעיתונות', websiteUpdate: 'עדכון אתר', exposureData: 'נתוני חשיפה',
}

const PHASES = [
  { key: 'learning',    label: 'שלב למידה',  color: C.blue   },
  { key: 'development', label: 'שלב פיתוח',  color: C.green  },
  { key: 'marketing',   label: 'שלב שיווק',  color: C.yellow },
]

const INDUSTRY_GROUP = {
  'קניונים ומרכזים מסחריים': 'קניונים', 'מוצרי חשמל': 'חשמל ותקשורת',
  'חשמל': 'חשמל ותקשורת', 'תקשורת': 'חשמל ותקשורת',
  'בריאות': 'בריאות ותרופות', 'תרופות': 'בריאות ותרופות',
  'פיננסים': 'פיננסים וביטוח', 'ביטוח': 'פיננסים וביטוח',
  'תעופה': 'תחבורה ותיירות', 'תחבורה': 'תחבורה ותיירות', 'תיירות': 'תחבורה ותיירות',
  'קולנוע': 'בידור ואופנה', 'בתי קפה': 'בידור ואופנה', 'אופנה': 'בידור ואופנה',
}
const INDUSTRY_COLORS = {
  'קמעונאות': '#d68089', 'קניונים': '#e8969f', 'מזון': '#70bdb3',
  'טכנולוגיה': '#e9ab56', 'חשמל ותקשורת': '#c4956a', 'בריאות ותרופות': '#4263aa',
  'פיננסים וביטוח': '#8b6f9e', 'שירותים': '#5ba3cf', 'תחבורה ותיירות': '#6ba58a',
  'בידור ואופנה': '#cf8a5b', 'בנייה': '#948c89',
}
const REFERRAL_COLORS = ['#e8969f','#70bdb3','#4263aa','#e9ab56','#d68089','#8b6f9e','#5ba3cf','#948c89','#6ba58a','#cf8a5b']

const QSVG = `<svg viewBox="0 0 58 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12.4961 24.9688V16.7717L16.5302 17.0737V25.2708L12.4961 24.9688ZM20.1345 25.5394V14.566L12.4978 13.9954V10.2363L24.2207 11.1123V25.843L20.1345 25.5377V25.5394Z" fill="white"/>
  <path d="M28.152 26.1381V15.1647L26.49 15.0413V11.2822L32.2381 11.711V26.4418L28.152 26.1365V26.1381Z" fill="white"/>
  <path d="M36.0428 26.728V15.7546L34.3809 15.6311V11.8721L40.129 12.3009V27.0316L36.0428 26.7263V26.728Z" fill="white"/>
  <path d="M53.5615 28.0374L43.0742 27.2532V12.5225L46.8078 12.8011V23.7745L53.6371 24.2851C53.7378 24.2917 53.8637 24.1766 53.8637 24.0748V13.33L57.5973 13.6086V24.3034C57.5956 26.2955 55.6029 28.1909 53.5615 28.0374ZM51.3439 21.8174L49.7306 22.9336L48.1424 21.3269L48.5453 20.0455V12.9329L52.1765 13.2049V20.2174C52.1765 20.9999 51.923 21.4353 51.3439 21.8208V21.8174Z" fill="white"/>
  <path d="M7.98288 42.8912V32.1464C7.98288 32.0463 7.85865 31.9095 7.75792 31.9028L4.2795 31.6425V42.6159L0.193359 42.3106V27.5798L8.03492 28.1655C10.0259 28.314 12.0673 30.4596 12.0673 32.5034V43.1982L7.9812 42.8929L7.98288 42.8912Z" fill="white"/>
  <path d="M15.9979 43.4907V32.5173L14.3359 32.3938V28.6348L20.0841 29.0636V43.7943L15.9979 43.489V43.4907Z" fill="white"/>
  <path d="M31.5266 44.6516V33.6798L28.2513 33.4346V41.1779C28.2513 42.7662 26.6615 44.2879 25.023 44.1661L21.9727 43.9375V40.1785L23.9385 40.3253C24.0392 40.3336 24.1651 40.2168 24.1651 40.1151V33.1276L22.3504 32.9924V29.2334L35.611 30.2245V44.9552L31.5249 44.6499L31.5266 44.6516Z" fill="white"/>
  <path d="M39.7456 37.6474V34.2922L37.8301 34.1487V30.3896L43.83 30.8385V37.9511L39.7456 37.6458V37.6474Z" fill="white"/>
  <path d="M53.9356 46.3262L46.0957 45.7405V41.9815L53.6586 42.5471C53.7593 42.5538 53.8852 42.4387 53.8852 42.3369V35.5763C53.8852 35.4762 53.761 35.3394 53.6603 35.3327L50.0559 35.0641V36.9812L51.9211 37.1213V40.5767L46.0974 40.1412V31.0098L53.9389 31.5954C55.93 31.7439 57.9714 33.8895 57.9714 35.9334V42.5922C57.9714 44.5843 55.9787 46.4797 53.9373 46.3262H53.9356Z" fill="white"/>
  <path d="M58 10.1626V0H0V6.1299L58 10.1626Z" fill="white"/>
  <path d="M0 45.8379V56.0004H58V49.8689L0 45.8379Z" fill="white"/>
</svg>`

const siteHeader = `
  <div class="site-header">
    <div class="site-header-left">
      <div class="site-header-icon">${QSVG}</div>
      <div>
        <div class="site-header-title">פרויקט שווה פיתוח | תמונת מצב</div>
        <div class="site-header-sub">מיזם להתאמת מוצרים ושירותים לאנשים עם מוגבלות</div>
      </div>
    </div>
    <img src="${LOGO_Z2000}" class="site-header-logo" alt="ציונות 2000" onerror="this.style.display='none'">
  </div>`

const pageFooter = `
  <div class="page-footer">
    <span class="page-footer-text">עיבוד והצגת הנתונים בשיתוף</span>
    <img src="${LOGO_QBT_WHITE}" style="height:22px;width:auto;object-fit:contain;flex-shrink:0;" alt="Q-BT" onerror="this.style.display='none'">
  </div>`

function svgDonut(segments, size = 120, thickness = 26) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size / 2) - thickness / 2
  const cx = size / 2, cy = size / 2
  let paths = '', angle = -Math.PI / 2
  for (const seg of segments) {
    const frac = seg.value / total
    const sweep = frac * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0
    if (frac > 0) paths += `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}" fill="none" stroke="${seg.color}" stroke-width="${thickness}" stroke-linecap="butt"/>`
    angle += sweep
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="${thickness}"/>
    ${paths}
  </svg>`
}

function computeProcessStats(companies) {
  const stats = {}
  for (const phase of PHASES) {
    stats[phase.key] = {}
    for (const company of companies) {
      const phaseData = company.process?.[phase.key]
      if (!phaseData) continue
      for (const [step, val] of Object.entries(phaseData)) {
        if (!stats[phase.key][step]) stats[phase.key][step] = { yes: 0, total: 0 }
        if (val !== null) { stats[phase.key][step].total++; if (val === 'כן') stats[phase.key][step].yes++ }
      }
    }
  }
  return stats
}

export function buildPdfHTML(d, companies) {
  const processStats = computeProcessStats(companies)

  const hbar = (label, value, max, color, lblWidth = '90px') => `
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
      <div style="width:${lblWidth};text-align:right;flex-shrink:0;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${label}">${label}</div>
      <div style="flex:1;background:${C.border};border-radius:3px;height:10px;overflow:hidden;">
        <div style="width:${Math.round((value / max) * 100)}%;height:100%;border-radius:3px;background:${color};"></div>
      </div>
      <div style="width:20px;text-align:left;font-size:9px;color:${C.muted};flex-shrink:0;">${value}</div>
    </div>`

  const statusColors = { 'כן': C.green, 'לא': C.pink, 'טרם הוחלט': C.yellow }
  const statusSegs = Object.entries(d.statusCounts).map(([k, v]) => ({ value: v, color: statusColors[k] || C.muted }))
  const statusDonut = svgDonut(statusSegs, 100, 26)
  const statusLegend = Object.entries(d.statusCounts).map(([k, v]) => {
    const pct = d.total ? Math.round((v / d.total) * 100) : 0
    return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${statusColors[k] || C.muted};flex-shrink:0;"></div>
      <span style="font-size:9.5px;">${k}</span>
      <span style="font-size:9px;color:${C.muted};margin-right:auto;">${v} (${pct}%)</span>
    </div>`
  }).join('')

  const maxPipeline = d.pipeline.emailSent || 1
  const pipelineSteps = [
    { label: 'מייל נשלח',  value: d.pipeline.emailSent,        color: C.blue     },
    { label: 'פגישה',       value: d.pipeline.meetings,         color: C.green    },
    { label: 'הסכם נשלח',  value: d.pipeline.agreementSent,    color: C.yellow   },
    { label: 'הסכם חתום',  value: d.pipeline.agreementsSigned, color: C.pink     },
    { label: 'שולם',        value: d.pipeline.paid,             color: C.pinkDark },
  ]

  const groupedIndustry = {}
  companies.forEach(c => {
    if (!c.industry) return
    const g = INDUSTRY_GROUP[c.industry] || c.industry
    if (!groupedIndustry[g]) groupedIndustry[g] = { total: 0, joined: 0 }
    groupedIndustry[g].total++
    if (c.paid) groupedIndustry[g].joined++
  })
  const industryEntries = Object.entries(groupedIndustry).sort((a, b) => b[1].total - a[1].total)
  const maxInd = Math.max(...industryEntries.map(([,v]) => v.total), 1)
  const industryBars = industryEntries.map(([name, { total, joined }]) => {
    const color = INDUSTRY_COLORS[name] || C.muted
    const joinedPct = total ? Math.round((joined / total) * 100) : 0
    const barPct = Math.round((total / maxInd) * 100)
    return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
      <div style="width:100px;text-align:right;flex-shrink:0;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${name}">${name}</div>
      <div style="flex:1;background:${C.border};border-radius:4px;height:14px;overflow:hidden;">
        <div style="width:${barPct}%;height:100%;border-radius:4px;background:${color};display:flex;align-items:center;justify-content:flex-end;padding-left:4px;">
          <span style="font-size:9px;font-weight:700;color:#fff;">${total}</span>
        </div>
      </div>
      <div style="width:32px;text-align:right;font-size:8.5px;color:${C.muted};flex-shrink:0;">${joined} הצ׳ (${joinedPct}%)</div>
    </div>`
  }).join('')

  const referralCounts = {}
  companies.forEach(c => {
    if (c.referralSource1) referralCounts[c.referralSource1] = (referralCounts[c.referralSource1] || 0) + 1
    if (c.referralSource2) referralCounts[c.referralSource2] = (referralCounts[c.referralSource2] || 0) + 1
  })
  const referralEntries = Object.entries(referralCounts).sort((a, b) => b[1] - a[1])
  const referralTotal = referralEntries.reduce((s, [, v]) => s + v, 0)
  const referralSegs = referralEntries.map(([, v], i) => ({ value: v, color: REFERRAL_COLORS[i % REFERRAL_COLORS.length] }))
  const referralDonut = svgDonut(referralSegs, 110, 28)
  const referralLegend = referralEntries.map(([k, v], i) => {
    const pct = referralTotal ? Math.round((v / referralTotal) * 100) : 0
    return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${REFERRAL_COLORS[i % REFERRAL_COLORS.length]};flex-shrink:0;"></div>
      <span style="font-size:9px;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${k}</span>
      <span style="font-size:9px;color:${C.muted};flex-shrink:0;">${v} (${pct}%)</span>
    </div>`
  }).join('')

  const pyramidLevels = [
    { label: 'לקוחות משלמים',  count: companies.filter(c => c.paid).length,                               color: '#70bdb3' },
    { label: 'בדרך להצטרפות', count: companies.filter(c => !c.paid && c.agreementSent).length,            color: '#a0d4cf' },
    { label: 'אחרי פגישה',     count: companies.filter(c => !c.agreementSent && c.meetingHeld).length,     color: '#e9ab56' },
    { label: 'מייל בלבד',       count: companies.filter(c => !c.meetingHeld && c.emailSent).length,        color: '#e8969f' },
    { label: 'טרם פנינו',       count: companies.filter(c => !c.emailSent).length,                         color: '#f0dde0' },
  ]
  const maxPyramid = companies.length || 1
  const pyramidRows = pyramidLevels.map((lv, i) => {
    const pct = Math.max(15, Math.round((lv.count / maxPyramid) * 100))
    const textColor = i < 3 ? '#fff' : C.text
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:88px;text-align:right;font-size:9px;flex-shrink:0;">${lv.label}</div>
      <div style="flex:1;height:18px;border-radius:3px;overflow:hidden;background:${C.border};">
        <div style="width:${pct}%;height:100%;background:${lv.color};display:flex;align-items:center;justify-content:center;">
          <span style="font-size:9px;font-weight:700;color:${textColor};">${lv.count}</span>
        </div>
      </div>
    </div>`
  }).join('')

  const cohortMap = {}
  companies.filter(c => c.status === 'כן').forEach(c => {
    const key = !c.cohort ? 'לא משויך' : c.cohort <= 1 ? '2021' : c.cohort === 2 ? '2022' : c.cohort === 3 ? '2023' : '2024+'
    if (!cohortMap[key]) cohortMap[key] = []
    cohortMap[key].push(c)
  })
  const phaseColors = { learning: C.blue, development: C.green, marketing: C.yellow }
  const phaseLabels = { learning: 'למידה', development: 'פיתוח', marketing: 'שיווק' }
  const cohortRows = Object.entries(cohortMap).map(([cohort, cos]) => {
    const bars = ['learning','development','marketing'].map(ph => {
      let yesCount = 0, totalCount = 0
      cos.forEach(c => {
        const phData = c.process?.[ph] || {}
        Object.values(phData).forEach(v => { if (v !== null) { totalCount++; if (v === 'כן') yesCount++ } })
      })
      const pct = totalCount ? Math.round((yesCount / totalCount) * 100) : 0
      return { pct, color: phaseColors[ph], label: phaseLabels[ph] }
    })
    return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
      <div style="width:40px;text-align:right;font-size:9px;font-weight:700;flex-shrink:0;">${cohort}</div>
      <div style="flex:1;height:16px;border-radius:3px;overflow:hidden;display:flex;background:${C.border};">
        ${bars.map(b => b.pct > 0 ? `<div style="width:${b.pct/3}%;height:100%;background:${b.color};"></div>` : '').join('')}
      </div>
      <div style="font-size:8.5px;color:${C.muted};width:28px;flex-shrink:0;">${cos.length} חב׳</div>
    </div>
    <div style="display:flex;gap:3px;margin-bottom:6px;padding-right:45px;">
      ${bars.map(b => `<span style="font-size:7.5px;color:${b.color};">● ${b.label} ${b.pct}%</span>`).join('<span style="font-size:7.5px;color:#ccc;"> | </span>')}
    </div>`
  }).join('')

  const undecidedItems = companies
    .filter(c => c.status === 'טרם הוחלט' && c.meetingHeld)
    .map(c => ({ id: c.id, name: c.name }))
  const chips = undecidedItems.length
    ? undecidedItems.map(({ id, name }) => {
        const logoTag = id
          ? `<img src="${STATIC_BASE}/logos/${id}.png" style="height:16px;width:20px;object-fit:contain;flex-shrink:0;" alt="" onerror="this.style.display='none'">`
          : `<div style="width:20px;height:16px;flex-shrink:0;"></div>`
        return `<div style="display:flex;align-items:center;gap:4px;padding:2px 4px;background:${C.white};border:1px solid ${C.border};border-radius:4px;">
          ${logoTag}
          <div style="font-size:8px;line-height:1.2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${name}</div>
        </div>`
      }).join('')
    : `<div style="font-size:9px;color:${C.muted};">אין חברות</div>`

  const allPhasesHTML = PHASES.map(phase => {
    const phaseStats = processStats[phase.key] || {}
    const steps = Object.entries(phaseStats).filter(([, s]) => s.total > 0)
    if (!steps.length) return ''
    return `<div style="margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;margin-bottom:4px;
        padding:4px 8px;background:${phase.color}18;border-radius:5px;border-right:3px solid ${phase.color};">
        <div style="width:8px;height:8px;border-radius:50%;background:${phase.color};flex-shrink:0;"></div>
        ${phase.label}
      </div>
      ${steps.map(([key, s]) => {
        const pct = s.total ? Math.round((s.yes / s.total) * 100) : 0
        return `<div style="display:flex;align-items:center;gap:5px;padding:2px 0;border-bottom:1px solid ${C.border};">
          <div style="flex:1;font-size:9.5px;">${PROCESS_STEP_LABELS[key] || key}</div>
          <div style="width:80px;background:${C.border};border-radius:2px;height:7px;flex-shrink:0;">
            <div style="width:${pct}%;height:100%;border-radius:2px;background:${phase.color};"></div>
          </div>
          <div style="width:26px;text-align:left;font-size:9px;color:${C.muted};flex-shrink:0;">${pct}%</div>
        </div>`
      }).join('')}
    </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><title>דו"ח שווה פיתוח</title><style>${sharedStyles}</style></head>
<body>
<div class="page">
  ${siteHeader}
  <div class="page-content">
  <div class="page-title-bar"><div class="page-title">ריכוז מידע</div><div style="font-size:9px;color:${C.muted};">${d.date}</div></div>
  <div class="kpi-strip">
    <div class="kpi-box"><div class="kpi-val" style="color:${C.blue};">${d.total}</div><div class="kpi-lbl">חברות בליווי</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.green};">${d.joined}</div><div class="kpi-lbl">הצטרפו</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.yellow};">${d.meetings}</div><div class="kpi-lbl">פגישות</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.blue};">${d.agreementsSigned}</div><div class="kpi-lbl">הסכמים חתומים</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.pink};">${d.conversionRate}%</div><div class="kpi-lbl">אחוז המרה</div></div>
  </div>
  <div class="kpi-strip" style="margin-bottom:10px;">
    <div class="kpi-box"><div class="kpi-val" style="color:${C.green};">${d.emailToMeetingRate}%</div><div class="kpi-lbl">מייל ← פגישה</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.blue};">${d.allSteps}</div><div class="kpi-lbl">5/5 שלבים</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.yellow};">${d.avgSteps}</div><div class="kpi-lbl">ממוצע שלבים</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.muted};">${d.undecided}</div><div class="kpi-lbl">טרם הוחלט</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.pink};">${d.undecidedWithMeeting}</div><div class="kpi-lbl">טרם הוחלט + פגישה</div></div>
  </div>
  <div style="display:grid;grid-template-columns:152px 1fr;gap:10px;margin-bottom:10px;">
    <div class="card" style="display:flex;flex-direction:column;align-items:center;padding:7px 8px;">
      <div class="sec" style="width:100%;margin-top:0;margin-bottom:4px;">התפלגות החלטות</div>
      <div style="margin:2px 0;">${statusDonut}</div>
      <div style="width:100%;margin-top:4px;">${statusLegend}</div>
    </div>
    <div class="card">
      <div class="sec" style="margin-top:0;">משפך גיוס</div>
      ${pipelineSteps.map(s => hbar(s.label, s.value, maxPipeline, s.color, '80px')).join('')}
      <div class="sec" style="margin-top:8px;">מפגשים — פירמידת מעורבות</div>
      ${pyramidRows}
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 165px;gap:10px;">
    <div class="card"><div class="sec" style="margin-top:0;">פילוח לפי ענף</div>${industryBars}</div>
    <div class="card" style="display:flex;flex-direction:column;align-items:center;padding:7px 8px;">
      <div class="sec" style="width:100%;margin-top:0;margin-bottom:4px;">ערוצי פנייה</div>
      <div style="margin:2px 0;">${referralDonut}</div>
      <div style="width:100%;margin-top:4px;">${referralLegend}</div>
    </div>
  </div>
  </div>${pageFooter}
</div>

<div class="page">
  ${siteHeader}
  <div class="page-content">
  <div class="page-title-bar"><div class="page-title">שלבי התהליך</div><div style="font-size:9px;color:${C.muted};">${d.date}</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    <div class="card">
      <div class="sec" style="margin-top:0;">שלבי התהליך — למידה, פיתוח, שיווק</div>
      ${allPhasesHTML}
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div class="card" style="flex:0 0 auto;">
        <div class="sec" style="margin-top:0;color:${C.blue};border-color:${C.blue};">ניתוח קוהורטים</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;padding-right:45px;flex-wrap:wrap;">
          <span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.blue};"></span> למידה</span>
          <span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.green};"></span> פיתוח</span>
          <span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.yellow};"></span> שיווק</span>
        </div>
        ${cohortRows || `<div style="font-size:9px;color:${C.muted};text-align:center;padding:8px 0;">אין נתוני קוהורט</div>`}
      </div>
      <div class="card" style="flex:0 0 auto;">
        <div class="sec" style="margin-top:0;color:${C.green};border-color:${C.green};">מפגשים — פירמידת מעורבות</div>
        ${pyramidRows}
      </div>
      <div class="card" style="flex:1;overflow:hidden;">
        <div class="sec" style="margin-top:0;color:${C.pink};border-color:${C.pink};">טרם הוחלט + פגישה (${undecidedItems.length})</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;">${chips}</div>
      </div>
    </div>
  </div>
  </div>${pageFooter}
</div>
</body></html>`
}

export function buildReportData(companies) {
  const total = companies.length
  const joined = companies.filter(c => c.paid).length
  const meetings = companies.filter(c => c.meetingHeld).length
  const agreementSent = companies.filter(c => c.agreementSent).length
  const agreementsSigned = companies.filter(c => c.agreementSigned).length
  const emailsSent = companies.filter(c => c.emailSent).length
  const conversionRate = emailsSent ? ((joined / emailsSent) * 100).toFixed(1) : '0.0'
  const emailToMeetingRate = emailsSent ? ((meetings / emailsSent) * 100).toFixed(1) : '0.0'
  const allSteps = companies.filter(c =>
    c.emailSent && c.meetingHeld && c.agreementSent && c.agreementSigned && c.paid
  ).length
  const yesCompanies = companies.filter(c => c.status === 'כן')
  const avgSteps = yesCompanies.length
    ? (yesCompanies.reduce((sum, c) =>
        sum + [c.emailSent, c.meetingHeld, c.agreementSent, c.agreementSigned, c.paid].filter(Boolean).length, 0
      ) / yesCompanies.length).toFixed(1)
    : '0.0'
  const undecided = companies.filter(c => c.status === 'טרם הוחלט').length
  const undecidedWithMeeting = companies.filter(c => c.status === 'טרם הוחלט' && c.meetingHeld).length
  const statusCounts = { 'כן': 0, 'לא': 0, 'טרם הוחלט': 0 }
  companies.forEach(c => { if (statusCounts[c.status] !== undefined) statusCounts[c.status]++ })
  const industryCounts = {}
  companies.forEach(c => { if (c.industry) industryCounts[c.industry] = (industryCounts[c.industry] || 0) + 1 })
  const sizeCounts = {}
  companies.forEach(c => { if (c.companySize) sizeCounts[c.companySize] = (sizeCounts[c.companySize] || 0) + 1 })
  const pipeline = { emailSent: emailsSent, meetings, agreementSent, agreementsSigned, paid: joined }
  const undecidedList = companies.filter(c => c.status === 'טרם הוחלט' && c.meetingHeld).map(c => c.name)
  const date = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  return {
    total, joined, meetings, agreementsSigned, emailsSent,
    conversionRate, emailToMeetingRate, allSteps, avgSteps,
    undecided, undecidedWithMeeting, statusCounts, industryCounts, sizeCounts,
    pipeline, undecidedList, date,
  }
}

export async function generatePdfBuffer(reportData, companies) {
  const html = buildPdfHTML(reportData, companies)
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(CHROMIUM_URL),
    headless: chromium.headless,
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
    const rawPdf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })
    return Buffer.isBuffer(rawPdf) ? rawPdf : Buffer.from(rawPdf)
  } finally {
    await browser.close()
  }
}
