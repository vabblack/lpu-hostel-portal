import React, { useEffect, useState } from 'react';
import { hostelsApi } from '../api/hostelsApi';
import { HostelSummary } from '../types/hostel';
import { HostelCard } from '../components/hostel/HostelCard';
import { Spinner } from '../components/common/Spinner';

export const HostelsPage: React.FC = () => {
  const [hostels, setHostels] = useState<HostelSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [genderFilter, setGenderFilter] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setIsLoading(true);
    hostelsApi
      .getHostels(genderFilter !== 'ALL' ? { gender: genderFilter } : undefined)
      .then((data) => {
        setHostels(data.hostels);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load hostels.'))
      .finally(() => setIsLoading(false));
  }, [genderFilter]);

  const filteredHostels = hostels.filter((h) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return h.name.toLowerCase().includes(term) || h.code.toLowerCase().includes(term);
  });

  return (
    <div className="container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
          Campus Hostels &amp; Accommodation Directory
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
          Browse university accommodation inventory, facility configurations, and live bed availability across all 14 residential towers.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Gender Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'ALL', label: 'All Hostels' },
            { key: 'MALE', label: 'Boys Hostels (BH-1 to BH-8)' },
            { key: 'FEMALE', label: 'Girls Hostels (GH-1 to GH-6)' },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setGenderFilter(btn.key as 'ALL' | 'MALE' | 'FEMALE')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: genderFilter === btn.key ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: genderFilter === btn.key ? 'var(--color-primary)' : 'transparent',
                color: genderFilter === btn.key ? '#ffffff' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Quick Search Input */}
        <div style={{ minWidth: '240px', flex: '0 1 300px' }}>
          <input
            type="text"
            placeholder="Search by name or code (e.g. BH-1)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner label="Loading campus hostel inventory..." />
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : filteredHostels.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
          <h3 style={{ margin: '0 0 0.5rem' }}>No Hostels Found</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No residential complexes match your search filter criteria.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredHostels.map((hostel) => (
            <HostelCard key={hostel.id} hostel={hostel} />
          ))}
        </div>
      )}
    </div>
  );
};
