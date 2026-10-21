/**
 * Smoke test for the Phase 1 demo server.
 *
 * Boots the server on an ephemeral port, then checks:
 *   1. GET /health
 *   2. GET /api/sources
 *   3. GET /api/search (demo adapter, Scioto county)
 *   4. Saved-cases round-trip: POST -> GET -> DELETE -> GET (gone)
 *
 * Prints PASS/FAIL per check and a final verdict.
 * Exits 0 on success, 1 on any failure.
 */

const { createServer } = require('./server');

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  console.log(`Smoke test against ${base}`);

  try {
    // 1. Health
    {
      const res = await fetch(`${base}/health`);
      const body = await res.json();
      check('GET /health returns 200', res.status === 200, `status ${res.status}`);
      check('health payload', body.status === 'ok' && body.service === 'ohio-docket-hub-server' && body.mode === 'demo', JSON.stringify(body));
    }

    // 2. Sources summary
    {
      const res = await fetch(`${base}/api/sources`);
      const body = await res.json();
      check('GET /api/sources returns 200', res.status === 200, `status ${res.status}`);
      check('sources count is 88', body.count === 88, `count ${body.count}`);
    }

    // 3. Search through the adapter registry (demo adapter)
    {
      const res = await fetch(`${base}/api/search?county=Scioto&q=`);
      const body = await res.json();
      const result = body.results && body.results[0];
      check('GET /api/search returns 200', res.status === 200, `status ${res.status}`);
      check('search returns a SearchResult', !!result && Array.isArray(result.cases), JSON.stringify(body).slice(0, 200));
      check('search is labeled not-live (demo)', result && result.live === false, `live=${result && result.live}`);
      const numbers = result ? result.cases.map((c) => c.caseNumber) : [];
      check(
        'Scioto demo cases present',
        numbers.includes('DEMO-2026-CR-0087') && numbers.includes('DEMO-2025-CV-0319'),
        numbers.join(', '),
      );
    }

    // 4. Saved-cases round-trip (create -> list -> delete -> list)
    const headers = { 'Content-Type': 'application/json', 'X-Demo-User': 'smoke-tester' };
    let savedId = null;
    {
      const res = await fetch(`${base}/api/saved-cases`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          county: 'Scioto',
          caseNumber: 'DEMO-2026-CR-0087',
          title: 'State v. Example',
          court: 'Court of Common Pleas',
          lastStatus: 'Open',
        }),
      });
      const body = await res.json();
      savedId = body.savedCase && body.savedCase.id;
      check('POST /api/saved-cases returns 201 with an id', res.status === 201 && !!savedId, `status ${res.status}`);
    }
    {
      const res = await fetch(`${base}/api/saved-cases`, { headers });
      const body = await res.json();
      const found = (body.savedCases || []).some((c) => c.id === savedId);
      check('GET /api/saved-cases lists the created case', res.status === 200 && found, JSON.stringify(body).slice(0, 200));
    }
    {
      const res = await fetch(`${base}/api/saved-cases/${savedId}`, { method: 'DELETE', headers });
      const body = await res.json();
      check('DELETE /api/saved-cases/:id deletes it', res.status === 200 && body.deleted === true, `status ${res.status}`);
    }
    {
      const res = await fetch(`${base}/api/saved-cases`, { headers });
      const body = await res.json();
      const stillThere = (body.savedCases || []).some((c) => c.id === savedId);
      check('case is gone after delete', res.status === 200 && !stillThere);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? 'VERDICT: PASS' : 'VERDICT: FAIL');
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  console.log('VERDICT: FAIL');
  process.exit(1);
});
