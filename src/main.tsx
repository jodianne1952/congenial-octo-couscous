import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowUpRight, Bookmark, Check, ChevronDown, Clock3,
  ExternalLink, FileText, Landmark, MapPin, Menu, Search, SearchX,
  Settings2, ShieldCheck, Star, X,
} from 'lucide-react';
import { COURT_SOURCES } from './courts/sources';
import './style.css';

type CaseRecord = {
  id: string;
  name: string;
  county: string;
  court: string;
  status: string;
  filed: string;
  category: string;
  events: { date: string; title: string; note: string }[];
};

type Page = 'Search' | 'Official court links' | 'Saved cases' | 'Settings';

// Fictional records let people preview the interface without mistaking it for a live court feed.
const demoCases: CaseRecord[] = [
  {
    id: 'DEMO-2026-CV-0142', name: 'Sample v. Sample', county: 'Franklin',
    court: 'Court of Common Pleas', status: 'Open', filed: 'Oct 2, 2026',
    category: 'Civil', events: [
      { date: 'Oct 2, 2026', title: 'Complaint filed', note: 'Fictional sample docket entry.' },
      { date: 'Oct 16, 2026', title: 'Case management conference scheduled', note: 'Fictional sample docket entry.' },
    ],
  },
  {
    id: 'DEMO-2026-CR-0087', name: 'State v. Example', county: 'Scioto',
    court: 'Court of Common Pleas', status: 'Open', filed: 'Sep 18, 2026',
    category: 'Criminal', events: [
      { date: 'Sep 18, 2026', title: 'Initial appearance', note: 'Fictional sample docket entry.' },
      { date: 'Oct 7, 2026', title: 'Pretrial hearing scheduled', note: 'Fictional sample docket entry.' },
    ],
  },
  {
    id: 'DEMO-2025-CV-0319', name: 'Example Properties v. Sample', county: 'Scioto',
    court: 'Municipal Court', status: 'Closed', filed: 'Nov 12, 2025',
    category: 'Civil', events: [
      { date: 'Nov 12, 2025', title: 'Case filed', note: 'Fictional sample docket entry.' },
      { date: 'Jan 9, 2026', title: 'Judgment entered', note: 'Fictional sample docket entry.' },
    ],
  },
];

const pages: { name: Page; icon: typeof Search }[] = [
  { name: 'Search', icon: Search },
  { name: 'Official court links', icon: Landmark },
  { name: 'Saved cases', icon: Bookmark },
  { name: 'Settings', icon: Settings2 },
];

