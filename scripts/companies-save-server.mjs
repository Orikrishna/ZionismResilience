#!/usr/bin/env node
/**
 * Local server for the Shaveh dashboard.
 *
 * Endpoints:
 *   POST /save-companies  — saves the full companies array back to companies.json
 *   POST /send-email      — generates a PDF report and sends it via Resend API
 *   GET  /health          — health check
 *
 * Usage:
 *   node scripts/companies-save-server.mjs
 *   (runs on port 3457, alongside Vite dev server on 5173)
 */

import { createServer } from 'http'
import { writeFile, readFile } from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const COMPANIES_FILE = join(PROJECT_ROOT, 'src', 'shaveh', 'data', 'companies.json')
const PUBLIC_DIR = join(PROJECT_ROOT, 'public')

// ── Pre-load logos as base64 data URIs ────────────────────────────────────────
let LOGO_Z2000     = ''  // zionism2000-logo.jpg      → data:image/jpeg;base64,...
let LOGO_QBT       = ''  // qbt-logo.png              → data:image/png;base64,...
let LOGO_QBT_WHITE = ''  // Q_Logo_White@2x.png       → data:image/png;base64,...

try {
  const z2000Buf = await readFile(join(PUBLIC_DIR, 'zionism2000-logo.jpg'))
  LOGO_Z2000 = `data:image/jpeg;base64,${z2000Buf.toString('base64')}`
  const qbtBuf = await readFile(join(PUBLIC_DIR, 'qbt-logo.png'))
  LOGO_QBT = `data:image/png;base64,${qbtBuf.toString('base64')}`
  const qbtWhiteBuf = await readFile(join(PUBLIC_DIR, 'Q_Logo_White@2x.png'))
  LOGO_QBT_WHITE = `data:image/png;base64,${qbtWhiteBuf.toString('base64')}`
  console.log('  Logos loaded.')
} catch (e) {
  console.warn('  Warning: could not load logo files:', e.message)
}

// ── Load .env ─────────────────────────────────────────────────────────────────
const ENV_FILE = join(__dirname, '.env')
let RESEND_API_KEY = ''
let RESEND_FROM = 'onboarding@resend.dev'

if (existsSync(ENV_FILE)) {
  const envContent = await readFile(ENV_FILE, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim()
    if (key === 'RESEND_API_KEY') RESEND_API_KEY = val
    if (key === 'RESEND_FROM') RESEND_FROM = val
  }
  console.log(`  Loaded .env — FROM: ${RESEND_FROM}`)
} else {
  console.warn('  Warning: scripts/.env not found. Email sending will fail.')
}

const PORT = 3457

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
function jsonResponse(res, status, data) {
  cors(res)
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}
async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  pink:    '#e8969f',
  pinkDark:'#d4687a',
  blue:    '#4263aa',
  green:   '#70bdb3',
  yellow:  '#e9ab56',
  bg:      '#f9f2f3',
  card:    '#fff9fa',
  stripe:  '#f3ecee',
  border:  '#f0dde0',
  text:    '#2d1f22',
  muted:   '#9c7a82',
  white:   '#ffffff',
}

