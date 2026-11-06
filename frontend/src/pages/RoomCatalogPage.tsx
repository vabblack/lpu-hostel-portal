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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Room Inventory &amp; Rate Explorer
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Search every room across BH-1 through BH-8 and GH-1 through GH-6. Check exact 10-month fees, Early Decision Benefits (EDB), and electricity allowances.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
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
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Hostel Building
            </label>
            <select
              value={filters.hostel_id}
              onChange={(e) => handleFilterChange('hostel_id', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="">All 14 Hostels</option>
              {hostels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.code} - {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Gender Block
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="">All Genders</option>
              <option value="MALE">Boys Hostels (BH)</option>
              <option value="FEMALE">Girls Hostels (GH)</option>
            </select>
          </div>

          {/* Seater */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Capacity / Seater
            </label>
            <select
              value={filters.seater}
              onChange={(e) => handleFilterChange('seater', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="">All Capacities</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  {s}-Seater
                </option>
              ))}
            </select>
          </div>

          {/* Cooling */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Cooling Type
            </label>
            <select
              value={filters.cooling}
              onChange={(e) => handleFilterChange('cooling', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="">All Types</option>
              <option value="AC">Air-Conditioned (AC)</option>
              <option value="COOLER">Air-Cooled</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
              Room Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="">All Categories</option>
              <option value="STANDARD">Standard Room</option>
              <option value="STUDIO_APARTMENT">Studio Apartment</option>
              <option value="DORMITORY">Dormitory</option>
            </select>
          </div>
        </div>

        {/* Search, Vacant Toggle & Reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search room number (e.g. 101, 204)..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{ width: '100%', maxWidth: '320px', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '0.875rem' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={filters.vacant_only}
                onChange={(e) => handleFilterChange('vacant_only', e.target.checked)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              Show Vacant Only
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Found <strong>{rooms.length}</strong> matching rooms
            </span>
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <Spinner label="Filtering rooms..." />
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>{error}</div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <h3 style={{ margin: '0 0 0.5rem' }}>No Rooms Match Your Criteria</h3>
          <p style={{ margin: '0 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Try widening your filters or clearing search terms.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
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
