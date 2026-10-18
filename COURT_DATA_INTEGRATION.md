# Ohio Docket Hub — Court Data Integration Plan

## Current status
The React app currently uses fictional demonstration cases. No live Ohio county court sources are integrated. Do not imply statewide coverage, live monitoring, or guaranteed docket completeness.

## Integration contract
Use `src/courts/types.ts` for normalized court records and `src/courts/registry.ts` to register verified county/court adapters. Each adapter must identify the court and county, provide a direct source URL for each case, and return whether records are live. Never silently fall back to fictional results.

## Recommended implementation sequence
1. Select a pilot county and identify its official clerk docket access method.
2. Review the court's published terms, robots restrictions, rate limits, and available APIs or approved feeds.
3. Implement a secure server-side adapter (not a browser-side scraper), with request throttling, timeouts, caching, and error handling.
4. Normalize case number, court, county, case status, docket entries, source URL, and last-checked timestamp.
5. Show provenance, retrieval time, missing-record notices, and links to the official source.
6. Add automated tests with permitted fixture data; only then enable live search in the UI.
7. Implement accounts and server-side saved-case monitoring before enabling real email alerts.

## Privacy and accuracy
Respect sealed, expunged, restricted, juvenile, and otherwise nonpublic records. Do not fabricate court data or interpret an absent result as proof that a case does not exist. Treat docket updates as informational rather than legal advice.

## Build
Run `npm install` then `npm run build`. The repository needs a deployment workflow before a public site is available.
