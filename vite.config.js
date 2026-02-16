import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, join } from 'path'
import { writeFile, readdir, stat, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'

const LOGOS_DIR = resolve(__dirname, 'public', 'logos')
const CANDIDATES_DIR = join(LOGOS_DIR, 'candidates')

// ── Logo save server-side helpers (replaces scripts/logo-save-server.mjs) ──

async function fetchUrlToBuffer(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    redirect: 'follow',
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const arrayBuf = await resp.arrayBuffer()
  return Buffer.from(arrayBuf)
}

async function saveLogo(companyId, imageData) {
  const outPath = join(LOGOS_DIR, `${companyId}.png`)

  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    const base64 = imageData.split(',')[1]
    const buffer = Buffer.from(base64, 'base64')
    await writeFile(outPath, buffer)
    return true
  } else if (typeof imageData === 'object' && imageData.remoteUrl) {
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
    const srcPath = join(CANDIDATES_DIR, companyId, imageData.candidateFile)
    try {
      const srcStat = await stat(srcPath)
      if (srcStat.size > 0) {
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

/** Vite plugin that adds logo-save API endpoints to the dev server */
function logoSavePlugin() {
  return {
    name: 'logo-save',
    configureServer(server) {
      // Ensure logos directory exists
      if (!existsSync(LOGOS_DIR)) {
        mkdir(LOGOS_DIR, { recursive: true })
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')

        // Health check
        if (url.pathname === '/api/logo/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true }))
          return
        }

        // List saved logos
        if (url.pathname === '/api/logo/saved-logos' && req.method === 'GET') {
          const saved = await getSavedLogos()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ saved }))
          return
        }

        // Save single logo
        if (url.pathname === '/api/logo/save-logo' && req.method === 'POST') {
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const body = JSON.parse(Buffer.concat(chunks).toString())
            const { companyId, imageData } = body
            if (!companyId) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing companyId' }))
              return
            }
            const ok = await saveLogo(companyId, imageData)
            if (ok) {
              console.log(`  Saved logo: ${companyId}.png`)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, companyId }))
            } else {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Failed to save' }))
            }
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        // Bulk save
        if (url.pathname === '/api/logo/save-logo-bulk' && req.method === 'POST') {
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const body = JSON.parse(Buffer.concat(chunks).toString())
            const { items } = body
            const results = []
            for (const item of items) {
              const ok = await saveLogo(item.companyId, item.imageData)
              results.push({ companyId: item.companyId, ok })
              if (ok) console.log(`  Saved logo: ${item.companyId}.png`)
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ results }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
          return
        }

        next()
      })

      console.log('\n  Logo Save API available at /api/logo/*')
      console.log(`  Saving logos to: ${LOGOS_DIR}`)
      console.log(`  Reading candidates from: ${CANDIDATES_DIR}\n`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), logoSavePlugin()],
  base: '/ZionismResilience/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'worth-it': resolve(__dirname, 'worth-it.html'),
        'admin-logo': resolve(__dirname, 'admin-logo.html'),
      },
    },
  },
})
