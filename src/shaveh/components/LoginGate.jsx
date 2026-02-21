/**
 * LoginGate — wraps the entire app.
 *
 * Security model:
 *  - Password is stored as a SHA-256 hash (never plaintext in the bundle).
 *  - On login the browser hashes the input with SubtleCrypto and compares.
 *  - A session token (timestamp) is stored in localStorage with a 7-day TTL.
 *  - This stops casual visitors; it is NOT a substitute for server-side auth.
 *
 * To change the password:
 *   1. Run: node -e "require('crypto').createHash('sha256').update('NEWPASS').digest('hex')" | pbcopy
 *   2. Replace the HASH constant below.
 */

import { useState, useEffect } from 'react'

// SHA-256 of "welcome81"
const HASH = '0e878c789535075344221c2523e979fc9dc91ae166f1501aeb973345a27fbc97'
const SESSION_KEY = 'shaveh_session'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function isSessionValid() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { expiry } = JSON.parse(raw)
    return Date.now() < expiry
  } catch {
    return false
  }
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + TTL_MS }))
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  window.location.reload()
}

export default function LoginGate({ children }) {
  const [authed, setAuthed] = useState(isSessionValid)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Re-check on focus (in case session expired in another tab)
  useEffect(() => {
    const onFocus = () => { if (!isSessionValid()) setAuthed(false) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  if (authed) return children

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const hashed = await sha256(password)
      if (username.toLowerCase() === 'guest' && hashed === HASH) {
        saveSession()
        setAuthed(true)
      } else {
        setError('שם משתמש או סיסמה שגויים')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f9f2f3',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans Hebrew', Arial, sans-serif",
      direction: 'rtl',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 4px 32px rgba(232,150,159,0.18)',
        border: '1px solid #f0dde0',
        padding: '40px 36px 32px',
        width: 340, maxWidth: '90vw',
      }}>
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, background: '#e8969f',
            borderRadius: 14, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <svg viewBox="0 0 58 56" fill="none" width={38} height={38} xmlns="http://www.w3.org/2000/svg">
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
          <div style={{ fontSize: 17, fontWeight: 900, color: '#2d1f22' }}>פרויקט שווה פיתוח</div>
          <div style={{ fontSize: 11, color: '#9c7a82', marginTop: 3 }}>אנא התחבר כדי להמשיך</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#2d1f22', marginBottom: 4 }}>
            שם משתמש
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            placeholder="guest"
            required
            style={{
              width: '100%', padding: '9px 12px', marginBottom: 14,
              border: '1px solid #f0dde0', borderRadius: 8,
              fontSize: 13, color: '#2d1f22', background: '#fff9fa',
              outline: 'none', boxSizing: 'border-box', direction: 'ltr', textAlign: 'right',
            }}
          />

          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#2d1f22', marginBottom: 4 }}>
            סיסמה
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            style={{
              width: '100%', padding: '9px 12px', marginBottom: 6,
              border: `1px solid ${error ? '#e8969f' : '#f0dde0'}`, borderRadius: 8,
              fontSize: 13, color: '#2d1f22', background: '#fff9fa',
              outline: 'none', boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ fontSize: 11, color: '#d4687a', marginBottom: 10, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px', marginTop: 8,
              background: loading ? '#e8969f99' : '#e8969f',
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 10, color: '#c4a0a8' }}>
          שווה פיתוח | ציונות 2000 × Q-BT
        </div>
      </div>
    </div>
  )
}
