/**
 * Full API smoke + contract checks. Spawns app.js on a random port, runs tests, exits.
 * Usage: node scripts/verify-api.js
 */

const { spawn } = require('child_process')
const http = require('http')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const PORT = 3100 + Math.floor(Math.random() * 500)
const BASE = `http://127.0.0.1:${PORT}`
const TOKEN = 'verify-token-' + Date.now()

let failed = 0

function fail(msg) {
  console.error('FAIL:', msg)
  failed++
}

function ok(msg) {
  console.log('ok:', msg)
}

async function request(method, urlPath, { headers = {}, body } = {}) {
  const url = new URL(urlPath, BASE)
  const opts = {
    method,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    headers: { ...headers },
  }
  const payload = body !== undefined ? Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)) : null
  if (payload) {
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json'
    opts.headers['Content-Length'] = String(payload.length)
  }

  return new Promise((resolve, reject) => {
    const req = http.request(opts, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        const ct = (res.headers['content-type'] || '').toLowerCase()
        let json = null
        if (ct.includes('application/json') && raw.length) {
          try {
            json = JSON.parse(raw)
          } catch (e) {
            json = { _parseError: String(e) }
          }
        }
        resolve({ status: res.statusCode, headers: res.headers, raw, json })
      })
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServer() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await request('GET', '/api/v1/confessions')
      if (r.status === 200 && r.json && Array.isArray(r.json.data)) return
    } catch (_) {
      /* not up yet */
    }
    await sleep(50)
  }
  throw new Error('Server did not become ready in time')
}

function assert(cond, msg) {
  if (!cond) fail(msg)
  else return true
}

async function main() {
  const child = spawn(process.execPath, ['app.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      DELETE_SECRET_TOKEN: TOKEN,
      ALLOWED_CATEGORIES: 'bug,deadline,imposter,vibe-code',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stderr.on('data', (d) => process.stderr.write(d))
  child.stdout.on('data', (d) => process.stdout.write(d))

  try {
    await waitForServer()
    ok('server ready')

    // --- GET list empty ---
    let r = await request('GET', '/api/v1/confessions')
    assert(r.status === 200, `list status ${r.status}`)
    assert(r.json.count === 0 && r.json.data.length === 0, 'list empty shape')

    // --- POST validations ---
    r = await request('POST', '/api/v1/confessions', { body: { text: 'hi', category: 'bug' } })
    assert(r.status === 201, `create 201 got ${r.status}`)
    assert(r.json.id === 1 && r.json.text === 'hi' && r.json.category === 'bug', 'create body')
    const id1 = r.json.id

    r = await request('POST', '/api/v1/confessions', { body: {} })
    assert(r.status === 400 && r.json && r.json.msg === 'need text', 'missing text field -> need text')

    r = await request('POST', '/api/v1/confessions', { body: { text: '', category: 'bug' } })
    assert(r.status === 400 && r.json && r.json.msg === 'need text', 'empty string -> need text')

    r = await request('POST', '/api/v1/confessions', { body: { text: [], category: 'bug' } })
    assert(r.status === 400 && r.raw === 'too short', 'empty array text -> too short plain text')

    r = await request('POST', '/api/v1/confessions', { body: { text: 'x'.repeat(500), category: 'bug' } })
    assert(r.status === 400 && r.json && r.json.error && r.json.error.includes('500'), 'text too big')

    r = await request('POST', '/api/v1/confessions', { body: { text: 'ok', category: 'nope' } })
    assert(r.status === 400 && r.raw === 'category not in stuff', 'bad category')

    r = await request('POST', '/api/v1/confessions', { body: { text: 'second', category: 'deadline' } })
    assert(r.status === 201 && r.json.id === 2, 'second create')

    // --- GET list ordering newest first ---
    r = await request('GET', '/api/v1/confessions')
    assert(r.json.count === 2, 'count 2')
    assert(r.json.data[0].text === 'second' && r.json.data[1].text === 'hi', 'newest first')

    // --- GET one ---
    r = await request('GET', `/api/v1/confessions/${id1}`)
    assert(r.status === 200 && r.json.text === 'hi', 'get one')

    r = await request('GET', '/api/v1/confessions/99999')
    assert(r.status === 404 && r.json.msg === 'not found', 'get one 404')

    r = await request('GET', '/api/v1/confessions/not-a-number')
    assert(r.status === 404, 'nan id -> 404')

    // --- Category ---
    r = await request('GET', '/api/v1/confessions/category/bug')
    assert(r.status === 200 && Array.isArray(r.json) && r.json.length === 1 && r.json[0].id === 1, 'category bug')

    r = await request('GET', '/api/v1/confessions/category/invalid')
    assert(r.status === 400 && r.json.msg === 'invalid category', 'invalid category param')

    // Category route must not steal "category" as id (regression)
    r = await request('GET', '/api/v1/confessions/category/deadline')
    assert(r.status === 200 && r.json.some((c) => c.id === 2), 'category path not captured as :id')

    // --- DELETE ---
    r = await request('DELETE', '/api/v1/confessions/1', {
      headers: { 'x-delete-token': 'wrong' },
    })
    assert(r.status === 403 && r.json.msg === 'no permission', 'delete wrong token')

    r = await request('DELETE', '/api/v1/confessions/1', {
      headers: { 'x-delete-token': TOKEN },
    })
    assert(r.status === 200 && r.json.msg === 'ok' && r.json.item.id === 1, 'delete ok')

    r = await request('DELETE', '/api/v1/confessions/1', {
      headers: { 'x-delete-token': TOKEN },
    })
    assert(r.status === 404 && r.json.msg === 'not found buddy', 'delete again 404')

    if (failed) {
      process.exitCode = 1
    } else {
      ok('all checks passed')
    }
  } finally {
    child.kill('SIGTERM')
    await sleep(200)
    if (!child.killed) child.kill('SIGKILL')
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
