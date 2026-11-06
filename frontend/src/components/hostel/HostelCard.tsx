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
  return (
    <Card hoverable style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--surface)' }}>
      {/* Top Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
        <Badge variant="neutral">
          {hostel.gender_policy_display}
        </Badge>
        <Badge variant={hostel.status === 'ACTIVE' ? 'success' : 'danger'}>
          {hostel.status_display}
        </Badge>
      </div>

      {/* Building Header */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--ink)' }}>
          {hostel.name}
        </h3>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Code: <strong>{hostel.code}</strong> • LPU Residential Tower
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text)',
          lineHeight: 1.5,
          flex: 1,
          marginBottom: '1.25rem',
        }}
      >
        {hostel.description || 'Full residential amenities, quiet study rooms, 24/7 security and high-speed Wi-Fi.'}
      </p>

      {/* Building Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          padding: '0.75rem',
          backgroundColor: '#FAF8F3',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Capacity
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ink)' }} className="tabular-nums">
            {hostel.total_beds} Beds
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Vacant
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: '0.9375rem',
              color: hostel.vacant_beds > 0 ? 'var(--status-success)' : 'var(--status-danger)',
            }}
            className="tabular-nums"
          >
            {hostel.vacant_beds} Free
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Occupancy
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--ink)' }} className="tabular-nums">
            {hostel.occupancy_pct}%
          </div>
        </div>
      </div>

      {/* Price & Action */}
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
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>10-Mo Session Fee</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.0625rem', color: 'var(--ink)' }} className="tabular-nums">
            {hostel.min_standard_fee ? `₹${Number(hostel.min_standard_fee).toLocaleString('en-IN')}` : 'Variable'}
          </div>
        </div>
        <Link to={`/hostels/${hostel.id}`} style={{ textDecoration: 'none' }}>
          <Button variant="secondary" size="sm">
            View Rooms &rarr;
          </Button>
        </Link>
      </div>
    </Card>
  );
};
