export const maxDuration = 10

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

  const now = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })

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
          <div dir="rtl" style="font-family:sans-serif;max-width:480px;padding:24px;background:#fff8f8;border-radius:10px;">
            <h2 style="color:#c0605a;margin-top:0;">כניסה חדשה למיזם שווה פיתוח</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#888;width:80px;">תפקיד</td><td style="padding:6px 0;font-weight:bold;">${role ?? '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">זמן</td><td style="padding:6px 0;">${now}</td></tr>
              <tr><td style="padding:6px 0;color:#888;vertical-align:top;">דפדפן</td><td style="padding:6px 0;font-size:12px;color:#555;">${userAgent ?? '—'}</td></tr>
            </table>
          </div>`,
      }),
    })
  } catch {
    // swallow — notification failure must never surface to the user
  }

  return res.status(200).json({ ok: true })
}
