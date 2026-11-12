import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CheckCircle2,
  Compass,
  GitCompareArrows,
  LayoutGrid,
  RotateCcw,
  Search,
  Snowflake,
  Sparkles,
  Table2,
  Wind,
  X,
} from 'lucide-react';
import { hostelsApi } from '../api/hostelsApi';
import { RoomFilterState, RoomSummary } from '../types/room';
import { HostelSummary } from '../types/hostel';
import { RoomCard } from '../components/hostel/RoomCard';
import { RoomInspectionModal } from '../components/hostel/RoomInspectionModal';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';

type ViewMode = 'grid' | 'table';
type RoomSortKey = 'DEFAULT' | 'FEE_ASC' | 'FEE_DESC' | 'VACANT_DESC';

export const RoomCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<RoomSortKey>('DEFAULT');
  const [inspectedRoom, setInspectedRoom] = useState<RoomSummary | null>(null);
  const [comparedRooms, setComparedRooms] = useState<RoomSummary[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [filters, setFilters] = useState<RoomFilterState>(() => ({
    hostel_id: searchParams.get('hostel_id') || '',
    gender: searchParams.get('gender') || '',
    seater: searchParams.get('seater') || '',
    cooling: searchParams.get('cooling') || '',
    category: searchParams.get('category') || '',
    washroom_type: searchParams.get('washroom_type') || '',
    vacant_only: searchParams.get('vacant_only') === 'true',
    search: searchParams.get('q') || '',
  }));

  useEffect(() => {
    hostelsApi
      .getHostels()
      .then((data) =>
        setHostels(
          [...data.hostels].sort((a, b) =>
            a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }),
          ),
        ),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (filters.hostel_id) nextParams.set('hostel_id', filters.hostel_id);
    if (filters.gender) nextParams.set('gender', filters.gender);
    if (filters.seater) nextParams.set('seater', filters.seater);
    if (filters.cooling) nextParams.set('cooling', filters.cooling);
    if (filters.category) nextParams.set('category', filters.category);
    if (filters.washroom_type) nextParams.set('washroom_type', filters.washroom_type);
    if (filters.vacant_only) nextParams.set('vacant_only', 'true');
    if (filters.search) nextParams.set('q', filters.search);
    setSearchParams(nextParams, { replace: true });
  }, [filters, setSearchParams]);

  useEffect(() => {
    setIsLoading(true);
    hostelsApi
      .getRooms(filters)
      .then((data) => {
        setRooms(data.rooms);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load rooms.'))
      .finally(() => setIsLoading(false));
  }, [filters]);

  const handleFilterChange = (key: keyof RoomFilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      hostel_id: '',
      gender: '',
      seater: '',
      cooling: '',
      category: '',
      washroom_type: '',
      vacant_only: false,
      search: '',
    });
    setSortBy('DEFAULT');
  };

  const handleSelectRoom = (room: RoomSummary) => {
    navigate(`/apply?room=${room.id}&hostel=${room.hostel_id}`);
  };

  const handleToggleCompare = (room: RoomSummary) => {
    setComparedRooms((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      if (exists) return prev.filter((r) => r.id !== room.id);
      if (prev.length >= 3) return [...prev.slice(1), room];
      return [...prev, room];
    });
  };

  const sortedRooms = useMemo(() => {
    if (sortBy === 'FEE_ASC') {
      return [...rooms].sort(
        (a, b) => (a.standard_fee ?? Number.MAX_SAFE_INTEGER) - (b.standard_fee ?? Number.MAX_SAFE_INTEGER),
      );
    }
    if (sortBy === 'FEE_DESC') {
      return [...rooms].sort((a, b) => (b.standard_fee ?? 0) - (a.standard_fee ?? 0));
    }
    if (sortBy === 'VACANT_DESC') {
      return [...rooms].sort((a, b) => b.vacant_beds_count - a.vacant_beds_count);
    }
    return rooms;
  }, [rooms, sortBy]);

  const telemetry = useMemo(() => {
    const openBeds = rooms.reduce((sum, r) => sum + r.vacant_beds_count, 0);
    const studioRooms = rooms.filter((r) => r.category === 'STUDIO_APARTMENT').length;
    const minFee = rooms.reduce<number | null>((min, r) => {
      if (!r.standard_fee) return min;
      return min === null ? r.standard_fee : Math.min(min, r.standard_fee);
    }, null);
    return { openBeds, studioRooms, minFee };
  }, [rooms]);

  const bh9 = useMemo(() => hostels.find((h) => h.code === 'BH-9'), [hostels]);
  const gs9 = useMemo(() => hostels.find((h) => h.code === 'GS-9'), [hostels]);

  const activeChips = useMemo(() => {
    const chips: { key: keyof RoomFilterState; label: string; resetValue: string | boolean }[] = [];
    if (filters.hostel_id) {
      const match = hostels.find((h) => String(h.id) === filters.hostel_id);
      chips.push({
        key: 'hostel_id',
        label: `Hostel: ${match ? `${match.code}` : filters.hostel_id}`,
        resetValue: '',
      });
    }
    if (filters.gender) {
      chips.push({
        key: 'gender',
        label: filters.gender === 'MALE' ? 'Boys Wing' : 'Girls Wing',
        resetValue: '',
      });
    }
    if (filters.seater) {
      chips.push({ key: 'seater', label: `${filters.seater}-Seater`, resetValue: '' });
    }
    if (filters.cooling) {
      chips.push({
        key: 'cooling',
        label: filters.cooling === 'AC' ? 'Air-Conditioned' : 'Air-Cooled',
        resetValue: '',
      });
    }
    if (filters.category) {
      chips.push({
        key: 'category',
        label:
          filters.category === 'STUDIO_APARTMENT'
            ? 'Studio Apartment'
            : filters.category === 'DORMITORY'
            ? 'Dormitory'
            : 'Standard Room',
        resetValue: '',
      });
    }
    if (filters.washroom_type) {
      chips.push({
        key: 'washroom_type',
        label: `${filters.washroom_type === 'ATTACHED' ? 'Attached' : 'Shared'} Washroom`,
        resetValue: '',
      });
    }
    if (filters.vacant_only) {
      chips.push({ key: 'vacant_only', label: 'Open Beds Only', resetValue: false });
    }
    if (filters.search) {
      chips.push({ key: 'search', label: `Query: "${filters.search}"`, resetValue: '' });
    }
    return chips;
  }, [filters, hostels]);

  return (
    <div>
      {/* Obsidian Glassmorphic Header */}
      <section className="dir-hero" aria-labelledby="room-catalog-title">
        <div className="dir-hero-grid-bg" aria-hidden="true" />
        <div className="container dir-hero-inner">
          <div>
            <div className="dir-eyebrow">
              <span className="dir-eyebrow-rule" aria-hidden="true" />
              Room Inventory &amp; 10-Month Tariff Table
            </div>
            <h1 id="room-catalog-title" className="dir-title">
              Room &amp; Studio Catalog
            </h1>
            <p className="dir-subtitle">
              Compare 1 to 8-seater configurations across BH-1–BH-10 (including Boys Studio 9) and
              GH-1–GS-9 (including Girls Studio 9). Every card lists 10-month standard fees, ₹10,000
              EDB early-decision rates, and electricity quotas.
            </p>
          </div>

          <div className="dir-kpi-grid" role="region" aria-label="Filtered room metrics">
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Matching Rooms</span>
              <strong className="glass-kpi-value tabular-nums">{rooms.length}</strong>
              <span className="glass-kpi-meta">Across {hostels.length || 19} residences</span>
            </div>
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Open Beds Found</span>
              <strong
                className="glass-kpi-value tabular-nums"
                style={{ color: 'var(--status-success)' }}
              >
                {telemetry.openBeds.toLocaleString('en-IN')}
              </strong>
              <span className="glass-kpi-meta">Available for allotment</span>
            </div>
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Studio Suites</span>
              <strong className="glass-kpi-value tabular-nums" style={{ color: 'var(--brand)' }}>
                {telemetry.studioRooms}
              </strong>
              <span className="glass-kpi-meta">Hot &amp; Cold AC + Pantry</span>
            </div>
            <div className="glass-kpi-card">
              <span className="glass-kpi-label">Starting Session Fee</span>
              <strong className="glass-kpi-value tabular-nums">
                {telemetry.minFee ? `₹${Number(telemetry.minFee).toLocaleString('en-IN')}` : '—'}
              </strong>
              <span className="glass-kpi-meta">10-month academic cycle</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container dir-stage" style={{ paddingBottom: comparedRooms.length > 0 ? '6.5rem' : '4rem' }}>
        {/* Preset Quick Filter Chips */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '1rem',
          }}
        >
          <div className="neo-pill-group" role="group" aria-label="Quick room presets">
            <button
              type="button"
              className={`neo-pill ${
                !filters.category && !filters.hostel_id && !filters.cooling && !filters.vacant_only
                  ? 'is-active'
                  : ''
              }`}
              aria-pressed={
                !filters.category && !filters.hostel_id && !filters.cooling && !filters.vacant_only
              }
              onClick={handleResetFilters}
            >
              All Rooms
            </button>
            {bh9 && (
              <button
                type="button"
                className={`neo-pill ${filters.hostel_id === String(bh9.id) ? 'is-active' : ''}`}
                aria-pressed={filters.hostel_id === String(bh9.id)}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hostel_id: prev.hostel_id === String(bh9.id) ? '' : String(bh9.id),
                    gender: '',
                  }))
                }
              >
                <Sparkles size={13} aria-hidden="true" />
                Boys Studio 9 (BH-9)
              </button>
            )}
            {gs9 && (
              <button
                type="button"
                className={`neo-pill ${filters.hostel_id === String(gs9.id) ? 'is-active' : ''}`}
                aria-pressed={filters.hostel_id === String(gs9.id)}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    hostel_id: prev.hostel_id === String(gs9.id) ? '' : String(gs9.id),
                    gender: '',
                  }))
                }
              >
                <Sparkles size={13} aria-hidden="true" />
                Girls Studio 9 (GS-9)
              </button>
            )}
            <button
              type="button"
              className={`neo-pill ${filters.category === 'STUDIO_APARTMENT' ? 'is-active' : ''}`}
              aria-pressed={filters.category === 'STUDIO_APARTMENT'}
              onClick={() =>
                handleFilterChange(
                  'category',
                  filters.category === 'STUDIO_APARTMENT' ? '' : 'STUDIO_APARTMENT',
                )
              }
            >
              All Studio Apartments
            </button>
            <button
              type="button"
              className={`neo-pill ${filters.cooling === 'COOLER' ? 'is-active' : ''}`}
              aria-pressed={filters.cooling === 'COOLER'}
              onClick={() =>
                handleFilterChange('cooling', filters.cooling === 'COOLER' ? '' : 'COOLER')
              }
            >
              <Wind size={13} aria-hidden="true" />
              Air-Cooled Budget
            </button>
          </div>

          {/* Grid / Comparison Table Switcher */}
          <div className="neo-pill-group" role="group" aria-label="View layout toggle">
            <button
              type="button"
              className={`neo-pill ${viewMode === 'grid' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              Cards
            </button>
            <button
              type="button"
              className={`neo-pill ${viewMode === 'table' ? 'is-active' : ''}`}
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              <Table2 size={14} aria-hidden="true" />
              Tariff Table
            </button>
          </div>
        </div>

        {/* Sticky Frosted Filter Matrix */}
        <section className="glass-filter-dock" aria-label="Room filter parameters">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
              gap: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label
                htmlFor="filter-hostel"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Hostel Block
              </label>
              <select
                id="filter-hostel"
                value={filters.hostel_id}
                onChange={(e) => handleFilterChange('hostel_id', e.target.value)}
                className="neo-select"
              >
                <option value="">All {hostels.length || 19} Hostels</option>
                {hostels.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-wing"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Wing Policy
              </label>
              <select
                id="filter-wing"
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
                className="neo-select"
              >
                <option value="">All Wings</option>
                <option value="MALE">Boys (BH-1 to BH-10)</option>
                <option value="FEMALE">Girls (GH-1 to GS-9)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-seater"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Seater Size
              </label>
              <select
                id="filter-seater"
                value={filters.seater}
                onChange={(e) => handleFilterChange('seater', e.target.value)}
                className="neo-select"
              >
                <option value="">All Seaters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}-Seater
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-cooling"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Climate
              </label>
              <select
                id="filter-cooling"
                value={filters.cooling}
                onChange={(e) => handleFilterChange('cooling', e.target.value)}
                className="neo-select"
              >
                <option value="">AC &amp; Air-Cooled</option>
                <option value="AC">Air-Conditioned (AC)</option>
                <option value="COOLER">Air-Cooled</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-category"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Category
              </label>
              <select
                id="filter-category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="neo-select"
              >
                <option value="">All Categories</option>
                <option value="STANDARD">Standard Room</option>
                <option value="STUDIO_APARTMENT">Studio Apartment</option>
                <option value="DORMITORY">Dormitory</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-washroom"
                style={{
                  display: 'block',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '0.35rem',
                }}
              >
                Washroom
              </label>
              <select
                id="filter-washroom"
                value={filters.washroom_type}
                onChange={(e) => handleFilterChange('washroom_type', e.target.value)}
                className="neo-select"
              >
                <option value="">Attached &amp; Shared</option>
                <option value="ATTACHED">Attached</option>
                <option value="SHARED">Shared</option>
              </select>
            </div>
          </div>

          {/* Search, Sort & Vacant Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.875rem',
              paddingTop: '0.875rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                flex: '1 1 320px',
              }}
            >
              <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '280px' }}>
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
                  aria-label="Search room number or hostel"
                  placeholder="Room 101, 203, BH-9..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="neo-input"
                  style={{ paddingLeft: '2.2rem', height: '36px' }}
                />
              </div>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={filters.vacant_only}
                  onChange={(e) => handleFilterChange('vacant_only', e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                />
                Open Beds Only
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                aria-label="Sort rooms"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as RoomSortKey)}
                className="neo-select"
                style={{ width: 'auto', minWidth: '165px', height: '36px' }}
              >
                <option value="DEFAULT">Sort: Default Order</option>
                <option value="FEE_ASC">Fee: Low to High</option>
                <option value="FEE_DESC">Fee: High to Low</option>
                <option value="VACANT_DESC">Most Open Beds</option>
              </select>

              {activeChips.length > 0 && (
                <button
                  type="button"
                  className="neo-ghost-btn"
                  style={{ height: '36px' }}
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Removable Active Filter Chips */}
          {activeChips.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.45rem',
                marginTop: '0.875rem',
                paddingTop: '0.75rem',
                borderTop: '1px dashed var(--border)',
              }}
              aria-label="Active filters"
            >
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleFilterChange(chip.key, chip.resetValue)}
                  className="neo-pill"
                  style={{
                    minHeight: '28px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    backgroundColor: '#171615',
                  }}
                >
                  {chip.label}
                  <X size={12} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Results */}
        {isLoading ? (
          <Spinner label="Filtering room inventory..." />
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
        ) : sortedRooms.length === 0 ? (
          <div
            style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
              border: '1.5px solid var(--border-strong)',
              boxShadow: '4px 4px 0 #0d0c0b',
            }}
          >
            <BedDouble size={28} color="var(--brand)" style={{ marginBottom: '0.75rem' }} aria-hidden="true" />
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.375rem',
                color: 'var(--ink)',
                margin: '0 0 0.5rem',
              }}
            >
              No Rooms Match These Filters
            </h2>
            <p style={{ margin: '0 auto 1.25rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Clear one or more room filters to restore available suites across campus.
            </p>
            <button type="button" className="neo-cta-btn" onClick={handleResetFilters}>
              <RotateCcw size={13} aria-hidden="true" />
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="catalog-grid">
            {sortedRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={handleSelectRoom}
                onInspect={setInspectedRoom}
                onToggleCompare={handleToggleCompare}
                isCompared={comparedRooms.some((c) => c.id === room.id)}
              />
            ))}
          </div>
        ) : (
          /* Accessible Semantic Comparison Table */
          <div className="tariff-table-wrap">
            <table className="tariff-table">
              <thead>
                <tr>
                  <th scope="col">Room &amp; Hostel</th>
                  <th scope="col">Configuration</th>
                  <th scope="col">Climate &amp; Bath</th>
                  <th scope="col">Quota</th>
                  <th scope="col">10-Mo Fee</th>
                  <th scope="col">EDB Rate</th>
                  <th scope="col">Open Beds</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRooms.map((room) => {
                  const hasVacant = room.vacant_beds_count > 0;
                  return (
                    <tr key={room.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                          Room <span className="tabular-nums">{room.room_number}</span>{' '}
                          <span style={{ color: 'var(--primary)' }}>({room.hostel_code})</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {room.hostel_name} &middot; Floor {room.floor_number}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{room.capacity}-Seater</span>{' '}
                        <span style={{ color: 'var(--text-muted)' }}>{room.category_display}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            marginRight: '0.5rem',
                          }}
                        >
                          {room.is_air_conditioned ? (
                            <Snowflake size={13} color="var(--brand)" aria-hidden="true" />
                          ) : (
                            <Wind size={13} color="var(--text-muted)" aria-hidden="true" />
                          )}
                          {room.is_air_conditioned ? 'AC' : 'Cooler'}
                        </span>
                        &middot; {room.washroom_type_display}
                      </td>
                      <td className="tabular-nums">
                        {room.quota_kwh ? `${room.quota_kwh} kWh` : '—'}
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        {room.standard_fee
                          ? `₹${Number(room.standard_fee).toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td
                        className="tabular-nums"
                        style={{ fontWeight: 600, color: 'var(--status-success)' }}
                      >
                        {room.edb_fee ? `₹${Number(room.edb_fee).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td>
                        <Badge variant={hasVacant ? 'success' : 'danger'} size="sm">
                          <CheckCircle2 size={11} aria-hidden="true" />
                          {room.vacant_beds_count}/{room.capacity}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="neo-ghost-btn"
                            style={{ minHeight: '30px', padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => setInspectedRoom(room)}
                            aria-label={`Inspect room ${room.room_number}`}
                          >
                            <Compass size={12} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="neo-cta-btn"
                            style={{ minHeight: '30px', padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
                            disabled={!hasVacant}
                            onClick={() => handleSelectRoom(room)}
                          >
                            {hasVacant ? 'Select' : 'Full'}
                            {hasVacant && <ArrowRight size={12} aria-hidden="true" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Glassmorphic Compare Bar */}
      {comparedRooms.length > 0 && (
        <div
          role="region"
          aria-label="Pinned room comparison tray"
          style={{
            position: 'fixed',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 45,
            width: 'min(920px, calc(100% - 2rem))',
            backgroundColor: 'rgba(20, 19, 17, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid var(--brand)',
            boxShadow: '6px 6px 0 #0a0908',
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <GitCompareArrows size={16} color="var(--brand)" aria-hidden="true" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--ink)' }}>
              Compare ({comparedRooms.length}/3):
            </span>
            {comparedRooms.map((r) => (
              <button
                key={r.id}
                type="button"
                className="neo-pill"
                style={{ minHeight: '28px', padding: '0.15rem 0.55rem', fontSize: '0.75rem' }}
                onClick={() => handleToggleCompare(r)}
              >
                {r.hostel_code} #{r.room_number}
                <X size={11} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="neo-ghost-btn"
              style={{ minHeight: '32px', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
              onClick={() => setComparedRooms([])}
            >
              Clear
            </button>
            <button
              type="button"
              className="neo-cta-btn"
              style={{ minHeight: '32px', padding: '0.35rem 0.85rem', fontSize: '0.75rem' }}
              onClick={() => setIsCompareOpen(true)}
            >
              Compare Side-by-Side
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive Blueprint Unit Inspector Modal */}
      {inspectedRoom && (
        <RoomInspectionModal
          room={inspectedRoom}
          hostelName={inspectedRoom.hostel_name}
          blockName={inspectedRoom.block_name}
          floorLabel={`Floor ${inspectedRoom.floor_number}`}
          onClose={() => setInspectedRoom(null)}
        />
      )}

      {/* Side-by-Side Room Comparison Modal */}
      <Modal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        title="Room Tariff & Amenities Comparison"
        maxWidth="820px"
      >
        <div className="tariff-table-wrap" style={{ boxShadow: 'none' }}>
          <table className="tariff-table">
            <thead>
              <tr>
                <th scope="col">Spec</th>
                {comparedRooms.map((r) => (
                  <th key={r.id} scope="col">
                    {r.hostel_code} &middot; Rm {r.room_number}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Category</td>
                {comparedRooms.map((r) => (
                  <td key={r.id}>
                    {r.capacity}-Seater {r.category_display}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Climate</td>
                {comparedRooms.map((r) => (
                  <td key={r.id}>{r.is_air_conditioned ? 'Air-Conditioned' : 'Air-Cooled'}</td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Washroom</td>
                {comparedRooms.map((r) => (
                  <td key={r.id}>{r.washroom_type_display}</td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Electricity Quota</td>
                {comparedRooms.map((r) => (
                  <td key={r.id} className="tabular-nums">
                    {r.quota_kwh ? `${r.quota_kwh} kWh` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>10-Mo Standard Fee</td>
                {comparedRooms.map((r) => (
                  <td key={r.id} className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                    {r.standard_fee ? `₹${Number(r.standard_fee).toLocaleString('en-IN')}` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>EDB Rate</td>
                {comparedRooms.map((r) => (
                  <td key={r.id} className="tabular-nums" style={{ color: 'var(--status-success)', fontWeight: 700 }}>
                    {r.edb_fee ? `₹${Number(r.edb_fee).toLocaleString('en-IN')}` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Open Beds</td>
                {comparedRooms.map((r) => (
                  <td key={r.id} className="tabular-nums">
                    {r.vacant_beds_count}/{r.capacity} Open
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Apply</td>
                {comparedRooms.map((r) => (
                  <td key={r.id}>
                    <button
                      type="button"
                      className="neo-cta-btn"
                      style={{ minHeight: '30px', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                      disabled={r.vacant_beds_count === 0}
                      onClick={() => handleSelectRoom(r)}
                    >
                      {r.vacant_beds_count > 0 ? 'Select Bed' : 'Full'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};
