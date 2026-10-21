/**
 * Adapter contract for Ohio Docket Hub (server side).
 *
 * This mirrors the app's TypeScript contracts in src/courts/types.ts and the
 * registry behavior in src/courts/registry.ts (repo: congenial-octo-couscous).
 * Keep the shapes identical so the frontend and server can swap data without
 * translation:
 *
 *   // src/courts/types.ts
 *   export type DocketEntry = {
 *     id: string; date: string; title: string;
 *     description?: string; sourceUrl?: string;
 *   };
 *   export type CourtCase = {
 *     id: string; caseNumber: string; title: string; county: string;
 *     court: string; status?: string; sourceUrl: string;
 *     lastCheckedAt?: string; entries: DocketEntry[];
 *   };
 *   export type SearchParams = { county: string; query: string; caseNumber?: string };
 *   export type SearchResult = {
 *     cases: CourtCase[]; source: string; retrievedAt: string; live: boolean;
 *   };
 *   export interface CourtAdapter {
 *     readonly county: string;
 *     readonly court: string;
 *     search(params: SearchParams): Promise<SearchResult>;
 *   }
 *
 * @typedef {Object} DocketEntry
 * @property {string} id
 * @property {string} date
 * @property {string} title
 * @property {string} [description]
 * @property {string} [sourceUrl]
 *
 * @typedef {Object} CourtCase
 * @property {string} id
 * @property {string} caseNumber
 * @property {string} title
 * @property {string} county
 * @property {string} court
 * @property {string} [status]
 * @property {string} sourceUrl
 * @property {string} [lastCheckedAt]
 * @property {DocketEntry[]} entries
 *
 * @typedef {Object} SearchParams
 * @property {string} county - County name, or 'All' for every registered adapter.
 * @property {string} query - Free-text query (party name, keywords).
 * @property {string} [caseNumber] - Optional exact/partial case number.
 *
 * @typedef {Object} SearchResult
 * @property {CourtCase[]} cases
 * @property {string} source - Adapter/source identifier that produced this result.
 * @property {string} retrievedAt - ISO 8601 timestamp.
 * @property {boolean} live - True only when the data came from a real court system.
 *
 * @typedef {Object} CourtAdapter
 * @property {string} county - County this adapter serves.
 * @property {string} court - Court this adapter serves.
 * @property {(params: SearchParams) => Promise<SearchResult>} search
 * @property {(id: string) => Promise<CourtCase|null>} [getCase] - Optional
 *   single-case lookup (server-side convenience; not part of the app's
 *   TypeScript CourtAdapter interface, which only requires search()).
 */

const { createDemoAdapter } = require('./demoAdapter');

/**
 * Create an adapter registry, mirroring src/courts/registry.ts:
 * - register() throws on a duplicate (county, court) pair.
 * - search() with county 'All' (or no county) queries every adapter;
 *   otherwise it queries only the adapter registered for that county.
 *
 * Server-side deviation (demo mode): the app starts with ZERO live adapters
 * (its registry is an empty array). This server always registers the demo
 * adapter as the fallback, so a search for a county with no live adapter is
 * answered by the demo adapter and clearly labeled live: false. When a real
 * county adapter is registered later, it takes over for that county.
 *
 * @param {CourtAdapter[]} [extraAdapters] - Real county adapters, if any.
 * @returns {{
 *   register: (adapter: CourtAdapter) => void,
 *   supportedCourts: () => Array<{county: string, court: string}>,
 *   hasLiveAdapters: () => boolean,
 *   search: (params: SearchParams) => Promise<SearchResult[]>,
 *   getCase: (county: string, id: string) => Promise<CourtCase|null>,
 * }}
 */
function createRegistry(extraAdapters = []) {
  /** @type {CourtAdapter[]} */
  const adapters = [];
  const demoAdapter = createDemoAdapter();

  function register(adapter) {
    if (adapters.some((a) => a.county === adapter.county && a.court === adapter.court)) {
      throw new Error('Court adapter already registered');
    }
    adapters.push(adapter);
  }

  for (const adapter of extraAdapters) register(adapter);

  function adapterFor(county) {
    return adapters.find((a) => a.county === county) || demoAdapter;
  }

  async function search(params) {
    const county = params.county || 'All';
    if (county === 'All') {
      const targets = adapters.length > 0 ? adapters : [demoAdapter];
      return Promise.all(targets.map((a) => a.search(params)));
    }
    return [await adapterFor(county).search(params)];
  }

  async function getCase(county, id) {
    const adapter = adapterFor(county || 'All');
    if (typeof adapter.getCase === 'function') return adapter.getCase(id);
    const result = await adapter.search({ county: county || 'All', query: '', caseNumber: id });
    return result.cases.find((c) => c.id === id || c.caseNumber === id) || null;
  }

  return {
    register,
    supportedCourts: () => [...adapters, demoAdapter].map(({ county, court }) => ({ county, court })),
    // Mirrors the app's hasLiveCourtSources(): true only when a real
    // (non-demo) adapter is registered.
    hasLiveAdapters: () => adapters.length > 0,
    search,
    getCase,
  };
}

module.exports = { createRegistry };
