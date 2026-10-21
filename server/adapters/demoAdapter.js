/**
 * Demo adapter — fictional sample data only.
 *
 * Implements the CourtAdapter contract (see adapter.js) with the same three
 * sample cases the app shows in demo mode (src/main.tsx, `demoCases`),
 * mapped into the src/courts/types.ts `CourtCase` shape:
 *   CaseRecord.name   -> CourtCase.title
 *   CaseRecord.events -> CourtCase.entries (note -> description)
 *   CaseRecord.id     -> CourtCase.id and CourtCase.caseNumber
 * The UI-only fields `filed` and `category` have no CourtCase equivalent;
 * the filed date is preserved as the first docket entry's date.
 *
 * Every SearchResult from this adapter has live: false. Nothing here touches
 * a real court system.
 */

/** @type {import('./adapter').CourtCase[]} */
const SAMPLE_CASES = [
  {
    id: 'DEMO-2026-CV-0142',
    caseNumber: 'DEMO-2026-CV-0142',
    title: 'Sample v. Sample',
    county: 'Franklin',
    court: 'Court of Common Pleas',
    status: 'Open',
    sourceUrl: 'https://clerk.franklincountyohio.gov/Home/Top-Tasks/Case-Information-Online',
    entries: [
      { id: 'DEMO-2026-CV-0142-1', date: 'Oct 2, 2026', title: 'Complaint filed', description: 'Fictional sample docket entry.' },
      { id: 'DEMO-2026-CV-0142-2', date: 'Oct 16, 2026', title: 'Case management conference scheduled', description: 'Fictional sample docket entry.' },
    ],
  },
  {
    id: 'DEMO-2026-CR-0087',
    caseNumber: 'DEMO-2026-CR-0087',
    title: 'State v. Example',
    county: 'Scioto',
    court: 'Court of Common Pleas',
    status: 'Open',
    sourceUrl: 'https://sciotoclerk.com/online-records/',
    entries: [
      { id: 'DEMO-2026-CR-0087-1', date: 'Sep 18, 2026', title: 'Initial appearance', description: 'Fictional sample docket entry.' },
      { id: 'DEMO-2026-CR-0087-2', date: 'Oct 7, 2026', title: 'Pretrial hearing scheduled', description: 'Fictional sample docket entry.' },
    ],
  },
  {
    id: 'DEMO-2025-CV-0319',
    caseNumber: 'DEMO-2025-CV-0319',
    title: 'Example Properties v. Sample',
    county: 'Scioto',
    court: 'Municipal Court',
    status: 'Closed',
    sourceUrl: 'https://sciotoclerk.com/online-records/',
    entries: [
      { id: 'DEMO-2025-CV-0319-1', date: 'Nov 12, 2025', title: 'Case filed', description: 'Fictional sample docket entry.' },
      { id: 'DEMO-2025-CV-0319-2', date: 'Jan 9, 2026', title: 'Judgment entered', description: 'Fictional sample docket entry.' },
    ],
  },
];

/**
 * @returns {import('./adapter').CourtAdapter & { getCase: (id: string) => Promise<import('./adapter').CourtCase|null> }}
 */
function createDemoAdapter() {
  return {
    county: 'All',
    court: 'Demo data (fictional sample records)',

    /**
     * @param {import('./adapter').SearchParams} params
     * @returns {Promise<import('./adapter').SearchResult>}
     */
    async search(params) {
      const county = params.county || 'All';
      const query = (params.query || '').trim().toLowerCase();
      const caseNumber = (params.caseNumber || '').trim().toLowerCase();

      const cases = SAMPLE_CASES.filter((c) => {
        const matchesCounty = county === 'All' || c.county === county;
        const matchesQuery =
          !query ||
          `${c.caseNumber} ${c.title} ${c.county} ${c.court} ${c.status || ''}`.toLowerCase().includes(query);
        const matchesCaseNumber = !caseNumber || c.caseNumber.toLowerCase().includes(caseNumber);
        return matchesCounty && matchesQuery && matchesCaseNumber;
      });

      return {
        cases,
        source: 'demo-adapter',
        retrievedAt: new Date().toISOString(),
        live: false,
      };
    },

    /**
     * @param {string} id - Case id or case number.
     * @returns {Promise<import('./adapter').CourtCase|null>}
     */
    async getCase(id) {
      return SAMPLE_CASES.find((c) => c.id === id || c.caseNumber === id) || null;
    },
  };
}

module.exports = { createDemoAdapter, SAMPLE_CASES };
