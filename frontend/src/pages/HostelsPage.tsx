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
          Campus Hostels Directory
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Authoritative residential tower registry, facility matrices, and live room occupancy across all campus complexes.
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
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Gender Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: 'All Residential Complexes' },
            { key: 'MALE', label: 'Boys Hostels (BH-1 to BH-8)' },
            { key: 'FEMALE', label: 'Girls Hostels (GH-1 to GH-6)' },
          ].map((btn) => {
            const isActive = genderFilter === btn.key;
            return (
              <button
                key={btn.key}
                type="button"
                onClick={() => setGenderFilter(btn.key as 'ALL' | 'MALE' | 'FEMALE')}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: isActive ? 'var(--primary)' : 'var(--border-strong)',
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface)',
                  color: isActive ? '#ffffff' : 'var(--text)',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)',
                }}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Quick Search Input */}
        <div style={{ minWidth: '240px', flex: '0 1 300px' }}>
          <input
            type="text"
            placeholder="Search by block name or code (e.g. BH-1)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 0.875rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'var(--surface)',
              color: 'var(--ink)',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner label="Loading campus hostel directory..." />
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
      ) : filteredHostels.length === 0 ? (
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
            No Residential Complexes Found
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No hostel records match your current gender filter or search keyword.
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