// ── Shared HTML/CSS helpers ───────────────────────────────────────────────────
const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Noto Sans Hebrew', Arial, sans-serif;
    direction: rtl;
    background: ${C.white};
    color: ${C.text};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-size: 11px;
  }
  /* A4 portrait pages */
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 14mm 0;
    background: ${C.white};
    page-break-after: always;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .page:last-child { page-break-after: auto; }
  /* Remove old ph styles */
  .ph { display:none; }

  /* Site header (replicates the real dashboard header) */
  .site-header {
    display: flex; align-items: center; justify-content: space-between;
    background: #fff9fa; padding: 10px 14px 10px 14px;
    border-bottom: 3px solid ${C.pink};
    margin: -12mm -14mm 10px -14mm; /* bleed to page edges */
  }
  .site-header-left { display: flex; align-items: center; gap: 10px; }
  .site-header-icon {
    width: 44px; height: 44px; background: ${C.pink};
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .site-header-icon svg { width: 32px; height: 32px; }
  .site-header-title { font-size: 15px; font-weight: 900; color: ${C.text}; }
  .site-header-sub { font-size: 9px; color: ${C.muted}; margin-top: 1px; }
  .site-header-logo { height: 48px; object-fit: contain; }

  /* Page section title (tab name as page subtitle) */
  .page-title-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px; padding-bottom: 6px;
    border-bottom: 1px solid ${C.border};
  }
  .page-title { font-size: 13px; font-weight: 700; color: ${C.text}; }
  .page-badge {
    background: ${C.pink}; color: #fff;
    font-size: 9px; font-weight: 700;
    padding: 2px 9px; border-radius: 20px;
  }

  /* KPI strip */
  .kpi-strip { display: flex; gap: 6px; margin-bottom: 8px; }
  .kpi-box {
    flex: 1; background: ${C.bg};
    border: 1px solid ${C.border}; border-radius: 8px;
    padding: 8px 6px; text-align: center;
  }
  .kpi-val { font-size: 22px; font-weight: 900; line-height: 1.1; }
  .kpi-lbl { font-size: 9px; color: ${C.muted}; margin-top: 2px; }

  /* Section title */
  .sec { font-size: 11px; font-weight: 700; color: ${C.blue};
    margin: 8px 0 5px;
    padding-right: 7px; border-right: 3px solid ${C.blue};
  }

  /* Two columns */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }

  /* Horizontal bar rows */
  .bar-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .bar-lbl { width: 80px; text-align: right; flex-shrink: 0; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-lbl-wide { width: 110px; }
  .bar-track { flex: 1; background: ${C.border}; border-radius: 3px; height: 10px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .bar-cnt { width: 24px; text-align: left; font-size: 9px; color: ${C.muted}; flex-shrink: 0; }

  /* Card box */
  .card {
    background: ${C.bg}; border: 1px solid ${C.border};
    border-radius: 8px; padding: 8px 10px;
  }

  /* Chip grid for undecided companies */
  .chip-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-top: 4px; }
  .chip {
    background: ${C.white}; border: 1px solid ${C.border};
    border-radius: 5px; padding: 5px 4px;
    font-size: 9px; text-align: center; line-height: 1.3;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }

  /* Process step rows */
  .ps-row { display: flex; align-items: center; gap: 5px; padding: 2px 0; border-bottom: 1px solid ${C.border}; }
  .ps-lbl { flex: 1; font-size: 9.5px; }
  .ps-track { width: 80px; background: ${C.border}; border-radius: 2px; height: 7px; flex-shrink: 0; }
  .ps-fill { height: 100%; border-radius: 2px; }
  .ps-pct { width: 26px; text-align: left; font-size: 9px; color: ${C.muted}; flex-shrink: 0; }

  /* Phase header */
  .phase-hdr { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; margin: 7px 0 3px; }
  .phase-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* Page footer */
  .page-content { flex: 1; padding-bottom: 8px; }
  .page-footer {
    margin: 0 -14mm;
    padding: 5px 14mm;
    background: ${C.pink};
    display: flex; align-items: center; justify-content: flex-end; gap: 6px;
    direction: rtl;
  }
  .page-footer-text {
    font-size: 8px; color: rgba(255,255,255,0.9); font-weight: 500; letter-spacing: 0.3px;
  }
  .page-footer svg { width: 22px; height: 22px; flex-shrink: 0; }

  @media print {
    body { background: ${C.white}; }
    .page { box-shadow: none; }
    @page { size: A4 portrait; margin: 0; }
  }
`

// ── Process step labels (matching the dashboard) ──────────────────────────────
const PROCESS_STEP_LABELS = {
  // Learning phase
  industryReview:            'סקירת ענף',
  surveyDesign:              'עיצוב סקר',
  participantRecruitment:    'גיוס משתתפים',
  barrierMapping:            'מיפוי חסמים',
  surveyDistribution:        'הפצת סקר',
  responseCollection:        'איסוף תגובות',
  expertRecruitment:         'גיוס מומחים',
  recommendationsReport:     'דוח המלצות',
  userTesting:               'בדיקת משתמשים',
  socialPartnerRecruitment:  'גיוס שותפים חברתיים',
  developmentRecommendations:'המלצות פיתוח',
  // Development phase
  presentRecommendations:    'הצגת המלצות',
  productDecision:           'החלטת מוצר',
  ganttCreation:             'בניית גאנט',
  processCompletion:         'השלמת תהליך',
  solutionValidation:        'ולידציית פתרון',
  productImplementation:     'יישום מוצר',
  // Marketing phase
  influencerSharing:         'שיתוף משפיענים',
  digitalMarketing:          'שיווק דיגיטלי',
  pressReleaseDraft:         'טיוטת הודעה לעיתונות',
  pressReleaseApproval:      'אישור הודעה לעיתונות',
  websiteUpdate:             'עדכון אתר',
  exposureData:              'נתוני חשיפה',
}

const PHASES = [
  { key: 'learning',     label: 'שלב למידה',     color: C.blue   },
  { key: 'development',  label: 'שלב פיתוח',     color: C.green  },
  { key: 'marketing',    label: 'שלב שיווק',     color: C.yellow },
]

// ── Compute process stats from companies ──────────────────────────────────────
function computeProcessStats(companies) {
  const stats = {}
  for (const phase of PHASES) {
    stats[phase.key] = {}
    for (const company of companies) {
      const phaseData = company.process?.[phase.key]
      if (!phaseData) continue
      for (const [step, val] of Object.entries(phaseData)) {
        if (!stats[phase.key][step]) stats[phase.key][step] = { yes: 0, total: 0 }
        if (val !== null) {
          stats[phase.key][step].total++
          if (val === 'כן') stats[phase.key][step].yes++
        }
      }
    }
  }
  return stats
}

// ── SVG donut chart helper ────────────────────────────────────────────────────
// segments: [{ value, color, label }], size in px, thickness in px
function svgDonut(segments, size = 120, thickness = 26) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size / 2) - thickness / 2
  const cx = size / 2, cy = size / 2
  const circ = 2 * Math.PI * r

  let paths = ''
  let angle = -Math.PI / 2  // start at top

  for (const seg of segments) {
    const frac = seg.value / total
    const sweep = frac * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    const x2 = cx + r * Math.cos(angle + sweep)
    const y2 = cy + r * Math.sin(angle + sweep)
    const large = sweep > Math.PI ? 1 : 0
    if (frac > 0) {
      paths += `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}"
        fill="none" stroke="${seg.color}" stroke-width="${thickness}" stroke-linecap="butt"/>`
    }
    angle += sweep
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.border}" stroke-width="${thickness}"/>
    ${paths}
  </svg>`
}

