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
      // Fallback to thumbnail URL if available (e.g. DDG proxy)
      if (imageData.fallbackUrl) {
        try {
          console.log(`  Trying fallback: ${imageData.fallbackUrl}`)
          const buffer = await fetchUrlToBuffer(imageData.fallbackUrl)
          if (buffer.length > 100) {
            await writeFile(outPath, buffer)
            return true
          }
        } catch (err2) {
          console.error(`  Fallback also failed: ${err2.message}`)
        }
      }
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

// ── Image search helpers (DuckDuckGo) ──

async function searchLogoImages(companyName) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  const query = `${companyName} logo`

  try {
    // Step 1: Get the vqd token from DuckDuckGo search page
    const searchPageRes = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      { headers: { 'User-Agent': UA } }
    )
    const searchHtml = await searchPageRes.text()

    // Extract the vqd token
    let vqd = null
    const vqdMatch = searchHtml.match(/vqd=["']([^"']+)["']/)
    if (vqdMatch) {
      vqd = vqdMatch[1]
    } else {
      const altMatch = searchHtml.match(/vqd=([\d-]+)/)
      if (altMatch) vqd = altMatch[1]
    }

    if (!vqd) {
      console.error('  Image search: could not extract vqd token')
      return []
    }

    // Step 2: Call the DuckDuckGo image JSON API
    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,,,&p=1`
    const apiRes = await fetch(apiUrl, {
      headers: {
        'User-Agent': UA,
        'Referer': 'https://duckduckgo.com/',
      },
    })
    const data = await apiRes.json()

    // data.results contains image objects with .image, .thumbnail, .title, .width, .height
    const results = (data.results || [])
      .filter(r => {
        // Skip tiny images
        if (r.width < 50 || r.height < 50) return false
        // Skip results that are obviously not logos
        const url = (r.image || '').toLowerCase()
        if (url.includes('flag') || url.includes('map')) return false
        return true
      })
      .slice(0, 3)
      .map((r, i) => ({
        url: r.thumbnail,           // thumbnail for preview (reliably proxied by DDG)
        originalUrl: r.image,       // full-size image for saving
        filename: `search_${i}.png`,
        source: 'image-search',
        title: r.title,
        width: r.width,
        height: r.height,
      }))

    return results
  } catch (err) {
    console.error(`  Image search error: ${err.message}`)
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

        // Image search (DuckDuckGo)
        if (url.pathname === '/api/logo/image-search' && req.method === 'POST') {
          try {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const body = JSON.parse(Buffer.concat(chunks).toString())
            const { companyName } = body
            if (!companyName) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing companyName' }))
              return
            }
            console.log(`  Image search: "${companyName} logo"`)
            const images = await searchLogoImages(companyName)
            console.log(`  Image search: found ${images.length} result(s)`)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ images }))
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message, images: [] }))
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
