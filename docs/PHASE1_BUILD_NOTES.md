# Ohio Docket Hub — Phase 1 groundwork: build notes

Prepared 2026-10-21. Everything here is **staged, not committed** — nothing
was pushed to GitHub, and the live site is untouched.

## What was built

### `server/` — zero-dependency Node.js demo service

Pure Node.js standard library (`node:http`, `node:crypto`) — no npm
packages, nothing to install. Requires Node 18+.

| File | What it does |
| --- | --- |
| `server.js` | HTTP service. Routes below. Saved cases are kept in an **in-memory store (demo only — resets on restart)**. There is **no real authentication yet**: the "user" is the `X-Demo-User` header or `?user=` param, defaulting to `demo-user`. |
| `adapters/adapter.js` | The adapter contract as JSDoc typedefs mirroring the app's `src/courts/types.ts` (`CourtCase`, `DocketEntry`, `SearchParams`, `SearchResult`, `CourtAdapter`), plus `createRegistry()`. Mirrors `src/courts/registry.ts`: duplicate (county, court) registration throws; county `All` searches every adapter. |
| `adapters/demoAdapter.js` | Implements the contract with the app's three fictional sample cases (DEMO-2026-CV-0142, DEMO-2026-CR-0087, DEMO-2025-CV-0319), mapped into the `CourtCase` shape. Every result is labeled `live: false`. |
| `package.json` | `npm start` → `node server.js` (port 8787, or `$PORT`). No dependencies. |
| `smoke-test.js` | Boots the server on an ephemeral port and tests it end to end. |

Routes:

- `GET /health` → `{status: "ok", service: "ohio-docket-hub-server", mode: "demo"}`
- `GET /api/sources` → summary of the county directory (count: 88; the full
  directory lives in the app — this server intentionally does not duplicate it)
- `GET /api/search?county=&q=&caseNumber=` → searches through the adapter
  registry; responds `{results: [SearchResult, ...]}`, mirroring the app's
  `searchCourtRecords()`
- `POST /api/saved-cases` · `GET /api/saved-cases?user=` ·
  `DELETE /api/saved-cases/:id`

One deliberate deviation from the app: the app's registry starts empty (zero
live adapters). The server always registers the demo adapter as a fallback so
a search for a county with no live adapter still answers — clearly labeled
demo data. The first real county adapter registered will take over for its
county automatically.

Run it locally:

```bash
cd server
node server.js          # or: npm start
node smoke-test.js      # or: npm test
```

### `supabase/schema.sql` — draft database schema (not run anywhere yet)

Three tables in `public`, matching what the server and app will need:

- `profiles` — one row per signed-in user (`id` → Supabase Auth user).
- `saved_cases` — bookmarked cases, with a `snapshot` jsonb column that
  stores the last `CourtCase` payload.
- `alert_preferences` — per-user email-alert opt-in (default off).

Row-level security is enabled on all three, with select/insert/update/delete
policies that restrict every row to its owner (`auth.uid()`).

## Smoke-test result (actual run, 2026-10-21, Node v24.20.0)

```
Smoke test against http://127.0.0.1:41083
PASS GET /health returns 200
PASS health payload
PASS GET /api/sources returns 200
PASS sources count is 88
PASS GET /api/search returns 200
PASS search returns a SearchResult
PASS search is labeled not-live (demo)
PASS Scioto demo cases present
PASS POST /api/saved-cases returns 201 with an id
PASS GET /api/saved-cases lists the created case
PASS DELETE /api/saved-cases/:id deletes it
PASS case is gone after delete

12 passed, 0 failed
VERDICT: PASS
```

## What still needs Joyce (in order)

1. **Create the free Supabase project** (~2 minutes): go to supabase.com,
   sign in with GitHub, create a new project (free tier), pick a name and a
   database password (save the password somewhere safe).
2. **Run the schema**: in the new project, open the SQL Editor, paste the
   entire contents of `supabase/schema.sql`, and run it once.
3. **Share two values with Musie**: the project **URL** and the **anon key**
   (Project Settings → API). ⚠️ Do **not** share the **service-role key** —
   that one is a master key and stays private.
4. **Later — pick a free-tier server host** (Render, Fly.io, or Railway) and
   create an account there, so this demo server has a public home. No rush;
   this step only matters when the first county's data feed is approved and
   real adapters get built.

Until steps 1–3 happen, the server keeps running in demo mode: fictional
sample cases, in-memory saved cases, no real logins. The Scioto pilot work
(permission first, then a real adapter) is unaffected and still gated on the
clerk's reply.
