#!/usr/bin/env node
/**
 * Tiny local server for the Admin Logo Picker.
 * Runs alongside Vite dev server.
 *
 * Endpoints:
 *   POST /save-logo      — saves a logo image to public/logos/{id}.png
 *   POST /save-logo-bulk  — saves multiple logos at once
 *   GET  /saved-logos     — returns list of company IDs that have saved logos
 *   GET  /health          — health check
 *
 * Usage:
 *   node scripts/logo-save-server.mjs
 *   (runs on port 3456)
 */

import { createServer } from 'http'
import { writeFile, readdir, stat, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const LOGOS_DIR = join(PROJECT_ROOT, 'public', 'logos')
const CANDIDATES_DIR = join(LOGOS_DIR, 'candidates')

const PORT = 3456

// Ensure logos directory exists
if (!existsSync(LOGOS_DIR)) {
  await mkdir(LOGOS_DIR, { recursive: true })
}

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

async function getSavedLogos() {
  try {
    const entries = await readdir(LOGOS_DIR)
    const saved = []
    for (const entry of entries) {
      if (entry === 'candidates') continue
      if (entry.endsWith('.png')) {
        saved.push(entry.replace('.png', ''))
      }
    }
    return saved
  } catch {
    return []
  }
}

async function fetchUrlToBuffer(url) {
  // Server-side fetch — no CORS restrictions
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    redirect: 'follow',
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const arrayBuf = await resp.arrayBuffer()
  return Buffer.from(arrayBuf)
}

async function saveLogo(companyId, imageData) {
  // imageData can be:
  // 1. A base64 data URL (from canvas or file reader)
  // 2. A reference to a candidate file { candidateFile: "favicon.png" }
  // 3. A remote URL to fetch server-side { remoteUrl: "https://..." }

  const outPath = join(LOGOS_DIR, `${companyId}.png`)

  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    // Base64 data URL
    const base64 = imageData.split(',')[1]
    const buffer = Buffer.from(base64, 'base64')
    await writeFile(outPath, buffer)
    return true
  } else if (typeof imageData === 'object' && imageData.remoteUrl) {
    // Fetch URL server-side (no CORS issues)
    try {
      const buffer = await fetchUrlToBuffer(imageData.remoteUrl)
      if (buffer.length > 100) {
        await writeFile(outPath, buffer)
        return true
      }
    } catch (err) {
      console.error(`  Failed to fetch ${imageData.remoteUrl}: ${err.message}`)
      return false
    }
  } else if (typeof imageData === 'object' && imageData.candidateFile) {
    // Copy from candidates directory
    const srcPath = join(CANDIDATES_DIR, companyId, imageData.candidateFile)
    try {
      const srcStat = await stat(srcPath)
      if (srcStat.size > 0) {
        const { readFile } = await import('fs/promises')
        const data = await readFile(srcPath)
        await writeFile(outPath, data)
        return true
      }
    } catch {
      return false
    }
  }
  return false
}

const server = createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    cors(res)
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  try {
    // Health check
    if (url.pathname === '/health' && req.method === 'GET') {
      jsonResponse(res, 200, { ok: true })
      return
    }

    // List saved logos
    if (url.pathname === '/saved-logos' && req.method === 'GET') {
      const saved = await getSavedLogos()
      jsonResponse(res, 200, { saved })
      return
    }

    // Save single logo
    if (url.pathname === '/save-logo' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString())
      const { companyId, imageData } = body
      if (!companyId) {
        jsonResponse(res, 400, { error: 'Missing companyId' })
        return
      }
      const ok = await saveLogo(companyId, imageData)
      if (ok) {
        console.log(`  Saved logo: ${companyId}.png`)
        jsonResponse(res, 200, { ok: true, companyId })
      } else {
        jsonResponse(res, 500, { error: 'Failed to save' })
      }
      return
    }

    // Bulk save
    if (url.pathname === '/save-logo-bulk' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)).toString())
      const { items } = body  // [{ companyId, imageData }, ...]
      const results = []
      for (const item of items) {
        const ok = await saveLogo(item.companyId, item.imageData)
        results.push({ companyId: item.companyId, ok })
        if (ok) console.log(`  Saved logo: ${item.companyId}.png`)
      }
      jsonResponse(res, 200, { results })
      return
    }

    jsonResponse(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('Server error:', err)
    jsonResponse(res, 500, { error: err.message })
  }
})

server.listen(PORT, () => {
  console.log(`\n  Logo Save Server running on http://localhost:${PORT}`)
  console.log(`  Saving logos to: ${LOGOS_DIR}`)
  console.log(`  Reading candidates from: ${CANDIDATES_DIR}\n`)
})
