/**
 * Ohio Docket Hub — Phase 1 demo server.
 *
 * Zero-dependency Node.js service (stdlib `http` only, no npm packages).
 *
 * DEMO ONLY:
 * - Search is served by the demo adapter (fictional sample records,
 *   live: false). No real court system is contacted.
 * - Saved cases live in an in-memory Map: they vanish on restart.
 * - There is NO real authentication. The "user" is whatever the
 *   X-Demo-User header (or ?user= query param) says, defaulting to
 *   "demo-user". Real accounts arrive with Supabase Auth (see
 *   ../supabase/schema.sql) — do not expose this server publicly as-is.
 *
 * Routes:
 *   GET    /health
 *   GET    /api/sources
 *   GET    /api/search?county=&q=&caseNumber=
 *   POST   /api/saved-cases            (JSON body)
 *   GET    /api/saved-cases?user=
 *   DELETE /api/saved-cases/:id
 */

const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createRegistry } = require('./adapters/adapter');

const SERVICE_NAME = 'ohio-docket-hub-server';
const MODE = 'demo';
// The full 88-county directory lives in the app (src/courts/sources.ts,
// COURT_SOURCES). This server only reports a summary in Phase 1.
const COUNTY_DIRECTORY_COUNT = 88;

const registry = createRegistry();

/** In-memory saved-case store: userId -> Map<savedCaseId, savedCase>. */
const savedCasesByUser = new Map();

function storeFor(user) {
  if (!savedCasesByUser.has(user)) savedCasesByUser.set(user, new Map());
  return savedCasesByUser.get(user);
}

function demoUser(req, url) {
  return req.headers['x-demo-user'] || url.searchParams.get('user') || 'demo-user';
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    // Permissive CORS so the statically hosted app can call this server
    // during development. Tighten before any public deployment.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Demo-User',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error('Request body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method === 'GET' && path === '/health') {
    return sendJson(res, 200, { status: 'ok', service: SERVICE_NAME, mode: MODE });
  }

  if (req.method === 'GET' && path === '/api/sources') {
    return sendJson(res, 200, {
      count: COUNTY_DIRECTORY_COUNT,
      countiesWithLiveIntegration: 0,
      note: 'Summary only. The full 88-county directory of official court sources lives in the app (src/courts/sources.ts). No county has a live server integration yet.',
      supportedCourts: registry.supportedCourts(),
      retrievedAt: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && path === '/api/search') {
    const params = {
      county: url.searchParams.get('county') || 'All',
      query: url.searchParams.get('q') || '',
      caseNumber: url.searchParams.get('caseNumber') || undefined,
    };
    const results = await registry.search(params);
    // Mirrors the app's searchCourtRecords(): an array of SearchResult.
    return sendJson(res, 200, { results });
  }

  if (req.method === 'POST' && path === '/api/saved-cases') {
    const user = demoUser(req, url);
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
    if (!body.county || !body.caseNumber) {
      return sendJson(res, 400, { error: 'county and caseNumber are required' });
    }
    const now = new Date().toISOString();
    // Field names mirror public.saved_cases in ../supabase/schema.sql.
    const savedCase = {
      id: randomUUID(),
      userId: user,
      county: body.county,
      caseNumber: body.caseNumber,
      title: body.title || '',
      court: body.court || '',
      lastStatus: body.lastStatus || body.status || null,
      snapshot: body.snapshot || null,
      createdAt: now,
      updatedAt: now,
    };
    storeFor(user).set(savedCase.id, savedCase);
    return sendJson(res, 201, { savedCase });
  }

  if (req.method === 'GET' && path === '/api/saved-cases') {
    const user = demoUser(req, url);
    return sendJson(res, 200, { user, savedCases: [...storeFor(user).values()] });
  }

  const deleteMatch = path.match(/^\/api\/saved-cases\/(.+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const user = demoUser(req, url);
    const id = decodeURIComponent(deleteMatch[1]);
    const store = storeFor(user);
    if (!store.has(id)) {
      return sendJson(res, 404, { error: 'Saved case not found for this user', id });
    }
    store.delete(id);
    return sendJson(res, 200, { deleted: true, id });
  }

  return sendJson(res, 404, { error: 'Not found', path });
}

function createServer() {
  return http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      console.error(err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 8787;
  createServer().listen(port, () => {
    console.log(`${SERVICE_NAME} listening on http://localhost:${port} (mode: ${MODE})`);
  });
}

module.exports = { createServer };
