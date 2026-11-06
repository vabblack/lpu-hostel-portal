import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { hostelsApi } from '../api/hostelsApi';
import { HostelDetail, FloorRoomDetail } from '../types/hostel';
import { Spinner } from '../components/common/Spinner';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { BedIndicator } from '../components/hostel/BedIndicator';

export const HostelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [hostel, setHostel] = useState<HostelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const [selectedFloorIdx, setSelectedFloorIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    hostelsApi
      .getHostelDetail(Number(id))
      .then((data) => {
        setHostel(data.hostel);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load hostel details.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) return <Spinner label="Loading hostel details..." />;
  if (error || !hostel) {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: 'var(--status-danger)' }}>Hostel Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/hostels">
          <Button variant="secondary">Back to Hostels Directory</Button>
        </Link>
      </div>
    );
  }

  const activeBlock = hostel.blocks[selectedBlockIdx] || hostel.blocks[0];
  const activeFloor = activeBlock?.floors[selectedFloorIdx] || activeBlock?.floors[0];

  return (
    <div className="container">
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link
          to="/hostels"
          style={{
            textDecoration: 'none',
            color: 'var(--primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          &larr; Back to Hostels Directory
        </Link>
      </div>

      {/* Hero Header */}
      <div
        style={{
          padding: '2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--brand)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Badge variant="neutral">{hostel.gender_policy_display}</Badge>
              <Badge variant="success">{hostel.status_display}</Badge>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '2.125rem',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: '0 0 0.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              {hostel.name}
            </h1>
            <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
              Complex Code: <strong style={{ color: 'var(--ink)' }}>{hostel.code}</strong> • Lovely Professional University
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Total Bed Capacity
              </div>
              <div
                className="tabular-nums"
                style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)' }}
              >
                {hostel.total_beds}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Available Beds
              </div>
              <div
                className="tabular-nums"
                style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1E6B3A' }}
              >
                {hostel.vacant_beds}
              </div>
            </div>
          </div>
        </div>

        {hostel.description && (
          <p
            style={{
              margin: '1.25rem 0 0',
              color: 'var(--text)',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
            }}
          >
            {hostel.description}
          </p>
        )}
      </div>

      {/* Block & Floor Selector */}
      {hostel.blocks.length > 0 ? (
        <div>
          {/* Block Selector */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0.75rem',
            }}
          >
            {hostel.blocks.map((block, idx) => {
              const isSelected = selectedBlockIdx === idx;
              return (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => {
                    setSelectedBlockIdx(idx);
                    setSelectedFloorIdx(0);
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--ink)' : 'var(--border)',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'var(--ink)' : 'var(--surface)',
                    color: isSelected ? '#ffffff' : 'var(--text)',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {block.name}
                </button>
              );
            })}
          </div>

          {/* Floor Selector (Rectilinear buttons, not pill shapes) */}
          {activeBlock && activeBlock.floors.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {activeBlock.floors.map((fl, fIdx) => {
                const isSelected = selectedFloorIdx === fIdx;
                return (
                  <button
                    key={fl.id}
                    type="button"
                    onClick={() => setSelectedFloorIdx(fIdx)}
                    style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-strong)',
                      backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                      color: isSelected ? '#ffffff' : 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    {fl.label} (<span className="tabular-nums">{fl.rooms.length}</span> Units)
                  </button>
                );
              })}
            </div>
          )}

          {/* Rooms Grid for Selected Floor */}
          {activeFloor && activeFloor.rooms.length > 0 ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '1rem',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    margin: 0,
                  }}
                >
                  {activeBlock.name} — {activeFloor.label} Inventory
                </h3>
                <span className="tabular-nums" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {activeFloor.rooms.length} rooms listed
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {activeFloor.rooms.map((r: FloorRoomDetail) => (
                  <Card key={r.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Badge variant="neutral" size="sm">
                          <span className="tabular-nums">{r.capacity}</span>-Seater
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {r.is_air_conditioned ? 'AC' : 'Air-Cooled'}
                        </Badge>
                      </div>
                      <Badge variant={r.vacant_beds_count > 0 ? 'success' : 'danger'} size="sm">
                        {r.vacant_beds_count > 0 ? `${r.vacant_beds_count} Vacant` : 'Fully Occupied'}
                      </Badge>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                      <h4
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-serif)',
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        Room <span className="tabular-nums">{r.room_number}</span>
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {r.category_display} • {r.washroom_type}
                      </div>
                    </div>

                    {r.quota_kwh && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginBottom: '0.75rem',
                        }}
                      >
                        Metered Allowance: <strong className="tabular-nums" style={{ color: 'var(--ink)' }}>{r.quota_kwh} kWh</strong> / session
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Bed Occupancy:
                      </div>
                      <BedIndicator beds={r.beds} />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        {r.standard_fee && (
                          <div>
                            <span
                              className="tabular-nums"
                              style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--ink)' }}
                            >
                              ₹{r.standard_fee.toLocaleString('en-IN')}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'block' }}>
                              10-mo standard
                            </span>
                          </div>
                        )}
                      </div>
                      <Link to={`/apply?room=${r.id}`} style={{ textDecoration: 'none' }}>
                        <Button
                          variant={r.vacant_beds_count > 0 ? 'primary' : 'secondary'}
                          size="sm"
                          disabled={r.vacant_beds_count === 0}
                        >
                          {r.vacant_beds_count > 0 ? 'Select for Application' : 'Fully Occupied'}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '2.5rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              No rooms configured on this floor.
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          No residential blocks configured for this hostel complex.
        </div>
      )}
    </div>
  );
};
