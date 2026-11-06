import React, { useEffect, useState } from 'react';
import { hostelsApi } from '../api/hostelsApi';
import { RoomSummary, RoomFilterState } from '../types/room';
import { HostelSummary } from '../types/hostel';
import { RoomCard } from '../components/hostel/RoomCard';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const RoomCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<RoomFilterState>({
    hostel_id: '',
    gender: '',
    seater: '',
    cooling: '',
    category: '',
    washroom_type: '',
    vacant_only: false,
    search: '',
  });

  // Load hostels for dropdown filter
  useEffect(() => {
    hostelsApi.getHostels().then((d) => setHostels(d.hostels)).catch(() => {});
  }, []);

  // Fetch rooms on filter change
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

  const handleFilterChange = (key: keyof RoomFilterState, value: unknown) => {
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
  };

  const handleSelectRoom = (room: RoomSummary) => {
    navigate(`/apply?room=${room.id}&hostel=${room.hostel_id}`);
  };

  return (
    <div className="container">
      {/* Title */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 600,
            color: 'var(--ink)',
            margin: '0 0 0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          Room Inventory &amp; Tariff Catalog
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Explore residential rooms across BH-1 through BH-8 and GH-1 through GH-6. Review standard 10-month fees, Early Decision Benefits (EDB), and electricity allowances.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          {/* Hostel Filter */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Hostel Complex
            </label>
            <select
              value={filters.hostel_id}
              onChange={(e) => handleFilterChange('hostel_id', e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="">All 14 Hostels</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} — {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Gender Designation
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="">All Genders</option>
              <option value="MALE">Boys Hostels (BH-1 to BH-8)</option>
              <option value="FEMALE">Girls Hostels (GH-1 to GH-6)</option>
            </select>
          </div>

          {/* Seater */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Occupancy Seater
            </label>
            <select
              value={filters.seater}
              onChange={(e) => handleFilterChange('seater', e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="">All Capacities</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {s}-Seater Room
                </option>
              ))}
            </select>
          </div>

          {/* Cooling */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Cooling System
            </label>
            <select
              value={filters.cooling}
              onChange={(e) => handleFilterChange('cooling', e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="">All Cooling Systems</option>
              <option value="AC">Air-Conditioned (AC)</option>
              <option value="COOLER">Air-Cooled</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.35rem',
              }}
            >
              Room Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            >
              <option value="">All Categories</option>
              <option value="STANDARD">Standard Room</option>
              <option value="STUDIO_APARTMENT">Studio Apartment</option>
              <option value="DORMITORY">Dormitory</option>
            </select>
          </div>
        </div>

        {/* Search, Vacant Toggle & Reset */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search room number (e.g. 101, 204)..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                maxWidth: '300px',
                height: '36px',
                padding: '0 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '0.875rem',
                boxSizing: 'border-box',
              }}
            />
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={filters.vacant_only}
                onChange={(e) => handleFilterChange('vacant_only', e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Show Vacant Beds Only
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Showing <strong className="tabular-nums" style={{ color: 'var(--ink)' }}>{rooms.length}</strong> room records
            </span>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <Spinner label="Filtering room inventory..." />
      ) : error ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--status-danger)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '0 0 0.5rem',
            }}
          >
            No Room Records Found
          </h3>
          <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No room accommodations match the current filter selection.
          </p>
          <Button variant="secondary" size="sm" onClick={handleResetFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} onSelect={handleSelectRoom} />
          ))}
        </div>
      )}
    </div>
  );
};
