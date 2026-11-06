import React from 'react';
import { Link } from 'react-router-dom';
import { HostelSummary } from '../../types/hostel';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface HostelCardProps {
  hostel: HostelSummary;
}

export const HostelCard: React.FC<HostelCardProps> = ({ hostel }) => {
  const isBoys = hostel.gender_policy === 'MALE';
  const isGirls = hostel.gender_policy === 'FEMALE';

  return (
    <Card hoverable style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Badge variant={isBoys ? 'primary' : isGirls ? 'warning' : 'neutral'}>
          {hostel.gender_policy_display}
        </Badge>
        <Badge variant={hostel.status === 'ACTIVE' ? 'success' : 'danger'}>
          {hostel.status_display}
        </Badge>
      </div>

      {/* Building Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 600 }}>
          {hostel.name}
        </h3>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          CODE: {hostel.code} • LPU Campus
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
          flex: 1,
          marginBottom: '1.25rem',
        }}
      >
        {hostel.description || 'Full residential amenities, study rooms, 24/7 security and high-speed Wi-Fi.'}
      </p>

      {/* Building Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Capacity
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{hostel.total_beds} Beds</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Vacant
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.9375rem',
              color: hostel.vacant_beds > 0 ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {hostel.vacant_beds} Free
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Occupancy
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{hostel.occupancy_pct}%</div>
        </div>
      </div>

      {/* Price & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>From (10 Mo)</div>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
            {hostel.min_standard_fee ? `₹${hostel.min_standard_fee.toLocaleString('en-IN')}` : 'Variable'}
          </div>
        </div>
        <Link to={`/hostels/${hostel.id}`} style={{ textDecoration: 'none' }}>
          <Button variant="outline" size="sm">
            View Rooms &rarr;
          </Button>
        </Link>
      </div>
    </Card>
  );
};