function readSavedCases(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem('ohio-docket-hub:saved-cases') || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function App() {
  const [page, setPage] = useState<Page>('Search');
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('All counties');
  const [category, setCategory] = useState('All case types');
  const [selected, setSelected] = useState<CaseRecord | null>(null);
  const [saved, setSaved] = useState<string[]>(readSavedCases);
  const [alertsEnabled, setAlertsEnabled] = useState(() => localStorage.getItem('ohio-docket-hub:alerts') === 'true');
  const [sourceQuery, setSourceQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const counties = useMemo(() => ['All counties', ...new Set(demoCases.map(item => item.county))], []);
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return demoCases.filter(item => {
      const matchesQuery = !normalizedQuery || `${item.id} ${item.name} ${item.county} ${item.court}`.toLowerCase().includes(normalizedQuery);
      const matchesCounty = county === 'All counties' || item.county === county;
      const matchesCategory = category === 'All case types' || item.category === category;
      const matchesPage = page !== 'Saved cases' || saved.includes(item.id);
      return matchesQuery && matchesCounty && matchesCategory && matchesPage;
    });
  }, [category, county, page, query, saved]);

  function toggleSaved(id: string) {
    const next = saved.includes(id) ? saved.filter(item => item !== id) : [...saved, id];
    setSaved(next);
    localStorage.setItem('ohio-docket-hub:saved-cases', JSON.stringify(next));
  }

  function navigate(nextPage: Page) {
    setPage(nextPage);
    setSelected(null);
    setMobileNavOpen(false);
  }

  function updateAlerts(checked: boolean) {
    setAlertsEnabled(checked);
    localStorage.setItem('ohio-docket-hub:alerts', String(checked));
  }

  const activeTitle = selected ? 'Case details' : page;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <span className="brand-mark"><Landmark size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">Ohio Docket Hub</span>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={20} /></button>
        </div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {pages.map(({ name, icon: Icon }) => (
            <button key={name} className={`nav-item ${page === name ? 'nav-item-active' : ''}`} onClick={() => navigate(name)}>
              <Icon size={18} strokeWidth={1.9} /><span>{name}</span>
              {name === 'Saved cases' && saved.length > 0 && <span className="nav-count">{saved.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={17} /><span>Your saved list stays on this device.</span></div>
          <div className="version-note">Prototype preview · Demo records</div>
        </div>
      </aside>

      {mobileNavOpen && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Ohio Docket Hub</span><span className="crumb-separator">/</span><strong>{activeTitle}</strong></div>
          <div className="topbar-right"><span className="demo-pill"><span className="status-dot" /> DEMO MODE</span></div>
        </header>

        <div className="content-wrap">
          <div className="data-banner"><span className="banner-symbol">i</span><p><strong>Prototype using fictional sample records.</strong> This app does not search live Ohio court dockets. Use official court websites to verify real case information.</p></div>

          {selected ? (
            <CaseDetails record={selected} isSaved={saved.includes(selected.id)} onBack={() => setSelected(null)} onToggleSaved={() => toggleSaved(selected.id)} />
          ) : page === 'Search' ? (
            <>
              <section className="page-heading">
                <div><div className="eyebrow">OHIO COURT RECORDS</div><h1>Find a court case</h1><p>Search the demo records or open a county’s official docket portal.</p></div>
              </section>
              <section className="search-panel" aria-label="Search demo cases">
                <label className="search-label" htmlFor="case-search">Search by name or case number</label>
                <div className="search-row">
                  <div className="search-input-wrap"><Search size={19} /><input id="case-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="For example, DEMO-2026-CV-0142" /></div>
                  <label className="select-wrap"><span className="sr-only">County</span><MapPin size={17} /><select value={county} onChange={event => setCounty(event.target.value)}>{counties.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></label>
                  <label className="select-wrap type-select"><span className="sr-only">Case type</span><FileText size={17} /><select value={category} onChange={event => setCategory(event.target.value)}><option>All case types</option><option>Civil</option><option>Criminal</option></select><ChevronDown size={16} /></label>
                </div>
                <div className="search-foot"><span><ShieldCheck size={15} /> Search is limited to fictional demo records</span><span className="result-count">{results.length} {results.length === 1 ? 'sample' : 'samples'}</span></div>
              </section>
              <section className="results-section">
                <div className="section-heading"><div><h2>Sample cases</h2><p>These examples demonstrate how case results will appear.</p></div><span className="sample-tag">FICTIONAL DATA</span></div>
                {results.length ? <div className="case-grid">{results.map(record => <CaseCard key={record.id} record={record} isSaved={saved.includes(record.id)} onOpen={() => setSelected(record)} onToggleSaved={() => toggleSaved(record.id)} />)}</div> : <EmptyState title="No sample cases found" text="Try another name, number, county, or case type." icon={<SearchX size={23} />} />}
              </section>
              <section className="official-cta"><div className="cta-icon"><Landmark size={21} /></div><div><h3>Looking for a real docket?</h3><p>Browse official court links and confirm records directly with the clerk.</p></div><button className="button-secondary" onClick={() => navigate('Official court links')}>View court links <ArrowUpRight size={16} /></button></section>
            </>
          ) : page === 'Official court links' ? (
            <section className="subpage">
              <div className="page-heading"><div><div className="eyebrow">SOURCE DIRECTORY</div><h1>Official court links</h1><p>Open court-provided records portals and verify case information with the clerk.</p></div></div>
              <div className="source-summary"><ShieldCheck size={18} /><p>Links below lead to external court websites. Availability and update timing vary by court. The hub does not import or monitor these records.</p></div>
              <section className="search-panel" aria-label="Find your county"><label className="search-label" htmlFor="county-search">Find your county</label><div className="search-input-wrap"><Search size={19} /><input id="county-search" value={sourceQuery} onChange={event => setSourceQuery(event.target.value)} placeholder="Start typing a county name — for example, Scioto" /></div></section>
              <div className="source-list">{COURT_SOURCES.filter(source => source.county.toLowerCase().includes(sourceQuery.trim().toLowerCase())).map(source => <article className="source-card" key={`${source.county}-${source.division}`}>
                <div className="source-icon"><Landmark size={20} /></div><div className="source-main"><div className="source-kicker">{source.county.toUpperCase()} COUNTY · {source.division.toUpperCase()}</div><h2>{source.name}</h2><p>{source.notes}</p>{source.clerkPhone && <p className="clerk-phone">Clerk’s office: <a href={`tel:${source.clerkPhone.replace(/[^0-9+]/g, '')}`}>{source.clerkPhone}</a></p>}<div className="source-links"><a className="button-primary" href={source.recordAccessUrl} target="_blank" rel="noopener noreferrer">Open records portal <ExternalLink size={15} /></a><a className="text-link" href={source.officialUrl} target="_blank" rel="noopener noreferrer">Court website <ArrowUpRight size={14} /></a></div></div>
                <span className="external-badge"><ExternalLink size={13} /> External site</span>
              </article>)}</div>
              <article className="source-card state-source"><div className="source-icon"><Landmark size={20} /></div><div className="source-main"><div className="source-kicker">STATEWIDE RESOURCE</div><h2>Supreme Court of Ohio</h2><p>Find statewide online services and court resources. Availability depends on the court and case type.</p><div className="source-links"><a className="button-primary" href="https://www.supremecourt.ohio.gov/online-services/" target="_blank" rel="noopener noreferrer">Browse online services <ExternalLink size={15} /></a></div></div><span className="external-badge"><ExternalLink size={13} /> External site</span></article>
              <div className="records-note"><strong>Before relying on a docket:</strong> Restricted, sealed, juvenile, and expunged matters may not be available online. A missing search result does not prove a case does not exist. Confirm deadlines and filings with the clerk.</div>
            </section>
          ) : page === 'Saved cases' ? (
            <section className="subpage"><div className="page-heading"><div><div className="eyebrow">ON THIS DEVICE</div><h1>Saved cases</h1><p>Keep demo case examples together for quick access.</p></div></div>
              {results.length ? <div className="case-grid">{results.map(record => <CaseCard key={record.id} record={record} isSaved onOpen={() => setSelected(record)} onToggleSaved={() => toggleSaved(record.id)} />)}</div> : <EmptyState title="No saved cases yet" text="Save a sample case from Search to see it here. Saved cases are stored only in this browser." icon={<Bookmark size={22} />} action={<button className="button-primary" onClick={() => navigate('Search')}>Browse sample cases <ArrowLeft size={15} /></button>} />}
            </section>
          ) : (
            <SettingsPage alertsEnabled={alertsEnabled} onAlertsChange={updateAlerts} savedCount={saved.length} />
          )}

          <footer className="page-footer"><span>Ohio Docket Hub · Prototype</span><span>Always verify records with the court clerk.</span></footer>
        </div>
      </main>
    </div>
  );
}

function CaseCard({ record, isSaved, onOpen, onToggleSaved }: { record: CaseRecord; isSaved: boolean; onOpen: () => void; onToggleSaved: () => void }) {
  return <article className="case-card"><div className="case-card-top"><span className="case-type"><FileText size={14} /> {record.category}</span><button className={`save-button ${isSaved ? 'save-button-active' : ''}`} onClick={onToggleSaved} aria-label={isSaved ? 'Remove saved case' : 'Save case'} title={isSaved ? 'Remove saved case' : 'Save case'}><Star size={17} fill={isSaved ? 'currentColor' : 'none'} /></button></div><button className="case-title-button" onClick={onOpen}><h3>{record.name}</h3><ArrowUpRight size={16} /></button><div className="case-number">{record.id}</div><div className="case-meta"><span><MapPin size={14} />{record.county} County</span><span><Landmark size={14} />{record.court}</span></div><div className="case-card-bottom"><span className={`case-status ${record.status === 'Open' ? 'status-open' : 'status-closed'}`}><span />{record.status}</span><button className="text-link" onClick={onOpen}>View timeline <ArrowUpRight size={14} /></button></div></article>;
}

function CaseDetails({ record, isSaved, onBack, onToggleSaved }: { record: CaseRecord; isSaved: boolean; onBack: () => void; onToggleSaved: () => void }) {
  return <section className="subpage detail-page"><button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Back to results</button><div className="detail-heading"><div><div className="eyebrow">FICTIONAL DEMO CASE</div><h1>{record.name}</h1><p>{record.id}</p></div><button className={`button-secondary ${isSaved ? 'saved-button' : ''}`} onClick={onToggleSaved}><Star size={16} fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? 'Saved' : 'Save case'}</button></div><div className="detail-facts"><div><span>COURT</span><strong>{record.county} County {record.court}</strong></div><div><span>CASE TYPE</span><strong>{record.category}</strong></div><div><span>STATUS</span><strong>{record.status}</strong></div><div><span>FILED</span><strong>{record.filed}</strong></div></div><div className="timeline-heading"><div><h2>Docket timeline</h2><p>Example events only — not official court entries.</p></div><span className="sample-tag">SAMPLE</span></div><div className="timeline">{record.events.map((event, index) => <div className="timeline-item" key={`${event.date}-${event.title}`}><div className="timeline-marker">{index === 0 ? <FileText size={15} /> : <Clock3 size={15} />}</div><div className="timeline-entry"><span>{event.date}</span><h3>{event.title}</h3><p>{event.note}</p></div></div>)}</div><div className="records-note"><strong>Important:</strong> The events above are invented examples. This prototype does not have access to the case record.</div></section>;
}

function EmptyState({ title, text, icon, action }: { title: string; text: string; icon: React.ReactNode; action?: React.ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action}</div>;
}

function SettingsPage({ alertsEnabled, onAlertsChange, savedCount }: { alertsEnabled: boolean; onAlertsChange: (value: boolean) => void; savedCount: number }) {
  return <section className="subpage"><div className="page-heading"><div><div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p>Manage this prototype’s local preferences.</p></div></div><div className="settings-card"><div className="settings-heading"><div className="settings-icon"><Settings2 size={19} /></div><div><h2>App preferences</h2><p>Changes are saved in this browser only.</p></div></div><div className="setting-row"><div className="setting-copy"><h3>Email alerts</h3><p>This preview cannot send email or monitor court records. This switch only saves a local preference.</p></div><label className="switch"><input type="checkbox" checked={alertsEnabled} onChange={event => onAlertsChange(event.target.checked)} /><span className="switch-track" /><span className="sr-only">Enable email alert preference</span></label></div><div className="setting-row"><div className="setting-copy"><h3>Saved demo cases</h3><p>{savedCount} {savedCount === 1 ? 'sample case' : 'sample cases'} saved on this device.</p></div><span className="setting-value"><Bookmark size={15} /> {savedCount}</span></div></div><div className="privacy-card"><ShieldCheck size={19} /><div><h3>Local storage</h3><p>Saved case IDs and preferences stay in your browser’s local storage. This prototype has no user accounts or server-side storage.</p></div></div></section>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