// ── Industry grouping (matches IndustryChart.jsx) ─────────────────────────────
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

// ── Build PDF HTML (two pages, A4 portrait) ───────────────────────────────────
function buildPdfHTML(d, companies) {
  const processStats = computeProcessStats(companies)

  // ── Pipeline bars ─────────────────────────────────────────────────────────
  const maxPipeline = d.pipeline.emailSent || 1
  const pipelineSteps = [
    { label: 'מייל נשלח',  value: d.pipeline.emailSent,       color: C.blue    },
    { label: 'פגישה',       value: d.pipeline.meetings,        color: C.green   },
    { label: 'הסכם נשלח',  value: d.pipeline.agreementSent,   color: C.yellow  },
    { label: 'הסכם חתום',  value: d.pipeline.agreementsSigned,color: C.pink    },
    { label: 'שולם',        value: d.pipeline.paid,            color: C.pinkDark},
  ]

  // ── Horizontal bar helper ─────────────────────────────────────────────────
  const hbar = (label, value, max, color, lblWidth = '90px') => `
    <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
      <div style="width:${lblWidth};text-align:right;flex-shrink:0;font-size:9.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${label}">${label}</div>
      <div style="flex:1;background:${C.border};border-radius:3px;height:10px;overflow:hidden;">
        <div style="width:${Math.round((value / max) * 100)}%;height:100%;border-radius:3px;background:${color};"></div>
      </div>
      <div style="width:20px;text-align:left;font-size:9px;color:${C.muted};flex-shrink:0;">${value}</div>
    </div>`

  // ── Status donut ──────────────────────────────────────────────────────────
  const statusColors = { 'כן': C.green, 'לא': C.pink, 'טרם הוחלט': C.yellow }
  const statusSegs = Object.entries(d.statusCounts).map(([k, v]) => ({ value: v, color: statusColors[k] || C.muted, label: k }))
  const statusDonut = svgDonut(statusSegs, 100, 26)
  const statusLegend = Object.entries(d.statusCounts).map(([k, v]) => {
    const pct = d.total ? Math.round((v / d.total) * 100) : 0
    return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${statusColors[k] || C.muted};flex-shrink:0;"></div>
      <span style="font-size:9.5px;">${k}</span>
      <span style="font-size:9px;color:${C.muted};margin-right:auto;">${v} (${pct}%)</span>
    </div>`
  }).join('')

  // ── Industry grouped + colored bars (vertical list, colorful) ────────────
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
      <div style="flex:1;background:${C.border};border-radius:4px;height:14px;overflow:hidden;position:relative;">
        <div style="width:${barPct}%;height:100%;border-radius:4px;background:${color};display:flex;align-items:center;justify-content:flex-end;padding-left:4px;">
          <span style="font-size:9px;font-weight:700;color:#fff;">${total}</span>
        </div>
      </div>
      <div style="width:32px;text-align:right;font-size:8.5px;color:${C.muted};flex-shrink:0;">${joined} הצ׳ (${joinedPct}%)</div>
    </div>`
  }).join('')

  // ── Referral donut ────────────────────────────────────────────────────────
  const referralCounts = {}
  companies.forEach(c => {
    if (c.referralSource1) referralCounts[c.referralSource1] = (referralCounts[c.referralSource1] || 0) + 1
    if (c.referralSource2) referralCounts[c.referralSource2] = (referralCounts[c.referralSource2] || 0) + 1
  })
  const referralEntries = Object.entries(referralCounts).sort((a, b) => b[1] - a[1])
  const referralTotal = referralEntries.reduce((s, [, v]) => s + v, 0)
  const referralSegs = referralEntries.map(([k, v], i) => ({ value: v, color: REFERRAL_COLORS[i % REFERRAL_COLORS.length], label: k }))
  const referralDonut = svgDonut(referralSegs, 110, 28)
  const referralLegend = referralEntries.map(([k, v], i) => {
    const pct = referralTotal ? Math.round((v / referralTotal) * 100) : 0
    return `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px;">
      <div style="width:8px;height:8px;border-radius:50%;background:${REFERRAL_COLORS[i % REFERRAL_COLORS.length]};flex-shrink:0;"></div>
      <span style="font-size:9px;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${k}</span>
      <span style="font-size:9px;color:${C.muted};flex-shrink:0;">${v} (${pct}%)</span>
    </div>`
  }).join('')

  // ── Size donut ────────────────────────────────────────────────────────────
  const sizeOrder = ['גלובלית','גדולה','בינונית','קטנה']
  const sizeColors = { 'גלובלית': C.blue, 'גדולה': C.green, 'בינונית': C.yellow, 'קטנה': C.pink }
  const sizeEntries = sizeOrder.filter(s => d.sizeCounts[s]).map(s => [s, d.sizeCounts[s]])
  const maxSize = Math.max(...sizeEntries.map(([,v]) => v), 1)

  // ── Engagement pyramid (5 levels) ────────────────────────────────────────
  const pyramidLevels = [
    { label: 'לקוחות משלמים',    count: companies.filter(c => c.paid).length,                                            color: '#70bdb3' },
    { label: 'בדרך להצטרפות',   count: companies.filter(c => !c.paid && c.agreementSent).length,                         color: '#a0d4cf' },
    { label: 'אחרי פגישה',       count: companies.filter(c => !c.agreementSent && c.meetingHeld).length,                  color: '#e9ab56' },
    { label: 'מייל בלבד',         count: companies.filter(c => !c.meetingHeld && c.emailSent).length,                     color: '#e8969f' },
    { label: 'טרם פנינו',         count: companies.filter(c => !c.emailSent).length,                                      color: '#f0dde0' },
  ]
  const maxPyramid = companies.length || 1
  const pyramidRows = pyramidLevels.map((lv, i) => {
    const pct = Math.max(15, Math.round((lv.count / maxPyramid) * 100))
    const textColor = i < 3 ? '#fff' : C.text
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:88px;text-align:right;font-size:9px;flex-shrink:0;">${lv.label}</div>
      <div style="flex:1;height:18px;border-radius:3px;overflow:hidden;position:relative;background:${C.border};">
        <div style="width:${pct}%;height:100%;background:${lv.color};display:flex;align-items:center;justify-content:center;">
          <span style="font-size:9px;font-weight:700;color:${textColor};">${lv.count}</span>
        </div>
      </div>
    </div>`
  }).join('')

  // ── Cohort analysis ───────────────────────────────────────────────────────
  const cohortMap = {}
  companies.filter(c => c.status === 'כן').forEach(c => {
    const key = !c.cohort ? 'לא משויך' : c.cohort <= 1 ? '2021' : c.cohort === 2 ? '2022' : c.cohort === 3 ? '2023' : '2024+'
    if (!cohortMap[key]) cohortMap[key] = []
    cohortMap[key].push(c)
  })
  const phaseSteps = { learning: 11, development: 6, marketing: 6 }
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
    const totalPct = bars.reduce((s, b) => s + b.pct, 0) / 3
    return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
      <div style="width:40px;text-align:right;font-size:9px;font-weight:700;flex-shrink:0;">${cohort}</div>
      <div style="flex:1;height:16px;border-radius:3px;overflow:hidden;display:flex;background:${C.border};">
        ${bars.map(b => b.pct > 0 ? `<div style="width:${b.pct/3}%;height:100%;background:${b.color};" title="${b.label}: ${b.pct}%"></div>` : '').join('')}
      </div>
      <div style="font-size:8.5px;color:${C.muted};width:28px;flex-shrink:0;">${cos.length} חב׳</div>
    </div>
    <div style="display:flex;gap:3px;margin-bottom:6px;padding-right:45px;">
      ${bars.map(b => `<span style="font-size:7.5px;color:${b.color};">● ${b.label} ${b.pct}%</span>`).join('<span style="font-size:7.5px;color:#ccc;"> | </span>')}
    </div>`
  }).join('')

  // ── Undecided chips with logos ────────────────────────────────────────────
  const undecidedItems = d.undecidedItems || (d.undecidedList || []).map(name => ({ id: null, name }))
  const chips = undecidedItems.length
    ? undecidedItems.map(({ id, name }) => {
        const logoPath = id ? join(PUBLIC_DIR, 'logos', `${id}.png`) : null
        let logoTag = ''
        if (logoPath && existsSync(logoPath)) {
          const logoBuf = readFileSync(logoPath)
          const logoB64 = `data:image/png;base64,${logoBuf.toString('base64')}`
          logoTag = `<img src="${logoB64}" style="height:16px;width:20px;object-fit:contain;flex-shrink:0;" alt="">`
        } else {
          logoTag = `<div style="width:20px;height:16px;flex-shrink:0;"></div>`
        }
        return `<div style="display:flex;align-items:center;gap:4px;padding:2px 4px;background:${C.white};border:1px solid ${C.border};border-radius:4px;">
          ${logoTag}
          <div style="font-size:8px;line-height:1.2;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">${name}</div>
        </div>`
      }).join('')
    : `<div style="font-size:9px;color:${C.muted};">אין חברות</div>`

  // ── Process phases — all 3 in sequence ───────────────────────────────────
  const allPhasesHTML = PHASES.map(phase => {
    const phaseStats = processStats[phase.key] || {}
    const steps = Object.entries(phaseStats).filter(([, s]) => s.total > 0)
    if (!steps.length) return ''
    return `
      <div style="margin-bottom:8px;">
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

  // ── Shared footer (pink bar + Q-BT logo) ─────────────────────────────────
  const pageFooter = `
  <div class="page-footer">
    <span class="page-footer-text">עיבוד והצגת הנתונים בשיתוף</span>
    ${LOGO_QBT_WHITE ? `<img src="${LOGO_QBT_WHITE}" style="height:22px;width:auto;object-fit:contain;flex-shrink:0;" alt="Q-BT">` : ''}
  </div>`

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<title>דו"ח שווה פיתוח</title>
<style>${sharedStyles}</style>
</head>
<body>

<!-- ═══ PAGE 1: ריכוז מידע ═══ -->
<div class="page">

  <!-- Site header — mirrors real dashboard -->
  <div class="site-header">
    <div class="site-header-left">
      <div class="site-header-icon">
        <svg viewBox="0 0 58 56" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </svg>
      </div>
      <div>
        <div class="site-header-title">פרויקט שווה פיתוח | תמונת מצב</div>
        <div class="site-header-sub">מיזם להתאמת מוצרים ושירותים לאנשים עם מוגבלות</div>
      </div>
    </div>
    ${LOGO_Z2000 ? `<img src="${LOGO_Z2000}" class="site-header-logo" alt="ציונות 2000">` : ''}
  </div>

  <div class="page-content">
  <!-- Page tab title -->
  <div class="page-title-bar">
    <div class="page-title">ריכוז מידע</div>
    <div style="font-size:9px;color:${C.muted};">${d.date}</div>
  </div>

  <!-- KPI row 1: 5 KPIs -->
  <div class="kpi-strip">
    <div class="kpi-box"><div class="kpi-val" style="color:${C.blue};">${d.total}</div><div class="kpi-lbl">חברות בליווי</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.green};">${d.joined}</div><div class="kpi-lbl">הצטרפו</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.yellow};">${d.meetings}</div><div class="kpi-lbl">פגישות</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.blue};">${d.agreementsSigned}</div><div class="kpi-lbl">הסכמים חתומים</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.pink};">${d.conversionRate}%</div><div class="kpi-lbl">אחוז המרה</div></div>
  </div>

  <!-- KPI row 2 -->
  <div class="kpi-strip" style="margin-bottom:10px;">
    <div class="kpi-box"><div class="kpi-val" style="color:${C.green};">${d.emailToMeetingRate}%</div><div class="kpi-lbl">מייל ← פגישה</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.blue};">${d.allSteps}</div><div class="kpi-lbl">5/5 שלבים</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.yellow};">${d.avgSteps}</div><div class="kpi-lbl">ממוצע שלבים</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.muted};">${d.undecided}</div><div class="kpi-lbl">טרם הוחלט</div></div>
    <div class="kpi-box"><div class="kpi-val" style="color:${C.pink};">${d.undecidedWithMeeting}</div><div class="kpi-lbl">טרם הוחלט + פגישה</div></div>
  </div>

  <!-- Row: Status donut + Pipeline -->
  <div style="display:grid;grid-template-columns:152px 1fr;gap:10px;margin-bottom:10px;">
    <!-- Status donut -->
    <div class="card" style="display:flex;flex-direction:column;align-items:center;padding:7px 8px;">
      <div class="sec" style="width:100%;margin-top:0;margin-bottom:4px;">התפלגות החלטות</div>
      <div style="margin:2px 0;">${statusDonut}</div>
      <div style="width:100%;margin-top:4px;">${statusLegend}</div>
    </div>
    <!-- Pipeline funnel bars -->
    <div class="card">
      <div class="sec" style="margin-top:0;">משפך גיוס</div>
      ${pipelineSteps.map(s => hbar(s.label, s.value, maxPipeline, s.color, '80px')).join('')}

      <!-- Engagement pyramid below pipeline -->
      <div class="sec" style="margin-top:8px;">מפגשים — פירמידת מעורבות</div>
      ${pyramidRows}
    </div>
  </div>

  <!-- Industry (left half) + Referral donut (right half) -->
  <div style="display:grid;grid-template-columns:1fr 165px;gap:10px;">
    <!-- Industry colorful bars -->
    <div class="card">
      <div class="sec" style="margin-top:0;">פילוח לפי ענף</div>
      ${industryBars}
    </div>
    <!-- Referral donut -->
    <div class="card" style="display:flex;flex-direction:column;align-items:center;padding:7px 8px;">
      <div class="sec" style="width:100%;margin-top:0;margin-bottom:4px;">ערוצי פנייה</div>
      <div style="margin:2px 0;">${referralDonut}</div>
      <div style="width:100%;margin-top:4px;">${referralLegend}</div>
    </div>
  </div>
  </div>${pageFooter}

</div>

<!-- ═══ PAGE 2: שלבי התהליך ═══ -->
<div class="page">

  <!-- Site header — mirrors real dashboard -->
  <div class="site-header">
    <div class="site-header-left">
      <div class="site-header-icon">
        <svg viewBox="0 0 58 56" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </svg>
      </div>
      <div>
        <div class="site-header-title">פרויקט שווה פיתוח | תמונת מצב</div>
        <div class="site-header-sub">מיזם להתאמת מוצרים ושירותים לאנשים עם מוגבלות</div>
      </div>
    </div>
    ${LOGO_Z2000 ? `<img src="${LOGO_Z2000}" class="site-header-logo" alt="ציונות 2000">` : ''}
  </div>

  <div class="page-content">
  <!-- Page tab title -->
  <div class="page-title-bar">
    <div class="page-title">שלבי התהליך</div>
    <div style="font-size:9px;color:${C.muted};">${d.date}</div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">

    <!-- Left: all 3 phases in sequence -->
    <div class="card">
      <div class="sec" style="margin-top:0;">שלבי התהליך — למידה, פיתוח, שיווק</div>
      ${allPhasesHTML}
    </div>

    <!-- Right column: cohort analysis + undecided chips -->
    <div style="display:flex;flex-direction:column;gap:10px;">

      <!-- Cohort analysis -->
      <div class="card" style="flex:0 0 auto;">
        <div class="sec" style="margin-top:0;color:${C.blue};border-color:${C.blue};">ניתוח קוהורטים</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;padding-right:45px;flex-wrap:wrap;">
          <span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.blue};"></span> למידה</span>
          <span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.green};"></span> פיתוח</span>
          <span style="font-size:8px;display:flex;align-items:center;gap:2px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.yellow};"></span> שיווק</span>
        </div>
        ${cohortRows || `<div style="font-size:9px;color:${C.muted};text-align:center;padding:8px 0;">אין נתוני קוהורט</div>`}
      </div>

      <!-- Engagement pyramid -->
      <div class="card" style="flex:0 0 auto;">
        <div class="sec" style="margin-top:0;color:${C.green};border-color:${C.green};">מפגשים — פירמידת מעורבות</div>
        ${pyramidRows}
      </div>

      <!-- Undecided + meeting chips -->
      <div class="card" style="flex:1;overflow:hidden;">
        <div class="sec" style="margin-top:0;color:${C.pink};border-color:${C.pink};">טרם הוחלט + פגישה (${d.undecidedList.length})</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;">${chips}</div>
      </div>

    </div>
  </div>
  </div>${pageFooter}

</div>

</body>
</html>`
}

// ── Build email HTML (compact, email-client safe) ─────────────────────────────
function buildEmailHTML(bodyHtml, d) {
  const kpiBox = (label, value, color) => `
    <td style="width:20%;padding:6px 4px;text-align:center;vertical-align:top;">
      <div style="background:#fff;border:1px solid ${C.border};border-radius:10px;padding:12px 6px;">
        <div style="font-size:22px;font-weight:900;color:${color};line-height:1;">${value}</div>
        <div style="font-size:10px;color:${C.muted};margin-top:4px;">${label}</div>
      </div>
    </td>`

  const sh = (title, color) =>
    `<h2 style="font-size:14px;font-weight:700;color:${color};margin:18px 0 8px;border-right:4px solid ${color};padding-right:10px;">${title}</h2>`

  const tr = (cols, isHeader = false, bg = '#fff') => {
    const tag = isHeader ? 'th' : 'td'
    const style = `padding:8px 10px;font-size:11px;color:${isHeader ? '#fff' : C.text};border-bottom:1px solid ${C.border};`
    return `<tr style="background:${isHeader ? C.blue : bg};">${cols.map(c => `<${tag} style="${style}">${c}</${tag}>`).join('')}</tr>`
  }
  const tbl = rows => `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${C.border};border-radius:8px;overflow:hidden;margin-bottom:8px;">${rows}</table>`

  const pipelineLabels  = ['מייל נשלח','פגישה','הסכם נשלח','הסכם חתום','שולם']
  const pipelineValues  = [d.pipeline.emailSent, d.pipeline.meetings, d.pipeline.agreementSent, d.pipeline.agreementsSigned, d.pipeline.paid]
  const statusRows = Object.entries(d.statusCounts).map(([s, v], i) => {
    const pct = d.total ? ((v / d.total) * 100).toFixed(1) : '0'
    return tr([s, v, `${pct}%`], false, i % 2 ? C.stripe : '#fff')
  }).join('')
  const industryRows = Object.entries(d.industryCounts).sort((a,b)=>b[1]-a[1])
    .map(([k,v],i) => tr([k,v], false, i%2 ? C.stripe : '#fff')).join('')
  const sizeRows = ['גלובלית','גדולה','בינונית','קטנה']
    .filter(s => d.sizeCounts[s])
    .map((s,i) => tr([s, d.sizeCounts[s]], false, i%2 ? C.stripe : '#fff')).join('')
  const undecidedHTML = d.undecidedList.length
    ? d.undecidedList.map(n => `<li style="padding:2px 0;font-size:11px;color:${C.text};">${n}</li>`).join('')
    : `<li style="font-size:11px;color:${C.muted};">אין חברות</li>`

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><title>דו"ח שווה פיתוח</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif;direction:rtl;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:20px 10px;">
<table width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,${C.pink} 0%,${C.pinkDark} 100%);padding:24px 28px;">
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:3px;">פרויקט שווה פיתוח</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.85);">דו"ח מצב | ${d.date}</div>
  </td></tr>
  <tr><td style="padding:24px 28px;background:${C.card};">
    ${bodyHtml ? `<div style="background:#fff;border:1px solid ${C.border};border-radius:10px;padding:14px 18px;margin-bottom:20px;font-size:12px;color:${C.text};line-height:1.7;">${bodyHtml}</div>` : ''}
    <p style="font-size:12px;color:${C.muted};margin-bottom:16px;">הדו"ח המלא מצורף כ-PDF. להלן תקציר:</p>
    ${sh('מדדים עיקריים', C.pink)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
      <tr>${kpiBox('חברות בליווי',d.total,C.blue)}${kpiBox('הצטרפו',d.joined,C.green)}${kpiBox('פגישות',d.meetings,C.yellow)}${kpiBox('הסכמים',d.agreementsSigned,C.blue)}${kpiBox('המרה',d.conversionRate+'%',C.pink)}</tr>
    </table>
    ${sh('התפלגות החלטות', C.blue)}
    ${tbl(tr(['סטטוס','חברות','אחוז'],true)+statusRows)}
    ${sh('משפך גיוס', C.green)}
    ${tbl(tr(['שלב','חברות'],true)+pipelineLabels.map((l,i)=>tr([l,pipelineValues[i]],false,i%2?C.stripe:'#fff')).join(''))}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
      <td width="48%" valign="top" style="padding-left:8px;">
        ${sh('לפי ענף', C.yellow)}
        ${tbl(tr(['ענף','חברות'],true)+industryRows)}
      </td>
      <td width="4%"></td>
      <td width="48%" valign="top">
        ${sh('לפי גודל', C.blue)}
        ${tbl(tr(['גודל','חברות'],true)+sizeRows)}
      </td>
    </tr></table>
    ${sh('טרם הוחלט + פגישה', C.pink)}
    <ul style="margin:0 0 20px;padding-right:20px;list-style:disc;">${undecidedHTML}</ul>
    <div style="margin-top:20px;padding-top:14px;border-top:1px solid ${C.border};font-size:10px;color:${C.muted};text-align:center;">
      נוצר אוטומטית על ידי לוח המחוונים של שווה פיתוח &bull; Q Behavioral Thinking
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

// ── Generate PDF from our own HTML template (no live server needed) ───────────
// Uses buildPdfHTML() to create a clean, self-contained Hebrew RTL report,
// then renders it to PDF via Puppeteer. No ApexCharts dependency.
async function generatePdf(reportData, companies) {
  const chromePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
  ]
  const executablePath = chromePaths.find(existsSync)
  if (!executablePath) throw new Error('Chrome not found. Install Google Chrome.')

  const html = buildPdfHTML(reportData, companies)

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const page = await browser.newPage()

    // Set content directly — no live server needed
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Wait for the Google Font to load (it's imported via @import in the style tag)
    await new Promise(r => setTimeout(r, 1500))

    const rawPdf = await page.pdf({
      format: 'A4',
      landscape: false,
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    })

    // Ensure we return a proper Node.js Buffer (Puppeteer v20+ returns Uint8Array)
    return Buffer.isBuffer(rawPdf) ? rawPdf : Buffer.from(rawPdf)

  } finally {
    await browser.close()
  }
}

// ── HTTP Server ───────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    cors(res); res.writeHead(204); res.end(); return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  try {
    // ── GET /health ──────────────────────────────────────────────────────────
    if (url.pathname === '/health' && req.method === 'GET') {
      jsonResponse(res, 200, { ok: true }); return
    }

    // ── POST /save-companies ─────────────────────────────────────────────────
    if (url.pathname === '/save-companies' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString())
      const { companies } = body
      if (!Array.isArray(companies)) {
        jsonResponse(res, 400, { error: 'companies must be an array' }); return
      }
      const json = JSON.stringify({ companies }, null, 2)
      await writeFile(COMPANIES_FILE, json, 'utf8')
      console.log(`  Saved ${companies.length} companies to companies.json`)
      jsonResponse(res, 200, { ok: true, count: companies.length }); return
    }

    // ── POST /download-pdf ───────────────────────────────────────────────────
    // Returns the PDF as application/pdf binary (for browser download)
    if (url.pathname === '/download-pdf' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString())
      const { companies } = body
      if (!Array.isArray(companies)) {
        jsonResponse(res, 400, { error: 'companies must be an array' }); return
      }

      // Build reportData server-side from companies array
      const total = companies.length
      const joined = companies.filter(c => c.paid).length
      const meetings = companies.filter(c => c.meetingHeld).length
      const agreementSent = companies.filter(c => c.agreementSent).length
      const agreementsSigned = companies.filter(c => c.agreementSigned).length
      const emailsSent = companies.filter(c => c.emailSent).length
      const conversionRate = emailsSent ? ((joined / emailsSent) * 100).toFixed(1) : '0.0'
      const emailToMeetingRate = emailsSent ? ((meetings / emailsSent) * 100).toFixed(1) : '0.0'
      const allSteps = companies.filter(c => c.emailSent && c.meetingHeld && c.agreementSent && c.agreementSigned && c.paid).length
      const yesCompanies = companies.filter(c => c.status === 'כן')
      const avgSteps = yesCompanies.length
        ? (yesCompanies.reduce((sum, c) => sum + [c.emailSent, c.meetingHeld, c.agreementSent, c.agreementSigned, c.paid].filter(Boolean).length, 0) / yesCompanies.length).toFixed(1)
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
      // Rich list with id for logo embedding
      const undecidedItems = companies.filter(c => c.status === 'טרם הוחלט' && c.meetingHeld).map(c => ({ id: c.id, name: c.name }))
      const date = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })

      const reportData = {
        total, joined, meetings, agreementsSigned, emailsSent,
        conversionRate, emailToMeetingRate, allSteps, avgSteps,
        undecided, undecidedWithMeeting,
        statusCounts, industryCounts, sizeCounts, pipeline, undecidedList, undecidedItems, date,
      }

      console.log('  Generating PDF for download...')
      const pdfBuffer = await generatePdf(reportData, companies)
      console.log(`  PDF ready (${Math.round(pdfBuffer.length / 1024)}KB)`)

      cors(res)
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shaveh-report.pdf"`,
        'Content-Length': pdfBuffer.length,
      })
      res.end(pdfBuffer)
      return
    }

    // ── POST /send-email ─────────────────────────────────────────────────────
    if (url.pathname === '/send-email' && req.method === 'POST') {
      if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_xxx')) {
        jsonResponse(res, 500, { error: 'RESEND_API_KEY לא מוגדר. ערוך את scripts/.env' }); return
      }

      const body = JSON.parse((await readBody(req)).toString())
      const { to, replyTo, subject, bodyHtml, reportData, companies } = body

      if (!to || !subject || !reportData) {
        jsonResponse(res, 400, { error: 'Missing required fields: to, subject, reportData' }); return
      }

      // 1. Generate PDF from our HTML template
      console.log('  Generating PDF from HTML template...')
      const pdfBuffer = await generatePdf(reportData, companies)
      const pdfBase64 = pdfBuffer.toString('base64')
      console.log(`  PDF generated (${Math.round(pdfBuffer.length / 1024)}KB)`)

      // 2. Build email HTML
      const emailHtml = buildEmailHTML(bodyHtml || '', reportData)

      // 3. Send via Resend
      const payload = {
        from: RESEND_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html: emailHtml,
        attachments: [{
          filename: `shaveh-report-${reportData.date.replace(/\s/g, '-')}.pdf`,
          content: pdfBase64,
        }],
      }
      if (replyTo && replyTo.trim()) payload.reply_to = replyTo.trim()

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      if (!response.ok) {
        console.error('  Resend error:', result)
        jsonResponse(res, 500, { error: result.message || 'שגיאה בשליחת המייל' }); return
      }

      console.log(`  Email + PDF sent to ${to} — Resend ID: ${result.id}`)
      jsonResponse(res, 200, { ok: true, id: result.id }); return
    }

    jsonResponse(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('Server error:', err)
    jsonResponse(res, 500, { error: err.message })
  }
})

server.listen(PORT, () => {
  console.log(`\n  Companies Save Server running on http://localhost:${PORT}`)
  console.log(`  Saving to: ${COMPANIES_FILE}`)
  console.log(`  Resend FROM: ${RESEND_FROM}\n`)
})
