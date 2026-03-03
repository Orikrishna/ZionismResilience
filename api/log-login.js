export const maxDuration = 10

function platform(ua = '') {
  if (!ua) return '—'
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return '📱 Mobile'
  if (/tablet/i.test(ua)) return '📟 Tablet'
  return '🖥️ Desktop'
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://orikrishna.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { role, userAgent } = req.body ?? {}
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const RESEND_FROM    = process.env.RESEND_FROM || 'onboarding@resend.dev'
  const NOTIFY_EMAIL   = process.env.NOTIFY_EMAIL

  // Silent no-op if not configured — never breaks login flow
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) return res.status(200).json({ ok: true })

  // IP — Vercel puts the real client IP in x-forwarded-for
  const ip = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || '—'

  // Geo — injected by Vercel's edge network automatically
  const city    = req.headers['x-vercel-ip-city']    ? decodeURIComponent(req.headers['x-vercel-ip-city'])    : null
  const region  = req.headers['x-vercel-ip-region']  ?? null
  const country = req.headers['x-vercel-ip-country'] ?? null
  const geo = [city, region, country].filter(Boolean).join(', ') || '—'

  const device = platform(userAgent)
  const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

  const row = (label, val) =>
    `<tr><td style="padding:6px 0;color:#888;width:90px;vertical-align:top">${label}</td><td style="padding:6px 0">${val}</td></tr>`

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [NOTIFY_EMAIL],
        subject: `כניסה ל-מיזם שווה פיתוח — ${role ?? 'לא ידוע'}`,
        html: `
<div dir="rtl" style="font-family:sans-serif;max-width:500px;padding:24px;background:#fff8f8;border-radius:10px;">
  <h2 style="color:#c0605a;margin-top:0;">כניסה חדשה למיזם שווה פיתוח</h2>
  <table style="width:100%;border-collapse:collapse;">
    ${row('תפקיד',  `<strong>${role ?? '—'}</strong>`)}
    ${row('זמן',    now)}
    ${row('מכשיר',  device)}
    ${row('IP',     ip)}
    ${row('מיקום',  geo)}
    ${row('דפדפן',  `<span style="font-size:11px;color:#666">${userAgent ?? '—'}</span>`)}
  </table>
</div>`,
      }),
    })
  } catch {
    // swallow — notification failure must never surface to the user
  }

  return res.status(200).json({ ok: true })
}
