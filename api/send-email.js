// Vercel serverless function — sends the Shaveh status report email via Resend
// No PDF attachment (Puppeteer not available on Vercel free tier).

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
}

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

  const pipelineLabels = ['מייל נשלח','פגישה','הסכם נשלח','הסכם חתום','שולם']
  const pipelineValues = [d.pipeline.emailSent, d.pipeline.meetings, d.pipeline.agreementSent, d.pipeline.agreementsSigned, d.pipeline.paid]
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

export default async function handler(req, res) {
  // CORS — allow GitHub Pages origin
  res.setHeader('Access-Control-Allow-Origin', 'https://orikrishna.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev'

  if (!RESEND_API_KEY) {
    res.status(500).json({ error: 'RESEND_API_KEY not configured' })
    return
  }

  const { to, replyTo, subject, bodyHtml, reportData } = req.body

  if (!to || !subject || !reportData) {
    res.status(400).json({ error: 'Missing required fields: to, subject, reportData' })
    return
  }

  const emailHtml = buildEmailHTML(bodyHtml || '', reportData)

  const payload = {
    from: RESEND_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html: emailHtml,
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
    res.status(500).json({ error: result.message || 'שגיאה בשליחת המייל' })
    return
  }

  res.status(200).json({ ok: true, id: result.id })
}
