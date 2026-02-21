// Vercel serverless function — generates and returns the PDF report for direct download.

import { generatePdfBuffer, buildReportData } from './_pdf.js'

export const maxDuration = 60

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://orikrishna.github.io')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  const { companies } = req.body

  if (!Array.isArray(companies)) {
    res.status(400).json({ error: 'Missing required field: companies' })
    return
  }

  try {
    const reportData = buildReportData(companies)
    const pdfBuf = await generatePdfBuffer(reportData, companies)
    const filename = `דוח-שווה-${reportData.date}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`)
    res.setHeader('Content-Length', pdfBuf.length)
    res.status(200).end(pdfBuf)
  } catch (err) {
    console.error('PDF generation error:', err.message)
    res.status(500).json({ error: 'שגיאה ביצירת PDF: ' + err.message })
  }
}
