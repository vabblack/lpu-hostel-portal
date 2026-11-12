import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { hostelsApi } from '../api/hostelsApi';
import { HostelSummary } from '../types/hostel';
import { HostelCard } from '../components/hostel/HostelCard';
import { Spinner } from '../components/common/Spinner';

type WingFilter = 'ALL' | 'MALE' | 'FEMALE' | 'STUDIO';
type SortKey = 'DEFAULT' | 'VACANT_DESC' | 'FEE_ASC' | 'OCCUPANCY_ASC';

const STUDIO_CODES = new Set(['BH-9', 'BH-10', 'GS-9']);

const naturalCodeCompare = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export const HostelsPage: React.FC = () => {
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [wingFilter, setWingFilter] = useState<WingFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('DEFAULT');

  useEffect(() => {
    setIsLoading(true);
    hostelsApi
      .getHostels()
      .then((data) => {
        setHostels(data.hostels);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load hostel directory.'))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalHostels = hostels.length;
    const totalBeds = hostels.reduce((acc, h) => acc + h.total_beds, 0);
    const totalVacant = hostels.reduce((acc, h) => acc + h.vacant_beds, 0);
    const studioCount = hostels.filter(
      (h) => STUDIO_CODES.has(h.code) || h.name.toLowerCase().includes('studio'),
    ).length;
    return { totalHostels, totalBeds, totalVacant, studioCount };
  }, [hostels]);

  const filteredHostels = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = hostels.filter((h) => {
      const isStudio = STUDIO_CODES.has(h.code) || h.name.toLowerCase().includes('studio');
      if (wingFilter === 'MALE' && h.gender_policy !== 'MALE') return false;
      if (wingFilter === 'FEMALE' && h.gender_policy !== 'FEMALE') return false;
      if (wingFilter === 'STUDIO' && !isStudio) return false;
      if (!query) return true;
      return (
        h.name.toLowerCase().includes(query) ||
        h.code.toLowerCase().includes(query) ||
        h.description.toLowerCase().includes(query)
      );
    });

    if (sortBy === 'VACANT_DESC') {
      return [...list].sort((a, b) => b.vacant_beds - a.vacant_beds);
    }
    if (sortBy === 'FEE_ASC') {
      return [...list].sort(
        (a, b) => (a.min_standard_fee ?? Number.MAX_SAFE_INTEGER) - (b.min_standard_fee ?? Number.MAX_SAFE_INTEGER),
      );
    }
    if (sortBy === 'OCCUPANCY_ASC') {
      return [...list].sort((a, b) => a.occupancy_pct - b.occupancy_pct);
    }
    return [...list].sort((a, b) => naturalCodeCompare(a.code, b.code));
  }, [hostels, wingFilter, search, sortBy]);

  return (
    <div>
      {/* Obsidian Glassmorphic Directory Header */}
      <section className="dir-hero" aria-labelledby="hostels-dir-title">
        <div className="dir-hero-grid-bg" aria-hidden="true" />
        <div className="container dir-hero-inner">
          <div>
            <div className="dir-eyebrow">
              <span className="dir-eyebrow-rule" aria-hidden="true" />
              LPU Phagwara Campus &middot; 2026–27 Inventory
            </div>
            <h1 id="hostels-dir-title" className="dir-title">
              Campus Residential Directory
            </h1>
            <p className="dir-subtitle">
              Inspect all {stats.totalHostels || 19} LPU residential blocks across Boys Wings (BH-1 to
              BH-10 including Boys Studio 9) and Girls Wings (GH-1 to GH-8 plus Girls Studio 9). Check
              live bed counts, AC coverage, and 10-month session base fees.
            </p>
          </div>

          <div className="dir-kpi-grid" role="region" aria-label="Campus housing summary metrics">
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Hostel Blocks</span>
              <strong className="glass-kpi-value tabular-nums">{stats.totalHostels || 19}</strong>
              <span className="glass-kpi-meta">BH-1–BH-10 &middot; GH-1–GS-9</span>
            </div>
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Live Open Beds</span>
              <strong
                className="glass-kpi-value tabular-nums"
                style={{ color: 'var(--status-success)' }}
              >
                {stats.totalVacant.toLocaleString('en-IN')}
              </strong>
              <span className="glass-kpi-meta">
                of {stats.totalBeds.toLocaleString('en-IN')} mapped beds
              </span>
            </div>
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Studio Complexes</span>
              <strong className="glass-kpi-value tabular-nums" style={{ color: 'var(--brand)' }}>
                {stats.studioCount || 3}
              </strong>
              <span className="glass-kpi-meta">BH-9 &middot; BH-10 &middot; GS-9</span>
            </div>
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">10-Mo Fee Range</span>
              <strong className="glass-kpi-value tabular-nums">₹80K – ₹2.0L</strong>
              <span className="glass-kpi-meta">₹10,000 EDB early rebate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Stage */}
      <div className="container dir-stage">
        {/* Studio Complex Callout Strip */}
        <aside className="studio-spotlight-bar" aria-label="Studio apartment blocks highlight">
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--brand)',
                marginBottom: '0.25rem',
              }}
            >
              <Sparkles size={13} aria-hidden="true" />
              New Studio Expansions Live
            </div>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--ink)' }}>
              <strong>Boys Studio 9 (BH-9)</strong>, <strong>Boys Hostel 10 (BH-10)</strong>,{' '}
              <strong>Girls Hostel 8 (GH-8)</strong>, and <strong>Girls Studio 9 (GS-9)</strong> add
              1–4 seater Hot &amp; Cold AC Studio Apartments with pantry sockets and attached geysers.
            </p>
          </div>
          <Link to="/rooms?category=STUDIO_APARTMENT" className="neo-cta-btn">
            Compare Studio Suites
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>

        {/* Sticky Frosted Filter Dock */}
        <section className="glass-filter-dock" aria-label="Filter hostels">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {/* Tactile Wing Filter Pills */}
            <div className="neo-pill-group" role="group" aria-label="Wing filter">
              {(
                [
                  { key: 'ALL', label: `All (${hostels.length || 19})` },
                  { key: 'MALE', label: 'Boys Wings (BH-1–BH-10)' },
                  { key: 'FEMALE', label: 'Girls Wings (GH-1–GS-9)' },
                  { key: 'STUDIO', label: 'Studio Complexes' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`neo-pill ${wingFilter === tab.key ? 'is-active' : ''}`}
                  aria-pressed={wingFilter === tab.key}
                  onClick={() => setWingFilter(tab.key)}
                >
                  {tab.key === 'STUDIO' ? (
                    <Sparkles size={13} aria-hidden="true" />
                  ) : (
                    <Building2 size={13} aria-hidden="true" />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search & Sort Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                flexWrap: 'wrap',
                flex: '1 1 320px',
                justifyContent: 'flex-end',
              }}
            >
              <div style={{ position: 'relative', flex: '1 1 210px', maxWidth: '280px' }}>
                <Search
                  size={15}
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="search"
                  aria-label="Search hostel by name, code, or facility"
                  placeholder="Search BH-9, Studio, GH-8..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                <SlidersHorizontal size={14} color="var(--text-muted)" aria-hidden="true" />
                <select
                  aria-label="Sort hostels"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="neo-select"
                  style={{ width: 'auto', minWidth: '165px' }}
                >
                  <option value="DEFAULT">Sort: Campus Order</option>
                  <option value="VACANT_DESC">Sort: Most Open Beds</option>
                  <option value="FEE_ASC">Sort: Lowest Base Fee</option>
                  <option value="OCCUPANCY_ASC">Sort: Lowest Occupancy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Count & Reset Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              marginTop: '0.875rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>
              Showing <strong className="tabular-nums" style={{ color: 'var(--ink)' }}>{filteredHostels.length}</strong> of{' '}
              <span className="tabular-nums">{hostels.length}</span> complexes
            </span>
            {(wingFilter !== 'ALL' || search !== '' || sortBy !== 'DEFAULT') && (
              <button
                type="button"
                className="neo-ghost-btn"
                style={{ minHeight: '30px', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => {
                  setWingFilter('ALL');
                  setSearch('');
                  setSortBy('DEFAULT');
                }}
              >
                <RotateCcw size={12} aria-hidden="true" />
                Reset View
              </button>
            )}
          </div>
        </section>

        {/* Directory Grid */}
        {isLoading ? (
          <Spinner label="Loading campus hostel directory..." />
        ) : error ? (
          <div
            role="alert"
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--status-danger)',
              backgroundColor: 'var(--surface)',
              border: '1.5px solid var(--status-danger)',
            }}
          >
            {error}
          </div>
        ) : filteredHostels.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
              border: '1.5px solid var(--border-strong)',
              boxShadow: '4px 4px 0 #0d0c0b',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.375rem',
                color: 'var(--ink)',
                margin: '0 0 0.5rem',
              }}
            >
              No Matching Hostels
            </h2>
            <p style={{ margin: '0 auto 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No campus block matches the current wing filter or keyword &ldquo;{search}&rdquo;.
            </p>
            <button
              type="button"
              className="neo-cta-btn"
              onClick={() => {
                setWingFilter('ALL');
                setSearch('');
                setSortBy('DEFAULT');
              }}
            >
              <RotateCcw size={13} aria-hidden="true" />
              Show All Blocks
            </button>
          </div>
        ) : (
          <div className="catalog-grid">
            {filteredHostels.map((hostel) => (
              <HostelCard key={hostel.id} hostel={hostel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
