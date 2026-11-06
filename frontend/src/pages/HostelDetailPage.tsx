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
        <h2 style={{ color: 'var(--color-danger)' }}>Hostel Not Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/hostels">
          <Button variant="outline">Back to Hostels Directory</Button>
        </Link>
      </div>
    );
  }

  const activeBlock = hostel.blocks[selectedBlockIdx] || hostel.blocks[0];
  const activeFloor = activeBlock?.floors[selectedFloorIdx] || activeBlock?.floors[0];

  return (
    <div className="container">
      {/* Breadcrumb & Navigation */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Link to="/hostels" style={{ textDecoration: 'none', color: 'var(--color-primary)', fontSize: '0.875rem' }}>
          &larr; Back to Hostels Directory
        </Link>
      </div>

      {/* Hero Header */}
      <div
        style={{
          padding: '2rem',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <Badge variant={hostel.gender_policy === 'MALE' ? 'primary' : 'warning'}>
                {hostel.gender_policy_display}
              </Badge>
              <Badge variant="success">{hostel.status_display}</Badge>
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              {hostel.name}
            </h1>
            <div style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
              Complex Code: <strong>{hostel.code}</strong> • Lovely Professional University
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Total Beds
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                {hostel.total_beds}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Vacant Beds
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                {hostel.vacant_beds}
              </div>
            </div>
          </div>
        </div>

        {hostel.description && (
          <p style={{ margin: '1.25rem 0 0', color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            {hostel.description}
          </p>
        )}
      </div>

      {/* Block & Floor Selector */}
      {hostel.blocks.length > 0 ? (
        <div>
          {/* Block Selector */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
            {hostel.blocks.map((block, idx) => (
              <button
                key={block.id}
                onClick={() => {
                  setSelectedBlockIdx(idx);
                  setSelectedFloorIdx(0);
                }}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedBlockIdx === idx ? 'var(--color-primary)' : 'transparent',
                  color: selectedBlockIdx === idx ? '#ffffff' : 'var(--color-text-secondary)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {block.name}
              </button>
            ))}
          </div>

          {/* Floor Selector */}
          {activeBlock && activeBlock.floors.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {activeBlock.floors.map((fl, fIdx) => (
                <button
                  key={fl.id}
                  onClick={() => setSelectedFloorIdx(fIdx)}
                  style={{
                    padding: '0.375rem 0.875rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    border: '1px solid',
                    borderColor: selectedFloorIdx === fIdx ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: selectedFloorIdx === fIdx ? 'var(--color-primary-light)' : 'transparent',
                    color: selectedFloorIdx === fIdx ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  {fl.label} ({fl.rooms.length} Rooms)
                </button>
              ))}
            </div>
          )}

          {/* Rooms Grid for Selected Floor */}
          {activeFloor && activeFloor.rooms.length > 0 ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                  {activeBlock.name} — {activeFloor.label} Rooms
                </h3>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Showing {activeFloor.rooms.length} room units
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <Badge variant="primary" size="sm">{r.capacity}-Seater</Badge>
                        <Badge variant={r.is_air_conditioned ? 'info' : 'neutral'} size="sm">
                          {r.is_air_conditioned ? '❄️ AC' : '💨 Cooler'}
                        </Badge>
                      </div>
                      <Badge variant={r.vacant_beds_count > 0 ? 'success' : 'danger'} size="sm">
                        {r.vacant_beds_count > 0 ? `${r.vacant_beds_count} Vacant` : 'Full'}
                      </Badge>
                    </div>

                    <div style={{ marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                        Room {r.room_number}
                      </h4>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {r.category_display} • {r.washroom_type}
                      </div>
                    </div>

                    {r.quota_kwh && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                        ⚡ Quota: <strong>{r.quota_kwh} kWh</strong> / session
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                        Beds Status:
                      </div>
                      <BedIndicator beds={r.beds} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
                      <div>
                        {r.standard_fee && (
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            ₹{r.standard_fee.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <Link to={`/apply?room=${r.id}`} style={{ textDecoration: 'none' }}>
                        <Button variant="primary" size="sm" disabled={r.vacant_beds_count === 0}>
                          {r.vacant_beds_count > 0 ? 'Apply for Room' : 'Occupied'}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No rooms configured on this floor.
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No blocks or rooms configured yet for this hostel.
        </div>
      )}
    </div>
  );
};
